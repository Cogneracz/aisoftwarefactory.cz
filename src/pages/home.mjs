/**
 * The landing page: the factory's film, the principle, the line's story (five steps, five decisions: one pinned 3D
 * stage, each step under the decision a person makes there, with the real screens that show it), proof (the systems
 * built in the factory), questions, closing action. The modules are the story's chapters here; their own page opens with
 * the assembly scene.
 */
import { ctaBand } from "../components/cta-band.mjs";
import { faq, faqJsonLd } from "../components/faq.mjs";
import { filmPreload } from "../components/film.mjs";
import { hero } from "../components/hero.mjs";
import { lineStory } from "../components/module-story.mjs";
import { sectionHead } from "../components/rich.mjs";
import { taglineReveal } from "../components/tagline-reveal.mjs";
import { content } from "../content/index.mjs";
import { pathOf } from "../i18n/index.mjs";
import { organizationJsonLd, page, websiteJsonLd } from "../layout.mjs";
import { referenceShowcase } from "../components/reference-showcase.mjs";

/** The line's story under its heading: the five steps in order, each chapter under the decision a person makes there. */
export function lineSection({ id = "linka", line }) {
  return `<section class="line" id="${id}" aria-labelledby="${id}-title">
<div class="container line__head">
${sectionHead({ eyebrow: line.eyebrow, heading: line.heading, lead: line.lead, id: `${id}-title` })}
</div>
${lineStory(line)}
</section>`;
}

export function homePage() {
  const c = content();
  return page({
    path: pathOf("home"),
    meta: c.home.meta,
    head: filmPreload(c.home.hero.film),
    jsonLd: [websiteJsonLd(), organizationJsonLd(), faqJsonLd(c.faq)],
    body: [
      hero({ ...c.home.hero, layout: "stacked", action: c.action }),
      taglineReveal({ sentences: c.home.tagline }),
      lineSection({ line: c.line }),
      referenceShowcase({ id: "cognera", ...c.home.proof, references: c.references }),
      faq({ id: "otazky", heading: c.home.faqHeading, items: c.faq }),
      ctaBand(c.home.closing),
    ].join("\n"),
  });
}
