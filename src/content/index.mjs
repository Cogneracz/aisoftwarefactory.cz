/**
 * The site's content in every language. Components read the content of the language being rendered through
 * `content()`; the two languages have the same shape, which tests/i18n.test.mjs checks key by key.
 */
import { assertLocale, currentLocale } from "../i18n/index.mjs";
import { CS } from "./cs.mjs";
import { EN } from "./en/index.mjs";

export const CONTENT = { cs: CS, en: EN };

/** The content of a language: the one being rendered unless another is named. */
export function content(locale = currentLocale()) {
  return CONTENT[assertLocale(locale)];
}
