/** The copy rules of the site: which strings of the content are copy, and what copy may not contain, per language. */

/** Keys whose values are addresses or identifiers, not copy. */
const NOT_COPY = new Set(["slug", "screen", "film", "href", "file", "id", "mark", "page", "cognera", "locale", "lang", "width", "height"]);

/** Every string of a content object that a visitor reads. */
export function copyOf(value, key = "") {
  if (NOT_COPY.has(key)) return [];
  if (typeof value === "string") return [value];
  if (typeof value === "function") return [value("Bellows")];
  if (Array.isArray(value)) return value.flatMap((v) => copyOf(v, key));
  if (value && typeof value === "object") return Object.entries(value).flatMap(([k, v]) => copyOf(v, k));
  return [];
}

const FILLER = {
  cs: /revolu|špičkov|bezkonkuren|nejmodernějš|unikátn/i,
  en: /revolution|supercharg|cutting.edge|effortless|world.class|next level|harness the power|seamless|game.chang|unlock/i,
};

/** Broken copy rules of one string in a language, as short reasons. */
export function copyProblems(text, locale = "cs") {
  const found = [];
  if (/[—–]/.test(text)) found.push("a dash");
  // Czech copy carries no hyphen at all; English keeps its compound words ("red-hot") but no spaced hyphen.
  if (locale === "cs" ? /\S-\S|\s-\s/.test(text) : /\s-\s/.test(text)) found.push("a hyphen");
  if (/!/.test(text)) found.push("an exclamation mark");
  if (/…|\.\.\./.test(text)) found.push("an ellipsis");
  if (/ /.test(text)) found.push("a non-breaking space typed into the source");
  if (/\b(OpenAI|ChatGPT|GPT|Claude|Anthropic|Gemini|Copilot|Codex|Llama|Mistral|Cursor|LLM)\b/i.test(text)) found.push("an AI vendor or model");
  if (/\d\s?%|\b\d+\s?(x|krát|times)\b/i.test(text)) found.push("a metric");
  if (FILLER[locale].test(text)) found.push("a filler word");
  if (locale === "cs" ? /nástroj/i.test(text) : /\btools?\b/i.test(text)) found.push("a module called a tool (Forge has modules, not tools)");
  if (/aplikac\S* (Bellows|Anvil|Temper|Rivet|Harness)|\b(Bellows|Anvil|Temper|Rivet|Harness) (app|application)\b/.test(text)) found.push("a module called an application");
  return found;
}

/** Words a closing call to action may not use: it promises nothing Cognera does not publish. */
export const OFFER_WORDS = { cs: /zdarma|nezávazn|garanc|záruk|\d/, en: /\bfree\b|no obligation|guarantee|risk.free|\d/i };
