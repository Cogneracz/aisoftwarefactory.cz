/**
 * Switching language without losing the place. On a click on the bar's language link the position on screen (the section
 * under a line 35 % down the viewport, by its number on the page, and the share of the section above that line) is
 * appended to the link as "#@<number>:<share>"; the other page restores it before its first paint (src/lib/lang-switch.mjs, inline) and removes it from
 * the address. A share, not pixels: the two languages' texts differ in length, and pinned sections are equally tall in
 * both, so the same share is the same film frame and the same step. A number, not an id: the two languages' pages have
 * the same sections in the same order, but not always the same ids. Nothing is stored anywhere.
 */

/** Share of the viewport's height, from its top, of the line whose place is kept. */
export const REFERENCE = 0.35;

/** The sections a place can be in: those with an id under main, and the modules' story as one block. */
export const PLACE_SECTIONS = "main section[id]:not(.story__chapter), main .story[id]";

/**
 * The place of a viewport: which of `sections` (each { top, height } in viewport coordinates, in page order) covers the
 * reference line, and the share of it above the line (0 to 1, four decimals). Null above the first section, below the
 * last, or for a viewport without height.
 */
export function positionAt(sections, viewportHeight) {
  if (!Array.isArray(sections)) throw new TypeError("positionAt: a list of sections is required");
  if (!Number.isFinite(viewportHeight) || viewportHeight <= 0) return null;
  const line = viewportHeight * REFERENCE;
  for (let index = 0; index < sections.length; index++) {
    const s = sections[index];
    if (!s || !Number.isFinite(s.top) || !(s.height > 0)) continue;
    if (s.top <= line && line < s.top + s.height) return { index, share: Math.round(((line - s.top) / s.height) * 10000) / 10000 };
  }
  return null;
}

/** The fragment that carries a place: "#@2:0.612" (the third section, 61.2 % through), or nothing for no place. */
export function fragmentOf(position) {
  if (!position || !Number.isInteger(position.index) || position.index < 0 || position.index > 99) return "";
  const share = Math.min(Math.max(Number(position.share) || 0, 0), 1);
  return `#@${position.index}:${share}`;
}

/** How long after the click the navigation may still be the language switch, in milliseconds. */
const SWITCH_WINDOW = 3000;

/** On the root while a switch started under the open phone menu is leaving the page (styles/lang-transition.css). */
export const UNDER_MENU = "is-lang-under-menu";

export function initLang() {
  const root = document.documentElement;
  const settle = () => {
    window.__lang = false;
    root.classList.remove(UNDER_MENU);
  };
  // A page that comes back from the back-forward cache starts clean.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) settle();
  });
  for (const link of document.querySelectorAll("a.site-nav__lang")) {
    const plain = link.getAttribute("href");
    if (!plain) continue;
    const mark = () => {
      const sections = [...document.querySelectorAll(PLACE_SECTIONS)].map((el) => {
        const r = el.getBoundingClientRect();
        return { top: r.top, height: r.height };
      });
      link.setAttribute("href", plain.split("#")[0] + fragmentOf(positionAt(sections, window.innerHeight)));
    };
    link.addEventListener("click", (event) => {
      mark();
      // Only a plain click navigates this page: that navigation is the one that may blend (the head's gate reads the flag).
      if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        window.__lang = true;
        // The menu closes on this same click, after this handler: what it covered is remembered here.
        root.classList.toggle(UNDER_MENU, root.classList.contains("is-menu-open"));
        setTimeout(settle, SWITCH_WINDOW);
      }
    });
    // A new tab or a copied link keeps the place too.
    link.addEventListener("auxclick", mark);
    link.addEventListener("contextmenu", mark);
  }
}
