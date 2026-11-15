/**
 * A scroll scene: a film drawn on a pinned canvas in step with the scroll, forwards and backwards. A section names its
 * scene in `data-scene`; the scene's frame manifest is assets/js/scenes/<name>.js.
 *
 * - The scroll sets a target film frame; a critically damped spring carries the shown frame there, so the film eases
 *   in and out of every wheel step and always comes to rest on a real frame.
 * - Frames load coarse to fine once the section is a screen away; only the few around the shown one are decoded.
 * - The film never rests inside a move: when the scroll stops there, the page glides on to the move's end (or back to
 *   its start when it had barely begun), so a stop is always in frame.
 * - Captions change at the middle of each move; a chapter rail fills with the film.
 * - Reduced motion, save-data and no scripts show the stops as stills with their captions (styles and markup).
 */
import { PORTRAIT_STAGE_QUERY, captionAt, filmTime, isSlowConnection, nearestKeyframe, pickScrubSet, pinnedProgress, segmentFill, settleFrame, springStep } from "./scrub-math.js";
import { ScrubPlayer, supportsAvif } from "./scrub-player.js";

/** On a slow link only every second frame loads; the film still runs, in wider steps. */
const SLOW_STRIDES = [8, 4, 2];

/** Spring pace (rad/s): trails a steady scroll by about 80 ms and settles about 0.2 s after it stops. */
const SCRUB_OMEGA = 24;

/** A scene's name is a file name of this site: lower-case words joined by hyphens. */
const SCENE_NAME = /^[a-z]+(-[a-z]+)*$/;

/** How long the scroll must rest before a film stopped inside a move finishes it. */
const SETTLE_IDLE_MS = 180;

function mount(section, manifest) {
  const { moves: SCENE_MOVES, revision: SCENE_REVISION, sets: SCENE_SETS, span: SCENE_SPAN } = manifest;
  const intro = section.querySelector(".scene__intro");
  const stage = section.querySelector(".scene__stage");
  const canvas = section.querySelector(".scene__canvas");
  const captions = [...section.querySelectorAll(".scene__caption")];
  const segments = [...section.querySelectorAll(".scene__seg")];
  if (!stage || !canvas || captions.length === 0) return;

  const portrait = window.matchMedia(PORTRAIT_STAGE_QUERY);
  const starts = captions.map((caption) => Number(caption.dataset.at));
  const fills = [];
  let set = SCENE_SETS[pickScrubSet(portrait.matches, stage.clientWidth, window.devicePixelRatio || 1)];
  let player = null;
  let raf = 0;
  let last = 0;
  let visible = false;
  let shownCaption = -1;

  // Where the stage stands in the section before it pins: below the heading.
  const from = () => (intro ? intro.offsetTop + intro.offsetHeight : 0);
  const progress = () => {
    const s = section.getBoundingClientRect();
    const g = stage.getBoundingClientRect();
    return pinnedProgress(s.top, s.height, g.top, g.height, from());
  };
  // The film frame the scroll asks for, snapped to a kept frame so the spring always rests on a real one.
  const target = () => {
    const k = nearestKeyframe(set.frames, filmTime(progress(), SCENE_SPAN));
    return k < 0 ? 0 : set.frames[k];
  };
  let spring = { x: target(), v: 0 };

  const paint = () => {
    const p = spring.x / SCENE_SPAN;
    player?.show(spring.x, spring.v);
    const active = Math.max(0, captionAt(p, starts));
    if (active !== shownCaption) {
      shownCaption = active;
      captions.forEach((caption, i) => {
        caption.classList.toggle("is-active", i === active);
        caption.classList.toggle("is-past", i < active);
        caption.classList.toggle("is-next", i > active);
        if (i === active) {
          caption.setAttribute("aria-current", "step");
          caption.removeAttribute("aria-hidden");
        } else {
          caption.removeAttribute("aria-current");
          caption.setAttribute("aria-hidden", "true");
        }
      });
      segments.forEach((segment, i) => segment.classList.toggle("is-active", i === active));
    }
    segments.forEach((segment, k) => {
      const fill = Math.round(segmentFill(p, starts, k) * 1000) / 1000;
      if (fills[k] !== fill) {
        fills[k] = fill;
        segment.style.setProperty("--f", String(fill));
      }
    });
  };

  const tick = (now) => {
    const goal = target();
    spring = springStep(spring, goal, now - last, SCRUB_OMEGA, 0.05);
    last = now;
    paint();
    // Runs while the film moves and stops once it rests, so a still page costs no frames.
    raf = spring.x !== goal ? requestAnimationFrame(tick) : 0;
  };
  const run = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (player) return;
    supportsAvif().then((avif) => {
      if (player) return;
      player = new ScrubPlayer(canvas, set, {
        ext: avif ? "avif" : "webp",
        revision: SCENE_REVISION,
        cache: set.width * set.height > 1.2e6 ? 22 : 32,
        strides: isSlowConnection(navigator.connection) ? SLOW_STRIDES : undefined,
        onFrame: () => {
          if (!raf) player?.show(spring.x, 0);
        },
      });
      player.load(spring.x);
      player.show(spring.x, 1);
    });
  };

  // Start fetching a screen before the section arrives.
  new IntersectionObserver(([entry]) => entry.isIntersecting && start(), { rootMargin: "100% 0px" }).observe(section);
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible) return;
    // Entering after a jump (an anchor, a restored scroll): start on the right frame instead of easing through the film.
    if (!raf) spring = { x: target(), v: 0 };
    paint();
    run();
  }).observe(section);

  // Never rest inside a move. A finger on the screen, or any new scroll, wins.
  let lastY = window.scrollY;
  let dir = 0;
  let idle = 0;
  let touching = false;
  const settle = () => {
    if (!visible || touching) return;
    const p = progress();
    if (p <= 0 || p >= 1) return;
    const frame = settleFrame(filmTime(p, SCENE_SPAN), dir, SCENE_MOVES);
    if (frame === null) return;
    const travel = section.getBoundingClientRect().height - stage.getBoundingClientRect().height - from();
    const delta = (frame / SCENE_SPAN - p) * travel;
    if (Math.abs(delta) < 2) return;
    window.scrollTo({ top: window.scrollY + delta, behavior: "smooth" });
  };
  window.addEventListener(
    "scroll",
    () => {
      const y = window.scrollY;
      if (y !== lastY) dir = Math.sign(y - lastY);
      lastY = y;
      window.clearTimeout(idle);
      if (visible) {
        run();
        idle = window.setTimeout(settle, SETTLE_IDLE_MS);
      }
    },
    { passive: true },
  );
  window.addEventListener("resize", () => visible && run(), { passive: true });
  window.addEventListener(
    "touchstart",
    () => {
      touching = true;
      window.clearTimeout(idle);
    },
    { passive: true },
  );
  const onTouchEnd = () => {
    touching = false;
    window.clearTimeout(idle);
    if (visible) idle = window.setTimeout(settle, SETTLE_IDLE_MS);
  };
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("touchcancel", onTouchEnd, { passive: true });

  // A stage that turns (a rotated phone, a resized window) needs the other cut.
  portrait.addEventListener("change", () => {
    set = SCENE_SETS[pickScrubSet(portrait.matches, stage.clientWidth, window.devicePixelRatio || 1)];
    player?.destroy();
    player = null;
    spring = { x: target(), v: 0 };
    start();
  });

  paint();
}

export function initScene(doc = document) {
  const sections = [...doc.querySelectorAll("[data-scene]")];
  if (sections.length === 0) return;
  const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches || navigator.connection?.saveData === true;
  for (const section of sections) {
    const name = section.dataset.scene;
    if (still || !("IntersectionObserver" in window) || !SCENE_NAME.test(name)) {
      section.classList.add("is-static");
      continue;
    }
    // Each scene has its own frame manifest, loaded from this site only when the page holds that scene.
    import(`./scenes/${name}.js`).then(
      ({ default: manifest }) => mount(section, manifest),
      () => section.classList.add("is-static"),
    );
  }
}
