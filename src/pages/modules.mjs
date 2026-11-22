/** The modules page pairs each product logo with its own chapter and real screens. */
import { ctaBand } from "../components/cta-band.mjs";
import { hero } from "../components/hero.mjs";
import { moduleGrid } from "../components/module-card.mjs";
import { moduleStory } from "../components/module-story.mjs";
import { t } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { pathOf } from "../i18n/index.mjs";
import { page } from "../layout.mjs";

export function modulesPage() {
  const c = content();
  return page({
    path: pathOf("modules"),
    meta: c.modulesPage.meta,
    body: [
      hero({ ...c.modulesPage.hero, layout: "plain", action: c.action }),
      `<section class="container module-index" id="skladani" aria-label="${t(c.modulesPage.indexLabel)}">${moduleGrid(c.modules, { onPage: true })}</section>`,
      moduleStory(c.modules, { moreLabel: c.modulesPage.moreLabel }),
      ctaBand(c.modulesPage.closing),
    ].join("\n"),
  });
}
