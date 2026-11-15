/** Shared small pieces: text with links, buttons and section headings. */
import { attrs, cls, need, t } from "../lib/html.mjs";
import { pathOf } from "../i18n/index.mjs";
import { icon } from "./icons.mjs";

/** Where a link leads: an address (`href`) or a page of the site in the current or a named language (`page`). */
export function hrefOf(link) {
  if (typeof link?.page === "string") return pathOf(link.page, link.locale);
  return need(link?.href, "A link's address");
}

/** Copy that may hold links: a string, or a list of strings and `{ text, href }` or `{ text, page }` links. */
export function rich(content) {
  const parts = typeof content === "string" ? [content] : content;
  if (!Array.isArray(parts) || parts.length === 0) throw new Error("rich: text is required");
  return parts
    .map((part) => {
      if (typeof part === "string") return t(part);
      need(part?.text, "A link's text");
      return `<a class="link" href="${t(hrefOf(part))}">${t(part.text)}</a>`;
    })
    .join("");
}

/**
 * A link's label and the arrow after it, printed so that the last word and the arrow never part: when the label wraps,
 * the arrow moves to the next line with its word instead of standing there alone.
 */
export function arrowLabel(label, arrow) {
  const text = t(need(label, "A link's label"));
  if (typeof arrow !== "string" || !arrow.startsWith("<svg")) throw new Error("arrowLabel: an icon is required");
  const at = text.lastIndexOf(" ");
  return `${text.slice(0, at + 1)}<span class="link__end">${text.slice(at + 1)}${arrow}</span>`;
}

/** A link styled as a button. `variant` is "primary" (the site's action) or "secondary"; `size` is "sm", "md" or "lg". */
export function button(action, { variant = "primary", size = "md", arrow = true, className } = {}) {
  need(action?.label, "A button's label");
  if (typeof action.page !== "string") need(action.href, "A button's address");
  if (!["primary", "secondary"].includes(variant)) throw new Error(`Unknown button variant: ${JSON.stringify(variant)}`);
  if (!["sm", "md", "lg"].includes(size)) throw new Error(`Unknown button size: ${JSON.stringify(size)}`);
  const classes = cls("button", `button--${variant}`, `button--${size}`, className);
  return `<a${attrs({ class: classes, href: hrefOf(action) })}><span>${t(action.label)}</span>${arrow ? icon("arrow-right", { size: size === "sm" ? 14 : 16, className: "icon button__icon" }) : ""}</a>`;
}

/** A section's heading block: an optional caption above, the `h2`, an optional lead. */
export function sectionHead({ eyebrow, heading, lead, id, center = false }) {
  need(heading, "A section's heading");
  return `<header class="${cls("section__head", center && "section__head--center", "reveal")}">${eyebrow ? `<p class="eyebrow">${t(eyebrow)}</p>` : ""}<h2${attrs({ class: "section__title", id })}>${t(heading)}</h2>${lead ? `<p class="section__lead">${rich(lead)}</p>` : ""}</header>`;
}
