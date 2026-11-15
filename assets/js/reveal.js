/** Delay steps (× --stagger) for elements revealed together: shrinking gaps, capped. */
const WAVE = [0, 1, 1.8, 2.4, 2.8, 3.1];

/** Shows each `.reveal` element once, as it enters the viewport. Elements already passed are shown at once. */
export function initReveal(doc = document) {
  // Elements a language switch has already shown in place (src/lib/lang-switch.mjs primeStages) are left alone.
  const items = [...doc.querySelectorAll(".reveal:not(.is-in)")];
  if (items.length === 0) return;
  const show = (el) => el.classList.add("is-in");
  if (!("IntersectionObserver" in window)) {
    items.forEach(show);
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      // Elements arriving together (a row of cards) are shown in reading order with shrinking gaps, so a row reads in
      // its order instead of appearing at once (emilkowalski/skills choreograph); a lone element has no delay.
      const due = entries
        .filter((entry) => entry.isIntersecting || entry.boundingClientRect.bottom <= 0)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top || a.boundingClientRect.left - b.boundingClientRect.left);
      due.forEach((entry, k) => {
        if (due.length > 1) entry.target.style.setProperty("--i", String(WAVE[Math.min(k, WAVE.length - 1)]));
        show(entry.target);
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px", threshold: 0 },
  );
  items.forEach((el) => observer.observe(el));
}
