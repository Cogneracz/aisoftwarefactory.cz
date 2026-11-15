/**
 * Small HTML helpers for the components: everything that reaches a page as text goes through `esc` or `t`.
 */
import { typo, NBSP } from "./typo.mjs";

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

/** Escapes a value for HTML text and for a double-quoted attribute. */
export function esc(value) {
  if (value === null || value === undefined) throw new TypeError("esc: a value is required");
  return String(value).replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Copy as it is printed: Czech typography (typo.mjs), escaped, the non-breaking spaces written as entities. */
export function t(text) {
  return esc(typo(text)).replaceAll(NBSP, "&nbsp;");
}

/**
 * Attributes from an object, in the object's order, with a leading space. `false`, `null` and `undefined` leave an
 * attribute out; `true` gives a bare attribute.
 */
export function attrs(map) {
  if (map === null || typeof map !== "object") throw new TypeError("attrs: an object is required");
  let out = "";
  for (const [name, value] of Object.entries(map)) {
    if (!/^[a-zA-Z_:][a-zA-Z0-9_:.-]*$/.test(name)) throw new Error(`attrs: invalid attribute name ${JSON.stringify(name)}`);
    if (value === false || value === null || value === undefined) continue;
    out += value === true ? ` ${name}` : ` ${name}="${esc(value)}"`;
  }
  return out;
}

/** Class names joined by a space; empty and false ones are skipped. */
export function cls(...names) {
  return names.filter((name) => typeof name === "string" && name.trim() !== "").join(" ");
}

/** JSON for a script element: "<" is escaped, so no text can close the element. */
export function jsonForScript(data) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/** A required, non-empty string; `what` names it in the error. */
export function need(value, what) {
  if (typeof value !== "string" || value.trim() === "") throw new Error(`${what} is required`);
  return value;
}
