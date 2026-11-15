/**
 * The home page's opening (the stacked hero): as the visitor scrolls it away, its words rise and fade and the film moves
 * slowly closer. This script only measures how far the hero has left the screen (`--o`, 0 to 1); the styles in
 * src/styles/hero.css do the rest. Nothing moves with reduced motion or without the script.
 */

/** How far a section has left the top of the screen: 0 while its top is at or below the top, 1 once it is gone. */
export function openingShare(top, height) {
  if (!Number.isFinite(top) || !Number.isFinite(height) || height <= 0) return 0;
  return Math.min(Math.max(-top / height, 0), 1);
}

export function initOpening() {
  const hero = document.querySelector(".hero--stacked");
  if (!hero || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  let raf = 0;
  let near = false;
  let shown = -1;
  const measure = () => {
    raf = 0;
    const r = hero.getBoundingClientRect();
    const o = Math.round(openingShare(r.top, r.height) * 1000) / 1000;
    if (o !== shown) hero.style.setProperty("--o", String((shown = o)));
  };
  const request = () => {
    if (!raf && near) raf = requestAnimationFrame(measure);
  };
  new IntersectionObserver(([entry]) => {
    near = entry.isIntersecting;
    // Leaving the screen, the hero ends fully moved: a fast flick past it never leaves it half way.
    if (!near) hero.style.setProperty("--o", String((shown = 1)));
    request();
  }).observe(hero);
  window.addEventListener("scroll", request, { passive: true });
  request();
}
