/** Benefits or guarantees: two to six short claims, each with the detail that supports it. */
import { cls, need, t } from "../lib/html.mjs";
import { sectionHead } from "./rich.mjs";

export const FEATURE_RANGE = [2, 6];

export function featureList({ id, eyebrow, heading, lead, items, surface = false }) {
  need(id, "A feature list's id");
  const [min, max] = FEATURE_RANGE;
  if (!Array.isArray(items) || items.length < min || items.length > max) throw new Error(`A feature list takes ${min} to ${max} items, got ${Array.isArray(items) ? items.length : 0}`);
  const list = items
    .map((item, i) => {
      need(item?.title, `The title of item ${i + 1}`);
      need(item?.body, `The body of item ${i + 1} (${item.title})`);
      return `<li class="feature reveal"><h3 class="feature__title">${t(item.title)}</h3><p class="feature__body">${t(item.body)}</p></li>`;
    })
    .join("");
  return `<section class="${cls("section", surface && "section--surface")}" id="${id}" aria-labelledby="${id}-title">
<div class="container">
${sectionHead({ eyebrow, heading, lead, id: `${id}-title` })}
<ul class="features" data-count="${items.length}">${list}</ul>
</div>
</section>`;
}
