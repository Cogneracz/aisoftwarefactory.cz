/**
 * The scroll story: one pinned stage in which the parts of the factory follow one another, one chapter each: the
 * part's role, name and headline, some of its published steps and each step's real screen. assets/js/story.js moves
 * the chapter's three layers at three speeds (copy, screen, 3D object) and, where motion is welcome and WebGL works,
 * loads the canvas (assets/js/story-canvas.js) that plays each part's film scene with the scroll.
 *
 * Two stories are told with it. `moduleStory` on the modules page: Bellows, Anvil, Temper, Rivet and Cognera Harness,
 * three steps each. `lineStory` on the home page: the line's five steps with Forge in the middle, each under the
 * decision a person makes there, two steps each.
 *
 * Whether a story moves is decided by the inline script right after it (lib/lang-switch.mjs), at parse time, so its
 * layout is final before the first paint. As written here, with no script, reduced motion or save-data, every chapter
 * is a still block: the part's 3D render, its copy with all its steps, and its first screen. Each chapter keeps its
 * part's address (#bellows …), so an index on the page still jumps to it.
 */
import { attrs, cls, need, t } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { LINE_ORDER, LINE_STORY_STEPS } from "../content/line.mjs";
import { STORY_MEDIA_BASE } from "../content/story.mjs";
import { STORY_ID, STORY_SCRIPT } from "../lib/lang-switch.mjs";
import { icon } from "./icons.mjs";
import { inModuleOrder } from "./module-card.mjs";
import { object3d } from "./object3d.mjs";
import { productMark } from "./product-mark.mjs";
import { arrowLabel } from "./rich.mjs";
import { screenFrame } from "./screen-frame.mjs";

/** Steps per chapter of the modules' story (the script's and the styles' default) and of the line's story. */
export const STORY_STEPS = 3;
export const LINE_STEPS = 2;

/** Two-digit step number: 0 -> "01". */
const number = (i) => String(i + 1).padStart(2, "0");

/**
 * The part's name as the giant word behind its 3D object: the name's last word ("Harness"), with the scale that keeps
 * a longer word about as wide as a five-letter one.
 */
export function ghostWord(name) {
  const word = String(need(name, "A part's name")).trim().split(/\s+/).at(-1);
  return { word, fit: Math.round(Math.min(1, 5.6 / word.length) * 100) / 100 };
}

/** Most guarantees a frame shows. */
export const PROOFS_MAX = 3;

/**
 * What can be counted on in a chapter: the part's published guarantees, without one that repeats the chapter's headline,
 * at most PROOFS_MAX. Throws for a list that is not one of sentences.
 */
export function chapterProofs(list, headline) {
  if (list === undefined) return [];
  if (!Array.isArray(list) || list.some((p) => typeof p !== "string" || p.trim() === "")) throw new Error("A chapter's guarantees are a list of sentences");
  return list.filter((p) => p !== headline).slice(0, PROOFS_MAX);
}

/**
 * One chapter: a section with the part's address, copy, what can be counted on, its steps' screens and the still's 3D
 * render. `level` is the heading level of the part's name (its steps are one level below); `more` is an optional link
 * out of the chapter.
 */
function chapter({ slug, name, role, tag, headline, steps, proofs, more }, count, level, place) {
  if (!Array.isArray(steps) || steps.length !== count) throw new Error(`${name} needs ${count} steps in the story`);
  const ghost = ghostWord(name);
  const list = steps
    .map((s, k) => {
      for (const key of ["title", "body", "screen"]) need(s?.[key], `Step ${k + 1} of ${name}: its ${key}`);
      return `<li${attrs({ class: cls("story__step", k === 0 && "is-current") })}><p class="story__number" aria-hidden="true">${number(k)}</p><h${level + 1} class="story__step-title">${t(s.title)}</h${level + 1}><p class="story__sentence">${t(s.body)}</p></li>`;
    })
    .join("");
  const screens = steps.map((s, k) => screenFrame(s.screen, { className: cls("story__screen", k === 0 && "is-current") })).join("");
  const link = more ? `\n<a class="link link--out story__more" href="${t(more.href)}">${arrowLabel(more.label, icon("arrow-up-right", { size: 14 }))}</a>` : "";
  const sure = chapterProofs(proofs, headline);
  const proofList = sure.length ? `\n<ul class="story__proofs">${sure.map((p) => `<li class="story__proof">${icon("check", { size: 16 })}<span>${t(p)}</span></li>`).join("")}</ul>` : "";
  return `<section class="story__chapter" id="${slug}" aria-labelledby="${slug}-title">
<p class="story__ghost" aria-hidden="true" style="--fit: ${ghost.fit}">${t(ghost.word)}</p>
<div class="container story__grid">
<div class="story__cover">${object3d(slug, { decorative: true })}</div>
<div class="story__copy">
<p class="story__role">${productMark(slug)}<span class="story__count">${place}</span><span>${t(need(role, `The role of ${name}`))}</span><span class="tag">${t(need(tag, `The tag of ${name}`))}</span></p>
<h${level} class="story__name" id="${slug}-title">${t(name)}</h${level}>
<p class="story__headline">${t(need(headline, `The headline of ${name}`))}</p>
<ol class="story__steps">${list}</ol>${link}
</div>${proofList}
<div class="story__screens">${screens}</div>
</div>
</section>`;
}

/** The chapters as a row of links under the stage: where the visitor is, and the way to any chapter. */
function progress(chapters, label) {
  const links = chapters.map((c, i) => `<a${attrs({ class: cls("story__mark", i === 0 && "is-current"), href: `#${c.slug}`, "aria-current": i === 0 ? "step" : false })}><span class="story__mark-name">${t(c.name)}</span><span class="story__mark-role">${t(c.role)}</span></a>`).join("");
  return `<nav class="story__progress" aria-label="${t(need(label, "The label of the story's chapters"))}">${links}</nav>`;
}

/** The pinned stage with its chapters. Three steps are the default the script and the styles assume; fewer are named. */
function stage(chapters, { steps, level, label }) {
  const fewer = steps !== STORY_STEPS;
  const place = (i) => `${number(i)} / ${number(chapters.length - 1)}`;
  return `<div${attrs({ class: "story", id: STORY_ID, "data-story": chapters.map((c) => c.slug).join(","), "data-story-base": STORY_MEDIA_BASE, "data-story-steps": fewer ? steps : false })}>
<div class="story__track" style="--chapters: ${chapters.length}${fewer ? `; --steps: ${steps}` : ""}">
<div class="story__stage">
<div class="container story__frame" aria-hidden="true"><div class="story__object"></div></div>
${chapters.map((c, i) => chapter(c, steps, level, place(i))).join("\n")}
${progress(chapters, label)}
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
    role: m.role,
    tag: c.ui.tagModule,
    headline: m.headline,
    steps: steps[m.slug],
    proofs: m.guarantees,
    more: { href: c.cognera.product(m.slug), label: moreLabel(m.name) },
  }));
  return stage(chapters, { steps: STORY_STEPS, level: 2, label: label ?? c.assembly?.eyebrow });
}

/**
 * The story of the line: its five steps in order, each chapter under the decision a person makes there, then the base
 * they all stand on under what it does. Each chapter shows two of the part's published steps (`picks`: which ones, by
 * position, for each part) and what can be counted on there (a module's guarantees; for Forge, how it works). It stands
 * under a section heading, so the parts' names are third-level headings.
 */
export function lineStory(line, { picks = LINE_STORY_STEPS } = {}) {
  const c = content();
  const order = (line?.steps ?? []).map((s) => s.slug);
  if (order.join() !== LINE_ORDER.join()) throw new Error(`The line's steps must run ${LINE_ORDER.join(", ")}; got ${order.join(", ") || "none"}`);
  const base = line.base;
  need(base?.slug, "The line's base");
  const part = ({ slug, name, role }, headline) => {
    const all = slug === "forge" ? c.forge?.steps?.items : c.story?.steps?.[slug];
    if (!Array.isArray(all)) throw new Error(`The steps of ${name} are missing from the content`);
    const chosen = picks[slug];
    if (!Array.isArray(chosen) || chosen.length !== LINE_STEPS) throw new Error(`${name} needs ${LINE_STEPS} steps picked for the line's story`);
    const proofs =
      slug === "forge"
        ? (c.forge?.work?.items ?? []).filter((w) => w.title !== headline && w.body !== headline).map((w) => w.title)
        : c.modules.find((m) => m.slug === slug)?.guarantees;
    return {
      slug,
      name,
      role,
      tag: slug === "forge" ? c.forge.hero.tag : c.ui.tagModule,
      headline,
      steps: chosen.map((k) => all[k] ?? need(undefined, `Step ${k + 1} of ${name}`)),
      proofs,
    };
  };
  const chapters = [...line.steps.map((step) => part(step, step.decides)), part(base, need(base.does, "What the line's base does"))];
  return stage(chapters, { steps: LINE_STEPS, level: 3, label: line.eyebrow });
}
