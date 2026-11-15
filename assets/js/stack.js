/**
 * The deck of systems on the home page (src/components/reference-showcase.mjs): where motion is welcome and every card
 * fits the screen, the cards stick under the bar one over another as the page scrolls. This script only measures: how
 * far each card is covered by the next (`--cover`, 0 to 1) and how far it still is from its place (`--drift`, 1 to 0);
 * the styles turn the two into the covered card's step back and the arriving picture's drift.
 */

/** Share of a card (0 to 1) covered by the card after it: both stick at the same place, so the next one slides over. */
export function coverShare(top, height, nextTop) {
  if (![top, height, nextTop].every(Number.isFinite) || height <= 0) return 0;
  return Math.min(Math.max((top + height - nextTop) / height, 0), 1);
}

/** How far a card still is from the place it sticks at: 1 at the viewport's bottom edge or below, 0 once it sticks. */
export function driftShare(top, stickTop, viewportHeight) {
  if (![top, stickTop, viewportHeight].every(Number.isFinite) || viewportHeight <= stickTop) return 0;
  return Math.min(Math.max((top - stickTop) / (viewportHeight - stickTop), 0), 1);
}

/** Whether the deck may stack: the tallest card and the edges of the cards under it must fit under the bar. */
export function deckFits(heights, stickTop, viewportHeight, step = 16) {
  if (!Array.isArray(heights) || heights.length < 2 || !heights.every((h) => Number.isFinite(h) && h > 0)) return false;
  return Math.max(...heights) + (heights.length - 1) * step + stickTop + step <= viewportHeight;
}

export function initStack() {
  const list = document.querySelector(".refs[data-stack]");
  if (!list || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const items = [...list.children];
  if (items.length < 2) return;
  const shown = items.map(() => ({ cover: -1, drift: -1 }));
  let raf = 0;
  let near = false;

  const stickTop = () => parseFloat(getComputedStyle(items[0]).top) || 0;
  const measure = () => {
    raf = 0;
    if (!list.classList.contains("is-stack")) return;
    const top = stickTop();
    const rects = items.map((el) => ({ top: el.getBoundingClientRect().top, height: el.offsetHeight }));
    items.forEach((el, i) => {
      const next = rects[i + 1];
      const cover = Math.round((next ? coverShare(rects[i].top, rects[i].height, next.top) : 0) * 1000) / 1000;
      const drift = Math.round(driftShare(rects[i].top, top, window.innerHeight) * 1000) / 1000;
      if (shown[i].cover !== cover) el.style.setProperty("--cover", String((shown[i].cover = cover)));
      if (shown[i].drift !== drift) el.style.setProperty("--drift", String((shown[i].drift = drift)));
    });
  };
  const request = () => {
    if (!raf && near) raf = requestAnimationFrame(measure);
  };
  // Stacking is decided from the cards' natural heights, so the class is off while they are measured.
  const decide = () => {
    list.classList.remove("is-stack");
    const fits = deckFits(items.map((el) => el.offsetHeight), parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 96, window.innerHeight);
    list.classList.toggle("is-stack", fits);
    if (!fits) for (const el of items) for (const name of ["--cover", "--drift"]) el.style.removeProperty(name);
    shown.forEach((s) => Object.assign(s, { cover: -1, drift: -1 }));
    request();
  };

  new IntersectionObserver(
    ([entry]) => {
      near = entry.isIntersecting;
      request();
    },
    { rootMargin: "50% 0px" },
  ).observe(list);
  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", decide);
  // Pictures arriving change the cards' heights.
  for (const img of list.querySelectorAll("img")) if (!img.complete) img.addEventListener("load", decide, { once: true });
  decide();
}
