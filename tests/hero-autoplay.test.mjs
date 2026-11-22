import assert from "node:assert/strict";
import test from "node:test";
import { initFilms } from "../assets/js/film.js";

function createPage({ hidden = false, reduced = false, saveData = false, denied = false, observerAvailable = true } = {}) {
  const video = Object.assign(new EventTarget(), { paused: true, muted: false, currentTime: 0, starts: 0 });
  video.play = async () => {
    video.starts++;
    if (denied && video.starts === 1) throw new Error("Automatic playback denied");
    video.paused = false;
    video.dispatchEvent(new Event("play"));
  };
  video.pause = () => {
    video.paused = true;
    video.dispatchEvent(new Event("pause"));
  };
  const motion = Object.assign(new EventTarget(), { matches: reduced });
  const connection = Object.assign(new EventTarget(), { saveData });
  let notify;
  class Observer {
    constructor(callback) { this.callback = callback; }
    observe(target) { assert.equal(target, video); notify = this.callback; }
    disconnect() { notify = undefined; }
  }
  const doc = Object.assign(new EventTarget(), {
    hidden, defaultView: {
      IntersectionObserver: observerAvailable ? Observer : undefined,
      matchMedia: () => motion, navigator: { connection },
    },
    querySelector: (selector) => selector === "video[data-hero-promo]" ? video : null,
    querySelectorAll: () => [],
  });
  initFilms(doc);
  return {
    video, motion, connection,
    inView(value) { notify?.([{ isIntersecting: value }]); },
    hide(value) { doc.hidden = value; doc.dispatchEvent(new Event("visibilitychange")); },
  };
}

test("a visible hero starts once with muted audio; a hidden document waits until foregrounded", () => {
  const screen = createPage({ hidden: true });
  screen.inView(true);
  assert.equal(screen.video.starts, 0);
  screen.hide(false);
  screen.inView(true);
  assert.equal(screen.video.starts, 1);
  assert.equal(screen.video.muted, true);
  assert.equal(screen.video.paused, false);
});

test("a deep link below the hero never downloads the movie until the visitor reaches it", () => {
  const screen = createPage();
  screen.inView(false);
  screen.hide(false);
  assert.equal(screen.video.starts, 0);
  screen.inView(true);
  assert.equal(screen.video.starts, 1);
});

test("a reduced-motion or data-saving preference, or no observer, leaves Play available with sound", async () => {
  for (const options of [{ reduced: true }, { saveData: true }, { observerAvailable: false }]) {
    const screen = createPage(options);
    screen.inView(true);
    assert.equal(screen.video.starts, 0);
    assert.equal(screen.video.muted, false);
    await screen.video.play();
    assert.equal(screen.video.paused, false);
  }
});

test("manual playback before intersection and manual unmute or pause after it take precedence", async () => {
  const manual = createPage();
  await manual.video.play();
  manual.inView(true);
  assert.equal(manual.video.muted, false);
  assert.equal(manual.video.starts, 1);
  const screen = createPage();
  screen.inView(true);
  screen.video.muted = false;
  screen.video.dispatchEvent(new Event("volumechange"));
  screen.inView(false);
  assert.equal(screen.video.paused, false);
  screen.video.pause();
  screen.inView(true);
  assert.equal(screen.video.starts, 1);
  assert.equal(screen.video.muted, false);
  const paused = createPage();
  paused.inView(true);
  paused.video.pause();
  paused.inView(false);
  paused.inView(true);
  assert.equal(paused.video.starts, 1);
});

test("hiding the tab or turning on a playback preference stops untouched automatic playback", () => {
  for (const change of ["hidden", "motion", "data"]) {
    const screen = createPage();
    screen.inView(true);
    if (change === "hidden") screen.hide(true);
    if (change === "motion") {
      screen.motion.matches = true;
      screen.motion.dispatchEvent(new Event("change"));
    }
    if (change === "data") {
      screen.connection.saveData = true;
      screen.connection.dispatchEvent(new Event("change"));
    }
    assert.equal(screen.video.paused, true);
    screen.hide(false);
    screen.inView(true);
    assert.equal(screen.video.starts, 1);
  }
});

test("when the browser refuses autoplay the visitor can press Play with the original sound", async () => {
  const screen = createPage({ denied: true });
  screen.inView(true);
  await Promise.resolve();
  assert.equal(screen.video.muted, false);
  assert.equal(screen.video.paused, true);
  screen.inView(true);
  assert.equal(screen.video.starts, 1);
  await screen.video.play();
  assert.equal(screen.video.paused, false);
  assert.equal(screen.video.muted, false);
});
