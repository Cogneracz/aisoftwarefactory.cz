/** The operator and privacy page: who runs the site and what happens to a visitor's data. No call to action. */
import { hero } from "../components/hero.mjs";
import { rich } from "../components/rich.mjs";
import { content } from "../content/index.mjs";
import { pathOf } from "../i18n/index.mjs";
import { t } from "../lib/html.mjs";
import { page } from "../layout.mjs";

const section = (s) =>
  `<section class="prose__section" id="${s.id}" aria-labelledby="${s.id}-title"><h2 class="prose__heading" id="${s.id}-title">${t(s.heading)}</h2>${(s.paragraphs ?? [])
    .map((p) => `<p>${rich(p)}</p>`)
    .join("")}${s.list ? `<ul class="prose__list">${s.list.map((item) => `<li>${rich(item)}</li>`).join("")}</ul>` : ""}</section>`;

export function operatorPage() {
  const { legal } = content();
  return page({
    path: pathOf("operator"),
    meta: legal.meta,
    body: [hero({ layout: "plain", title: legal.heading, lead: legal.lead }), `<div class="container"><div class="prose">${legal.sections.map(section).join("\n")}</div></div>`].join("\n"),
  });
}
