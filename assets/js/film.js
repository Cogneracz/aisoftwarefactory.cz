/**
 * The site's 3D films. Each film is a still picture in the page; with scripts and without a reduced-motion or
 * save-data preference the still is joined by a muted video that plays while it is on screen: a loop goes on, any
 * other film plays once and holds its last frame.
 */

/** What a film does for this visitor: "still" (the picture only), "loop" or "once". */
export function filmPlan({ loop = false, reducedMotion = false, saveData = false } = {}) {
  if (reducedMotion || saveData) return "still";
  return loop ? "loop" : "once";
}

/** Which cut a film shows: the 4:5 one when it is forced or the viewport is a phone's, else the 16:9 one. */
export function filmCut({ forced, narrow }) {
  if (forced === "small" || forced === "large") return forced;
  return narrow ? "small" : "large";
}

/** A film's addresses must come from this site. */
export function filmSource(figure, cut) {
  const src = figure.dataset[cut === "small" ? "filmSmall" : "filmLarge"];
  if (typeof src !== "string" || !/^\/(?!\/)/.test(src)) throw new Error(`film: a film must come from this site, got ${String(src)}`);
  return src;
}

function mount(figure, narrow) {
  const plan = filmPlan({ loop: figure.dataset.filmLoop !== undefined });
  const cut = filmCut({ forced: figure.dataset.filmCut, narrow });
  const video = document.createElement("video");
  video.className = "film__video";
  video.muted = true;
  video.playsInline = true;
  video.loop = plan === "loop";
  video.preload = "none";
  video.setAttribute("aria-hidden", "true");
  video.tabIndex = -1;
  video.src = filmSource(figure, cut);
  let played = false;
  // The picture stays until the video really shows frames, so there is never an empty box.
  video.addEventListener("playing", () => figure.classList.add("is-playing"), { once: true });
  figure.append(video);
  new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        if (plan === "once" && played) return;
        played = true;
        video.play().catch(() => {});
      } else if (plan === "loop") video.pause();
    },
    { threshold: 0.15 },
  ).observe(figure);
}

/** The native hero player stays usable with sound when automatic playback is unavailable. */
function watchPromo(video, doc, win, reducedMotion) {
  const connection = win.navigator.connection;
  const prefersStill = () => reducedMotion.matches || connection?.saveData === true;
  if (prefersStill() || !video.paused || video.currentTime !== 0) return;

  let visible = false;
  let attempted = false;
  const listeners = new AbortController();
  const options = { signal: listeners.signal };
  const observer = new win.IntersectionObserver((entries) => {
    visible = entries.at(-1).isIntersecting;
    update();
  });

  function release() {
    listeners.abort();
    observer.disconnect();
  }

  function update() {
    if (listeners.signal.aborted) return;
    if (!visible || doc.hidden || prefersStill()) {
      // Only an untouched, automatically started film belongs to the page.
      if (attempted) {
        release();
        video.pause();
      }
      return;
    }
    if (attempted) return;
    attempted = true;
    const previousMute = video.muted;
    video.muted = true;
    video.play().catch(() => {
      // A rejected automatic start leaves native Play ready for the visitor.
      if (video.paused && !listeners.signal.aborted) video.muted = previousMute;
      release();
    });
  }

  // Once the visitor uses the controls, scrolling and tab switches are theirs too.
  for (const event of ["pointerdown", "keydown", "pause", "ended"]) video.addEventListener(event, release, options);
  video.addEventListener("play", () => { if (!attempted) release(); }, options);
  video.addEventListener("volumechange", () => { if (!video.muted) release(); }, options);
  doc.addEventListener("visibilitychange", update, options);
  reducedMotion.addEventListener("change", update, options);
  connection?.addEventListener("change", update, options);
  observer.observe(video);
}

export function initFilms(doc = document) {
  const win = doc.defaultView;
  if (!win?.IntersectionObserver) return;
  const reducedMotion = win.matchMedia("(prefers-reduced-motion: reduce)");
  const promo = doc.querySelector("video[data-hero-promo]");
  if (promo) watchPromo(promo, doc, win, reducedMotion);
  const figures = [...doc.querySelectorAll("[data-film]")];
  if (figures.length === 0) return;
  const saveData = win.navigator.connection?.saveData === true;
  if (filmPlan({ reducedMotion: reducedMotion.matches, saveData }) === "still") {
    // The picture of a film that cannot play is its last frame (the styles read this class).
    figures.forEach((figure) => figure.classList.add("is-still"));
    return;
  }
  const narrow = win.matchMedia("(max-width: 767px)").matches;
  for (const figure of figures) mount(figure, narrow);
}
