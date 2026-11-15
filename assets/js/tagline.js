/**
 * The tagline's words light up one by one with the scroll. Two pure functions carry the logic; `initTagline` binds one
 * scroll listener, throttled through requestAnimationFrame, only while the paragraph is on screen.
 */

/** Where the paragraph's top starts counting and where its bottom stops, as shares of the viewport height. */
export const TAGLINE_RANGE = { start: 0.85, end: 0.45 };

/**
 * How far the paragraph has travelled: 0 when its top reaches 85 % of the viewport height, 1 when its bottom reaches
 * 45 %. Invalid input gives 0.
 */
export function sectionProgress(top, height, viewport) {
  if (![top, height, viewport].every(Number.isFinite) || viewport <= 0 || height < 0) return 0;
  const start = viewport * TAGLINE_RANGE.start;
  const travel = start - viewport * TAGLINE_RANGE.end + height;
  return Math.min(Math.max((start - top) / travel, 0), 1);
}

/** How many of `count` words are lit at a progress of 0 to 1. A progress that is not a number lights none. */
export function activeWords(progress, count) {
  if (!Number.isInteger(count) || count < 0) throw new RangeError(`activeWords: the count must be a whole number of 0 or more, got ${String(count)}`);
  if (!Number.isFinite(progress)) return 0;
  return Math.min(count, Math.max(0, Math.round(progress * count)));
}

export function initTagline(doc = document) {
  const paragraph = doc.querySelector("[data-tagline]");
  if (!paragraph) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const words = [...paragraph.querySelectorAll(".tagline__word")];
  let lit = -1;
  let queued = false;
  let bound = false;
  const update = () => {
    queued = false;
    const rect = paragraph.getBoundingClientRect();
    const count = activeWords(sectionProgress(rect.top, rect.height, window.innerHeight), words.length);
    if (count === lit) return;
    words.forEach((word, i) => word.classList.toggle("is-on", i < count));
    lit = count;
  };
  const onScroll = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(update);
  };
  update();
  if (!("IntersectionObserver" in window)) {
    window.addEventListener("scroll", onScroll, { passive: true });
    return;
  }
  new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting && !bound) {
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll, { passive: true });
      bound = true;
    } else if (!entry.isIntersecting && bound) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      bound = false;
    }
    update();
  }).observe(paragraph);
}
