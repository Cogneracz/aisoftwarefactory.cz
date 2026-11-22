/**
 * Questions and answers as a screening: the questions in large type, numbered, as native disclosures (usable without
 * scripts, one open at a time), and beside them a stage that shows the logo of the part of the factory the open
 * answer is about, its name as a giant word behind it. assets/js/faq.js changes the stage when a question opens or is
 * pointed at; without it the stage shows the first question's part. The FAQPage structured data comes from the same
 * items, so the markup and the data cannot disagree.
 */
import { attrs, cls, need, t } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { icon } from "./icons.mjs";
import { MARK_SLUGS, productMark } from "./product-mark.mjs";
import { sectionHead } from "./rich.mjs";

function ghostWord(name) {
  const word = String(need(name, "A part's name")).trim().split(/\s+/).at(-1);
  return { word, fit: Math.round(Math.min(1, 5.6 / word.length) * 100) / 100 };
}

export const FAQ_RANGE = [6, 12];

/** What an answer can be about: the whole line, or one part of the factory. */
export const FAQ_MARKS = ["factory", ...MARK_SLUGS];

function checked(items) {
  const [min, max] = FAQ_RANGE;
  if (!Array.isArray(items) || items.length < min || items.length > max) throw new Error(`An FAQ takes ${min} to ${max} questions, got ${Array.isArray(items) ? items.length : 0}`);
  items.forEach((item, i) => {
    need(item?.q, `Question ${i + 1}`);
    if (!item.q.trim().endsWith("?")) throw new Error(`Question ${i + 1} must end with a question mark: ${JSON.stringify(item.q)}`);
    need(item?.a, `The answer to question ${i + 1} (${item.q})`);
  });
  return items;
}

/** Questions about the whole factory use the Forge logo. */
function faqMark(mark, className) {
  return productMark(mark === "factory" ? "forge" : mark, { className, tile: false });
}

/** The name and role of a part, as the stage's caption and its giant word. */
export function partName(mark) {
  const c = content();
  if (mark === "factory") return { name: need(c.site?.name, "The site's name"), role: "", ghost: "Forge" };
  if (mark === "forge") return { name: "Forge", role: need(c.forge?.hero?.tag, "Forge's role"), ghost: "Forge" };
  const module = c.modules.find((m) => m.slug === mark);
  if (!module) throw new Error(`Not a part of the factory: ${JSON.stringify(mark)}`);
  return { name: module.name, role: module.role, ghost: module.name };
}

/** One layer of the stage per part, in the order the questions first name them. */
function stage(marks) {
  const layers = [...new Set(marks)].map((mark, i) => {
    const named = partName(mark);
    const ghost = ghostWord(named.ghost);
    return `<div${attrs({ class: cls("faq__layer", i === 0 && "is-current"), "data-mark": mark })}><p class="faq__ghost" style="--fit: ${ghost.fit}">${t(ghost.word)}</p>${faqMark(mark, "faq__mark")}<p class="faq__caption"><span>${t(named.name)}</span>${named.role ? `<span>${t(named.role)}</span>` : ""}</p></div>`;
  });
  return `<div class="faq__stage" aria-hidden="true">${layers.join("")}</div>`;
}

export function faq({ id = "otazky", eyebrow, heading, items }) {
  const list = checked(items);
  const marks = list.map((item, i) => {
    if (!FAQ_MARKS.includes(item.mark)) throw new Error(`Question ${i + 1} (${item.q}) needs the part it is about: ${JSON.stringify(item.mark)}`);
    return item.mark;
  });
  const rows = list
    .map((item, i) => {
      return `<details class="faq__item" name="faq" data-mark="${item.mark}"${i === 0 ? " open" : ""}><summary class="faq__question"><span class="faq__number" aria-hidden="true">${String(i + 1).padStart(2, "0")}</span><span class="faq__q">${t(item.q)}</span>${icon("plus", { size: 24, className: "icon faq__icon" })}</summary><div class="faq__answer"><p>${t(item.a)}</p>${faqMark(item.mark, "faq__thumb")}</div></details>`;
    })
    .join("\n");
  return `<section class="section faq-section" id="${id}" aria-labelledby="${id}-title">
<div class="container faq">
${stage(marks)}
<div class="faq__main">
${sectionHead({ eyebrow, heading, id: `${id}-title` })}
<div class="faq__list">
${rows}
</div>
</div>
</div>
</section>`;
}

/** FAQPage structured data whose questions and answers are exactly the visible ones, as plain text. */
export function faqJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: checked(items).map((item) => ({ "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a } })),
  };
}
