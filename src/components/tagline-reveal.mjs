/**
 * The large sentence apart from the hero. Every word is its own element so the script (assets/js/tagline.js) can
 * light them one by one with the scroll; the words still read as one plain paragraph.
 */
import { content } from "../content/index.mjs";
import { esc, t } from "../lib/html.mjs";
import { NBSP, typo } from "../lib/typo.mjs";

/** A sentence must run over at least two lines of large type. */
export const MIN_WORDS = 8;

/** The words of a sentence with the separators between them (a space or a non-breaking space). */
export function splitWords(sentence) {
  return typo(sentence)
    .split(new RegExp(`( |${NBSP})`))
    .filter((part) => part !== "");
}

export function taglineReveal({ sentences, label }) {
  if (!Array.isArray(sentences) || sentences.length === 0 || sentences.some((s) => typeof s !== "string" || s.trim() === "")) throw new Error("The tagline needs one or more sentences");
  const isSeparator = (part) => part === " " || part === NBSP;
  const count = sentences.flatMap(splitWords).filter((part) => !isSeparator(part)).length;
  if (count < MIN_WORDS) throw new Error(`The tagline needs ${MIN_WORDS} or more words to run over two lines, got ${count}`);
  const html = sentences
    .map((sentence) => {
      const words = splitWords(sentence)
        .map((part) => (part === " " ? " " : part === NBSP ? "&nbsp;" : `<span class="tagline__word">${esc(part)}</span>`))
        .join("");
      return `<span class="tagline__sentence">${words}</span>`;
    })
    .join(" ");
  return `<section class="tagline" aria-label="${t(label ?? content().ui.taglineLabel)}">
<div class="container">
<p class="tagline__text" data-tagline>${html}</p>
</div>
</section>`;
}
