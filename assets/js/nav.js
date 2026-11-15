/**
 * The phone menu. `navState` is the whole behaviour as a pure function; `initNav` only applies its result to the page.
 */
export const NAV_EVENTS = ["toggle", "escape", "navigate", "widen"];

/**
 * The menu's next state after an event. `focus` says where focus goes: to the first link when the menu opens, back to
 * the menu button when the visitor closes it, nowhere when a link was followed or the bar grew wide.
 */
export function navState(state, event) {
  if (state === null || typeof state !== "object" || typeof state.open !== "boolean") throw new TypeError("navState: a state with a boolean `open` is required");
  switch (event) {
    case "toggle":
      return state.open ? { open: false, focus: "toggle" } : { open: true, focus: "first-link" };
    case "escape":
      return { open: false, focus: state.open ? "toggle" : null };
    case "navigate":
    case "widen":
      return { open: false, focus: null };
    default:
      throw new Error(`navState: unknown event ${JSON.stringify(event)}`);
  }
}

export function initNav(doc = document) {
  const toggle = doc.querySelector(".site-nav__toggle");
  const menu = doc.querySelector(".site-nav__menu");
  if (!toggle || !menu) return;
  let state = { open: false };
  const apply = (next) => {
    state = { open: next.open };
    toggle.setAttribute("aria-expanded", String(next.open));
    menu.classList.toggle("is-open", next.open);
    doc.documentElement.classList.toggle("is-menu-open", next.open);
    if (next.focus === "first-link") menu.querySelector("a")?.focus();
    if (next.focus === "toggle") toggle.focus();
  };
  toggle.addEventListener("click", () => apply(navState(state, "toggle")));
  doc.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.open) apply(navState(state, "escape"));
  });
  menu.addEventListener("click", (event) => {
    if (state.open && event.target.closest("a")) apply(navState(state, "navigate"));
  });
  window.matchMedia("(min-width: 768px)").addEventListener("change", (event) => {
    if (event.matches && state.open) apply(navState(state, "widen"));
  });
}
