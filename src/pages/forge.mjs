/** The Forge page: what the core does, its six steps from a brief to a merge, how it works, proof, closing action. */
import { ctaBand } from "../components/cta-band.mjs";
import { featureList } from "../components/feature-list.mjs";
import { filmPreload } from "../components/film.mjs";
import { hero } from "../components/hero.mjs";
import { stepSequence } from "../components/step-sequence.mjs";
import { content } from "../content/index.mjs";
import { pathOf } from "../i18n/index.mjs";
import { page } from "../layout.mjs";
import { proofSection } from "./shared.mjs";

export function forgePage() {
  const c = content();
  return page({
    path: pathOf("forge"),
    meta: c.forge.meta,
    head: filmPreload(c.forge.hero.film, { cut: "small" }),
    body: [
      hero({ ...c.forge.hero, layout: "split", action: c.action }),
      stepSequence({ id: "postup", eyebrow: c.forge.steps.eyebrow, heading: c.forge.steps.heading, steps: c.forge.steps.items }),
      featureList({ id: "prace", ...c.forge.work, surface: true }),
      proofSection({ id: "cognera", ...c.home.proof }),
      ctaBand(c.forge.closing),
    ].join("\n"),
  });
}
