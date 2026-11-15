/**
 * The modules page: its heading, the assembly scene (Forge alone, then its modules seating beside it), a jump list of
 * the five modules, the modules' scroll story (one addressable chapter per module, its film scene in 3D) and the closing
 * action.
 */
import { ctaBand } from "../components/cta-band.mjs";
import { hero } from "../components/hero.mjs";
import { moduleGrid } from "../components/module-card.mjs";
import { moduleStory } from "../components/module-story.mjs";
import { scrollScene } from "../components/scroll-scene.mjs";
import { content } from "../content/index.mjs";
import { assemblyCaptions } from "../content/scene.mjs";
import { pathOf } from "../i18n/index.mjs";
import { page } from "../layout.mjs";
import { sceneManifest } from "../scenes.mjs";

export function modulesPage() {
  const c = content();
  return page({
    path: pathOf("modules"),
    meta: c.modulesPage.meta,
    body: [
      hero({ ...c.modulesPage.hero, layout: "plain", action: c.action }),
      scrollScene({ id: "skladani", scene: "assembly", name: c.assembly.eyebrow, label: c.assembly.label, captions: assemblyCaptions(c), manifest: sceneManifest("assembly") }),
      `<div class="container module-index">${moduleGrid(c.modules, { onPage: true, label: c.modulesPage.indexLabel })}</div>`,
      moduleStory(c.modules, { moreLabel: c.modulesPage.moreLabel }),
      ctaBand(c.modulesPage.closing),
    ].join("\n"),
  });
}
