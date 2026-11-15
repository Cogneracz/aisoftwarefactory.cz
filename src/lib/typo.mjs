/**
 * Czech typography applied while rendering, so the content files hold plain spaces only: a one-letter preposition or
 * conjunction never ends a line, and an identifier or a grouped number never parts from its value.
 */
export const NBSP = " ";

const ONE_LETTER = /(^|[\s(„"])([ksvzouaiKSVZOUAI]) (?=\S)/g;

/** `text` with non-breaking spaces where Czech typesetting wants them. */
export function typo(text) {
  if (typeof text !== "string") throw new TypeError("typo: a string is required");
  let out = text;
  // Twice: in "a v továrně" the second word starts where the first match ended.
  for (let pass = 0; pass < 2; pass += 1) out = out.replace(ONE_LETTER, `$1$2${NBSP}`);
  return out
    .replace(/\b(IČO|DIČ) (?=\S)/g, `$1${NBSP}`)
    .replace(/(\d) (?=\d)/g, `$1${NBSP}`)
    .replace(/ (s\.r\.o\.)/g, `${NBSP}$1`);
}
