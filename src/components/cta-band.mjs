/**
 * The closing call to action. The action is not a parameter: it is always the site's one action in the page's
 * language, so it cannot differ from the hero's.
 */
import { need, t } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { button } from "./rich.mjs";

export function ctaBand({ heading, lead, id = "ukazka" }) {
  need(heading, "The closing heading");
  return `<section class="section cta" id="${id}" aria-labelledby="${id}-title">
<div class="container">
<div class="cta__card reveal">
<h2 class="cta__title" id="${id}-title">${t(heading)}</h2>
${lead ? `<p class="cta__lead">${t(lead)}</p>` : ""}
${button(content().action, { size: "lg" })}
</div>
</div>
</section>`;
}
