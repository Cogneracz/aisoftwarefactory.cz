/** Pieces of pages that are no component of their own: the proof block. */
import { cls, need, t } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { icon } from "../components/icons.mjs";
import { arrowLabel } from "../components/rich.mjs";

/** "Továrna, ve které sami pracujeme.": the claim, and beside it the way to Cognera's references. */
export function proofSection({ id = "cognera", eyebrow, heading, body, link, surface = false }) {
  const href = need(content().cognera[link?.cognera], "The proof link's target on cognera.cz");
  return `<section class="${cls("section", surface && "section--surface")}" id="${id}" aria-labelledby="${id}-title">
<div class="container proof">
<div class="proof__head reveal">${eyebrow ? `<p class="eyebrow">${t(eyebrow)}</p>` : ""}<h2 class="section__title" id="${id}-title">${t(heading)}</h2></div>
<div class="proof__body reveal"><p class="proof__text">${t(body)}</p><a class="link link--out" href="${t(href)}">${arrowLabel(link.label, icon("arrow-up-right", { size: 14 }))}</a></div>
</div>
</section>`;
}
