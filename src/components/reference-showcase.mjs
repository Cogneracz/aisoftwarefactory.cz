/**
 * The proof section with what the factory built: the claim and the way to all of Cognera's references, then the
 * systems as a deck of wide picture cards, each one link to its case study on cognera.cz with its field, name, one
 * line and the parts of the factory it was built with, and the note that the screens show invented demo data.
 * As written the deck is a plain list; assets/js/stack.js lets the cards stick and slide over one another with the
 * scroll where motion is welcome and they fit the screen.
 */
import { attrs, cls, need, t } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { REFERENCE_DIR, REFERENCE_SYSTEMS, referencePicture } from "../content/references.mjs";
import { icon } from "./icons.mjs";
import { MARK_SLUGS, productMark } from "./product-mark.mjs";
import { arrowLabel } from "./rich.mjs";

/** Two to four systems, one wide card each. */
export const REFERENCE_RANGE = [2, 4];

/** How wide a picture is drawn, for the browser's choice among its files. */
const SIZES = "(min-width: 1280px) 760px, (min-width: 1024px) 62vw, 92vw";

const srcset = (picture) => picture.files.map((f) => `${REFERENCE_DIR}/${f.file} ${f.width}w`).join(", ");

/** The name of a part of the factory: Forge, or a module's name in the language being rendered. */
function partName(mark) {
  if (!MARK_SLUGS.includes(mark)) throw new Error(`Not a part of the factory: ${JSON.stringify(mark)}`);
  const c = content();
  return mark === "forge" ? need(c.forge.hero.eyebrow, "Forge's name") : need(c.modules.find((m) => m.slug === mark)?.name, `The name of ${mark}`);
}

/** A system's picture: its card on phones, and from 768 px the laptop and phone pair. */
function picture(system, alt) {
  const card = referencePicture(need(system.card, "A system's card picture"));
  const pair = referencePicture(need(system.pair, "A system's laptop and phone picture"), "pair");
  const wide = `<source${attrs({ media: "(min-width: 768px)", srcset: srcset(pair), sizes: SIZES, width: pair.width, height: pair.height, type: "image/webp" })}>`;
  const small = `<source${attrs({ srcset: srcset(card), sizes: SIZES, width: card.width, height: card.height, type: "image/webp" })}>`;
  return `<figure class="ref__media"><picture>${wide}${small}<img${attrs({ src: `${REFERENCE_DIR}/${card.file}`, alt, width: card.width, height: card.height, loading: "lazy", decoding: "async" })}></picture></figure>`;
}

/** One system as a card: a single link to its case study. `order` is its place in the deck (0 for the first). */
export function referenceCard(item, { order = 0, builtWith } = {}) {
  const name = need(item?.name, "A reference's name");
  for (const key of ["slug", "field", "line", "alt"]) need(item[key], `The ${key} of ${name}`);
  need(builtWith, "The label of the parts a system was built with");
  const system = REFERENCE_SYSTEMS[item.slug];
  if (!system) throw new Error(`Not a published reference: ${JSON.stringify(item.slug)}`);
  if (!Array.isArray(system.marks) || system.marks.length === 0) throw new Error(`${name} lists no part of the factory`);
  const parts = system.marks
    .map((mark) => {
      const part = partName(mark);
      return `<span class="ref__part">${productMark(mark)}${t(part)}</span>`;
    })
    .join("");
  const href = need(content().cognera.reference?.(item.slug), `The address of ${name}'s case study`);
  if (!Number.isInteger(order) || order < 0) throw new Error(`Invalid place in the deck: ${String(order)}`);
  return `<li class="ref-item" style="--n: ${order}"><a class="ref" href="${t(href)}">${picture(system, item.alt)}<span class="ref__text"><span class="ref__field">${t(item.field)}</span><h3 class="ref__name">${arrowLabel(name, icon("arrow-up-right", { size: 14 }))}</h3><span class="ref__line">${t(item.line)}</span><span class="ref__built"><span class="ref__built-label">${t(builtWith)}</span>${parts}</span></span></a></li>`;
}

export function referenceShowcase({ id = "cognera", eyebrow, heading, body, link, references, surface = false }) {
  need(id, "A reference showcase's id");
  need(heading, "The showcase's heading");
  need(body, "The showcase's claim");
  const items = references?.items;
  const [min, max] = REFERENCE_RANGE;
  if (!Array.isArray(items) || items.length < min || items.length > max) throw new Error(`A reference showcase takes ${min} to ${max} systems, got ${Array.isArray(items) ? items.length : 0}`);
  const all = need(content().cognera[link?.cognera], "The link to all references on cognera.cz");
  const cards = items.map((item, i) => referenceCard(item, { order: i, builtWith: references.builtWith })).join("");
  return `<section class="${cls("section", surface && "section--surface")}" id="${id}" aria-labelledby="${id}-title">
<div class="container">
<div class="proof">
<div class="proof__head reveal">${eyebrow ? `<p class="eyebrow">${t(eyebrow)}</p>` : ""}<h2 class="section__title" id="${id}-title">${t(heading)}</h2></div>
<div class="proof__body reveal"><p class="proof__text">${t(body)}</p><a class="link link--out" href="${t(all)}">${arrowLabel(need(link.label, "The label of the link to all references"), icon("arrow-up-right", { size: 14 }))}</a></div>
</div>
<ul class="refs" data-stack>${cards}</ul>
<p class="refs__note reveal">${t(need(references.note, "The note about demo data"))}</p>
</div>
</section>`;
}
