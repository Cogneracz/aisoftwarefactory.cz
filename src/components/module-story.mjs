/**
 * The scroll story: one pinned stage in which the parts of the factory follow one another, one chapter each: the
 * product mark, name and decision, a short caption and each step's real screen. assets/js/story.js
 * moves the copy and the screens with the reader's scroll.
 *
 * Two stories are told with it. `moduleStory` on the modules page: Bellows, Anvil, Temper, Rivet and Cognera Harness,
 * three steps each. `lineStory` on the home page: the line's five steps with Forge in the middle, each under the
 * decision a person makes there, two steps each.
 *
 * Whether a story moves is decided by the inline script right after it (lib/lang-switch.mjs), at parse time, so its
 * layout is final before the first paint. As written here, with no script, reduced motion or save-data, every chapter
 * is a still block: the product mark, its copy with all its steps, and its first screen. Each chapter keeps its
 * part's address (#bellows …), so an index on the page still jumps to it.
 */
import { attrs, cls, need, t } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { LINE_ORDER, LINE_STORY_STEPS } from "../content/line.mjs";
import { STORY_ID, STORY_SCRIPT } from "../lib/lang-switch.mjs";
import { icon } from "./icons.mjs";
import { inModuleOrder } from "./module-card.mjs";
import { productMark } from "./product-mark.mjs";
import { arrowLabel } from "./rich.mjs";
import { screenFrame } from "./screen-frame.mjs";

/** Steps per chapter of the modules' story (the script's and the styles' default) and of the line's story. */
export const STORY_STEPS = 3;
export const LINE_STEPS = 2;

/** Render the same sequence of captions and real screens for both the static and animated layouts. */
function chapter({ slug, name, headline, steps, more }, count, level) {
  if (!Array.isArray(steps) || steps.length !== count) throw new Error(`${name} needs ${count} steps in the story`);
  const list = steps.map((step, index) => {
    for (const key of ["title", "screen"]) need(step?.[key], `Step ${index + 1} of ${name}: its ${key}`);
    return `<li${attrs({ class: cls("story__step", index === 0 && "is-current") })}><h${level + 1} class="story__step-title">${t(step.title)}</h${level + 1}></li>`;
  }).join("");
  const screens = steps.map((s, k) => screenFrame(s.screen, { className: cls("story__screen", k === 0 && "is-current") })).join("");
  const link = more ? `\n<a class="link link--out story__more" href="${t(more.href)}">${arrowLabel(more.label, icon("arrow-up-right", { size: 14 }))}</a>` : "";
  return `<section class="story__chapter" id="${slug}" aria-labelledby="${slug}-title">
<div class="container story__grid">
<div class="story__copy">
<div class="story__identity">${productMark(slug, { className: "story__logo", tile: false })}<h${level} class="story__name" id="${slug}-title">${t(name)}</h${level}></div>
<p class="story__headline">${t(need(headline, `The headline of ${name}`))}</p>
<ol class="story__steps">${list}</ol>${link}
</div>
<div class="story__screens">${screens}</div>
</div>
</section>`;
}

/** The chapters as a row of links under the stage: where the visitor is, and the way to any chapter. */
function progress(chapters, label) {
  const links = chapters.map((c) => `<a class="story__mark" href="#${t(c.slug)}"><span class="story__mark-name">${t(need(c.name, "A part's name"))}</span></a>`).join("");
  return `<nav class="story__progress" aria-label="${t(need(label, "The label of the story's chapters"))}">${links}</nav>`;
}

/** The pinned stage with its chapters. Three steps are the default the script and the styles assume; fewer are named. */
function stage(chapters, { steps, level, label }) {
  const fewer = steps !== STORY_STEPS;
  return `<div${attrs({ class: "story", id: STORY_ID, "data-story": chapters.map((c) => c.slug).join(","), "data-story-steps": fewer ? steps : false })}>
<div class="story__track" style="--chapters: ${chapters.length}${fewer ? `; --steps: ${steps}` : ""}">
<div class="story__stage">
<span class="story__brand" aria-hidden="true">Forge</span>
${progress(chapters, label)}
${chapters.map((c) => chapter(c, steps, level)).join("\n")}
</div>
</div>
</div>
<script>${STORY_SCRIPT}</script>`;
}

/** The story of `modules` (the five, in the line's order); throws for a missing step, screen or label. */
export function moduleStory(modules, { moreLabel, label } = {}) {
  if (typeof moreLabel !== "function") throw new Error("The story needs the label of each chapter's outward link");
  const c = content();
  const steps = c.story?.steps;
  if (!steps) throw new Error("The story's steps are missing from the content");
  const chapters = inModuleOrder(modules).map((m) => ({
    slug: m.slug,
    name: m.name,
    headline: m.headline,
    steps: steps[m.slug],
    more: { href: c.cognera.product(m.slug), label: moreLabel(m.name) },
  }));
  return stage(chapters, { steps: STORY_STEPS, level: 2, label: label ?? c.assembly?.eyebrow });
}

/**
 * The story of the line: its five steps in order, each chapter under the decision a person makes there, then the base
 * they all stand on under what it does. Each chapter shows two of the part's published steps (`picks`: which ones, by
 * position, for each part). The parts' names sit below the section heading.
 */
export function lineStory(line, { picks = LINE_STORY_STEPS } = {}) {
  const c = content();
  const order = (line?.steps ?? []).map((s) => s.slug);
  if (order.join() !== LINE_ORDER.join()) throw new Error(`The line's steps must run ${LINE_ORDER.join(", ")}; got ${order.join(", ") || "none"}`);
  const base = line.base;
  need(base?.slug, "The line's base");
  const part = ({ slug, name }, headline) => {
    const all = c.story?.steps?.[slug];
    if (!Array.isArray(all)) throw new Error(`The steps of ${name} are missing from the content`);
    const chosen = picks[slug];
    if (!Array.isArray(chosen) || chosen.length !== LINE_STEPS) throw new Error(`${name} needs ${LINE_STEPS} steps picked for the line's story`);
    return {
      slug,
      name,
      headline,
      steps: chosen.map((k) => all[k] ?? need(undefined, `Step ${k + 1} of ${name}`)),
    };
  };
  const chapters = [...line.steps.map((step) => part(step, step.decides)), part(base, need(base.does, "What the line's base does"))];
  return stage(chapters, { steps: LINE_STEPS, level: 3, label: line.eyebrow });
}
