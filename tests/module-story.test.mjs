import assert from "node:assert/strict";
import { test } from "node:test";
import { LINE_STEPS, PROOFS_MAX, STORY_STEPS, chapterProofs, ghostWord, lineStory, moduleStory } from "../src/components/module-story.mjs";
import { LINE, LINE_ORDER, LINE_STORY_STEPS } from "../src/content/line.mjs";

/** The home story's chapters: the line's five steps, then its base. */
const LINE_CHAPTERS = [...LINE_ORDER, "harness"];
import { content } from "../src/content/index.mjs";
import { STORY_ORDER } from "../src/content/story.mjs";
import { withLocale } from "../src/i18n/index.mjs";

const plain = (html) => html.replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const story = (locale, modules) => withLocale(locale, () => moduleStory(modules ?? content().modules, { moreLabel: content().modulesPage.moreLabel }));
const chapter = (html, slug) => html.slice(html.indexOf(`id="${slug}"`), html.indexOf("</section>", html.indexOf(`id="${slug}"`)));

test("expected: one chapter per module in the line's order, each with three published steps and their screens", () => {
  const html = story("cs");
  assert.deepEqual([...html.matchAll(/<section class="story__chapter" id="([a-z]+)"/g)].map((m) => m[1]), STORY_ORDER);
  const rivet = chapter(html, "rivet");
  const text = plain(rivet);
  for (const part of ["Nasazení", "Modul", "Rivet", "Poběží přesně to, co jste schválili.", "01 Přesný plán.", "Plán určí verzi, prostředí a postup a po schválení se už nemění.", "02 Schválení.", "Produkce chce druhé potvrzení.", "03 Nasazení a ověření.", "Více o modulu Rivet na cognera.cz"]) assert.ok(text.includes(part), part);
  for (const screen of ["rivet-step-a", "rivet-step-c", "rivet-step-d"]) assert.ok(rivet.includes(`/assets/media/screens/${screen}.webp`), screen);
  assert.ok(rivet.includes('href="https://cognera.cz/rivet"'));
  assert.equal((rivet.match(/<h2 /g) ?? []).length, 1);
  assert.equal((rivet.match(/<h3 /g) ?? []).length, 3);
});

test("edge: as written the chapters are still: the first step and screen marked, the 3D render decorative, the canvas host empty", () => {
  const html = story("cs");
  const bellows = chapter(html, "bellows");
  assert.equal((bellows.match(/class="story__step is-current"/g) ?? []).length, 1);
  assert.equal((bellows.match(/story__screen is-current/g) ?? []).length, 1);
  assert.ok(bellows.includes('<img class="object3d" src="/assets/media/3d/bellows.jpg" alt="" aria-hidden="true"'));
  assert.ok(html.includes('<div class="container story__frame" aria-hidden="true"><div class="story__object"></div></div>'));
  assert.ok(html.includes('style="--chapters: 5"'));
  // English, from cognera.cz's English steps.
  const en = plain(chapter(story("en"), "harness"));
  for (const part of ["The task description.", "Forge and its modules describe work in the same vocabulary.", "Checking the result."]) assert.ok(en.includes(part), part);
});

test("error: a missing link label, a chapter without its three steps or a step without its screen throws", () => {
  withLocale("cs", () => {
    const c = content();
    assert.throws(() => moduleStory(c.modules), /label of each chapter's outward link/);
    const steps = c.story.steps.anvil;
    try {
      c.story.steps.anvil = steps.slice(0, 2);
      assert.throws(() => moduleStory(c.modules, { moreLabel: c.modulesPage.moreLabel }), /Anvil needs 3 steps in the story/);
      c.story.steps.anvil = [steps[0], { ...steps[1], screen: "" }, steps[2]];
      assert.throws(() => moduleStory(c.modules, { moreLabel: c.modulesPage.moreLabel }), /Step 2 of Anvil: its screen is required/);
      c.story.steps.anvil = [steps[0], { ...steps[1], screen: "anvil-step-z" }, steps[2]];
      assert.throws(() => moduleStory(c.modules, { moreLabel: c.modulesPage.moreLabel }), /Unknown screen/);
    } finally {
      c.story.steps.anvil = steps;
    }
  });
});

test("edge: in motion all three screens are stacked in place, so the second and third step show theirs", async () => {
  const { readFile } = await import("node:fs/promises");
  const { parseRules } = await import("./lib/css-contract.mjs");
  const css = await readFile(new URL("../src/styles/module-story.css", import.meta.url), "utf8");
  const rule = parseRules(css).find((r) => r.selector.includes(".story.is-motion .story__screen:not(:first-child)"));
  assert.ok(rule, "a motion rule for the second and third screen");
  assert.ok(rule.declarations.some((d) => d.prop === "display" && d.value === "block"));
});

const line = (locale = "cs", extra) => withLocale(locale, () => lineStory(content().line, extra));

test("expected: the line's story has the five steps in order, each under its decision, then the base, each with two published steps and their screens", () => {
  const html = line();
  assert.deepEqual([...html.matchAll(/<section class="story__chapter" id="([a-z]+)"/g)].map((m) => m[1]), LINE_CHAPTERS);
  assert.ok(html.startsWith('<div class="story" id="pribeh" data-story="bellows,anvil,forge,temper,rivet,harness" data-story-base="/assets/media/story/" data-story-steps="2">'));
  assert.ok(html.includes('<div class="story__track" style="--chapters: 6; --steps: 2">'));
  const temper = chapter(html, "temper");
  for (const part of ["Ověření", "Modul", "Temper", "Vizuální změny schvaluje člověk.", "01 Snímek u každého kroku.", "Běh končí jasným verdiktem.", "02 Vizuální snímky schválí člověk.", "Nový vzhled stránky platí, až ho někdo potvrdí."]) assert.ok(plain(temper).includes(part), part);
  for (const screen of ["temper-step-c", "temper-step-e"]) assert.ok(temper.includes(`/assets/media/screens/${screen}.webp`), screen);
  assert.equal(temper.includes("temper-step-b.webp"), false, "the step that was not picked is not shown");
  // Under the section's heading the parts are third-level headings and their steps fourth-level; no chapter links out.
  assert.equal((html.match(/<h2 /g) ?? []).length, 0);
  assert.equal((html.match(/<h3 class="story__name"/g) ?? []).length, 6);
  assert.equal((html.match(/<h4 class="story__step-title"/g) ?? []).length, 12);
  // No chapter links out; the only links are the row of chapters under the stage, each to its own chapter.
  assert.deepEqual([...html.matchAll(/<a [^>]*href="([^"]+)"/g)].map((m) => m[1]), LINE_CHAPTERS.map((slug) => `#${slug}`));
  assert.ok(html.includes('<nav class="story__progress" aria-label="Linka">'));
  assert.ok(html.includes('<a class="story__mark is-current" href="#bellows" aria-current="step"><span class="story__mark-name">Bellows</span><span class="story__mark-role">Průzkum</span></a>'));
  assert.deepEqual([STORY_STEPS, LINE_STEPS], [3, 2]);
});

test("edge: Forge stands in the middle as the core with its own steps; English tells the same chapters; the modules' story is unchanged", () => {
  const forge = chapter(line(), "forge");
  assert.ok(plain(forge).includes("Vývoj Jádro Forge Bez schválení se nic nesloučí. 01 Plán ke schválení."));
  assert.ok(forge.includes('<img class="object3d" src="/assets/media/3d/forge.jpg" alt="" aria-hidden="true"'));
  assert.ok(forge.includes("/assets/media/screens/forge-plan.webp") && forge.includes("/assets/media/screens/forge-tile-a.webp"));
  const english = line("en");
  assert.ok(plain(chapter(english, "rivet")).includes("Deploy Module Rivet Production needs a second confirmation. 01"));
  assert.deepEqual([...english.matchAll(/<section class="story__chapter" id="([a-z]+)"/g)].map((m) => m[1]), LINE_CHAPTERS);
  // Three steps are the default: the modules' story names no step count.
  const modules = story("cs");
  assert.ok(modules.startsWith('<div class="story" id="pribeh" data-story="bellows,anvil,temper,rivet,harness" data-story-base="/assets/media/story/">'));
  assert.ok(modules.includes('<div class="story__track" style="--chapters: 5">'));
  assert.deepEqual(Object.keys(LINE_STORY_STEPS), LINE_CHAPTERS);
});

test("error: a line out of order, a part without two picked steps, a pick the part does not have, and a missing decision stop the build", () => {
  withLocale("cs", () => {
    assert.throws(() => lineStory({ ...LINE, steps: [...LINE.steps].reverse() }), /The line's steps must run bellows, anvil, forge, temper, rivet; got rivet/);
    assert.throws(() => lineStory({ steps: [] }), /got none/);
    assert.throws(() => lineStory(LINE, { picks: { ...LINE_STORY_STEPS, anvil: [0] } }), /Anvil needs 2 steps picked for the line's story/);
    assert.throws(() => lineStory(LINE, { picks: { ...LINE_STORY_STEPS, rivet: [1, 7] } }), /Step 8 of Rivet is required/);
    assert.throws(() => lineStory({ ...LINE, steps: LINE.steps.map((s) => (s.slug === "temper" ? { ...s, decides: "" } : s)) }), /The headline of Temper is required/);
    assert.throws(() => lineStory({ ...LINE, steps: LINE.steps.map((s) => (s.slug === "forge" ? { ...s, role: undefined } : s)) }), /The role of Forge is required/);
  });
});

test("expected: on the stage each chapter has its part's name as a giant word behind it, its place in the story and a row of chapters", () => {
  const html = line();
  assert.ok(chapter(html, "forge").includes('<p class="story__ghost" aria-hidden="true" style="--fit: 1">Forge</p>'));
  assert.ok(chapter(html, "anvil").includes('<span class="story__count">02 / 06</span>'));
  assert.deepEqual(ghostWord("Rivet"), { word: "Rivet", fit: 1 });
  // The row of chapters is one nav after the chapters, a link to each.
  assert.equal((html.match(/<nav class="story__progress"/g) ?? []).length, 1);
  assert.ok(html.indexOf('<nav class="story__progress"') > html.lastIndexOf('<section class="story__chapter"'));
});

test("edge: a long or two-word name shows its last word, scaled to the width of a short one", () => {
  assert.deepEqual(ghostWord("Cognera Harness"), { word: "Harness", fit: 0.8 });
  assert.deepEqual(ghostWord("  Bellows "), { word: "Bellows", fit: 0.8 });
  assert.deepEqual(ghostWord("Anvil"), { word: "Anvil", fit: 1 });
  const modules = story("cs");
  assert.ok(chapter(modules, "harness").includes('<p class="story__ghost" aria-hidden="true" style="--fit: 0.8">Harness</p>'));
  assert.ok(chapter(modules, "harness").includes('<span class="story__count">05 / 05</span>'));
});

test("error: a part without a name has no giant word, and a story without a label for its chapters stops the build", () => {
  assert.throws(() => ghostWord(""), /A part's name is required/);
  assert.throws(() => ghostWord(undefined), /A part's name is required/);
  withLocale("cs", () => {
    assert.throws(() => moduleStory(content().modules, { moreLabel: content().modulesPage.moreLabel, label: "" }), /The label of the story's chapters is required/);
  });
});

test("error: on the stage a step never shows through a chapter that is off stage", async () => {
  const { readFile } = await import("node:fs/promises");
  const { parseRules } = await import("./lib/css-contract.mjs");
  const css = await readFile(new URL("../src/styles/module-story.css", import.meta.url), "utf8");
  // A chapter off stage is visibility: hidden; a descendant set to "visible" would be painted anyway (the owner's
  // screenshot of 14. 11. 2026: Bellows's step over Rivet's). Steps may only inherit or hide.
  const steps = parseRules(css).filter((r) => r.selector.includes(".story__step") && r.declarations.some((d) => d.prop === "visibility"));
  assert.ok(steps.length >= 3);
  for (const rule of steps) {
    const value = rule.declarations.find((d) => d.prop === "visibility").value;
    assert.ok(["inherit", "hidden"].includes(value), `${rule.selector}: visibility ${value}`);
  }
  const offStage = parseRules(css).find((r) => r.selector === "html.js .story.is-motion .story__chapter:not(.is-current)");
  assert.deepEqual(offStage.declarations, [{ prop: "visibility", value: "hidden" }]);
  // The script clears what the inline priming set before it takes over.
  const script = await readFile(new URL("../assets/js/story.js", import.meta.url), "utf8");
  assert.match(script, /for \(const name of \["--p", "--l", "--x"\]\) c\.style\.removeProperty\(name\);/);
});

test("expected: each chapter shows what can be counted on there, without repeating its headline; the story ends at the base", () => {
  const html = line();
  const proofs = (slug) => [...chapter(html, slug).matchAll(/<li class="story__proof"><svg[^>]*>.*?<\/svg><span>([^<]+)<\/span><\/li>/g)].map((m) => m[1].replace(/&nbsp;/g, " "));
  // Bellows's headline is one of its guarantees: the frame does not say it twice.
  assert.deepEqual(proofs("bellows"), ["Každé tvrzení má zdroj.", "Nula příležitostí je platný výsledek."]);
  // Forge has no guarantees list: how it works, without the item that repeats "Bez schválení se nic nesloučí.".
  assert.deepEqual(proofs("forge"), ["Schválíte i z telefonu.", "Od opravy po celý backlog.", "Dokumentace drží krok."]);
  // The base: what it does, two of its steps, its guarantees, the last place in the story.
  const harness = chapter(html, "harness");
  assert.ok(plain(harness).includes("Základ Modul Cognera Harness Pro každou úlohu doporučí vhodného agenta. 01 Doporučení s důvodem."));
  assert.ok(plain(harness).includes("02 Kontrola výsledku."));
  assert.ok(harness.includes('<span class="story__count">06 / 06</span>'));
  assert.deepEqual(proofs("harness"), ["Agenta můžete vždy určit sami.", "Každé rozhodnutí se dá zpětně vysvětlit."]);
  // The modules page shows every module's guarantees, up to three.
  const modules = story("cs");
  assert.equal((chapter(modules, "rivet").match(/<li class="story__proof">/g) ?? []).length, 3);
  assert.equal(PROOFS_MAX, 3);
});

test("edge: English names the same guarantees in English; a list longer than three is cut; no list, no block", () => {
  const english = line("en");
  assert.ok(plain(chapter(english, "bellows")).includes("Every claim has a source."));
  assert.equal(plain(chapter(english, "bellows")).match(/A person always decides on an idea\./g)?.length, 1, "the headline is not repeated as a guarantee");
  assert.deepEqual(chapterProofs(["A.", "B.", "C.", "D."], "X."), ["A.", "B.", "C."]);
  assert.deepEqual(chapterProofs(["A.", "X.", "B."], "X."), ["A.", "B."]);
  assert.deepEqual(chapterProofs(undefined, "X."), []);
  assert.deepEqual(chapterProofs(["X."], "X."), []);
});

test("error: guarantees that are not sentences, and a line without its base, stop the build", () => {
  assert.throws(() => chapterProofs("Každé tvrzení má zdroj.", "X."), /a list of sentences/);
  assert.throws(() => chapterProofs(["A.", ""], "X."), /a list of sentences/);
  assert.throws(() => chapterProofs([7], "X."), /a list of sentences/);
  withLocale("cs", () => {
    assert.throws(() => lineStory({ ...LINE, base: undefined }), /The line's base is required/);
    assert.throws(() => lineStory({ ...LINE, base: { ...LINE.base, does: "" } }), /What the line's base does is required/);
    assert.throws(() => lineStory(LINE, { picks: { ...LINE_STORY_STEPS, harness: [1] } }), /Cognera Harness needs 2 steps picked/);
  });
});

test("expected: a step change moves the screens as a stack; the script and the priming mark the passed ones", async () => {
  const { readFile } = await import("node:fs/promises");
  const { parseRules } = await import("./lib/css-contract.mjs");
  const css = await readFile(new URL("../src/styles/module-story.css", import.meta.url), "utf8");
  const rule = (selector) => parseRules(css).find((r) => r.selector === selector);
  const value = (r, prop) => r?.declarations.find((d) => d.prop === prop)?.value;
  const base = rule("html.js .story.is-motion .story__screen, html.js .story.is-motion .story__screen:not(:first-child)");
  assert.equal(value(base, "transition").replace(/\s+/g, " "), "transform var(--dur-move) var(--ease), opacity var(--dur-move) var(--ease)");
  assert.equal(value(rule("html.js .story.is-motion .story__screen.is-current"), "transform"), "none");
  assert.equal(value(rule("html.js .story.is-motion .story__screen.is-current + .story__screen"), "opacity"), "0.55");
  assert.match(value(rule("html.js .story.is-motion .story__screen.is-past"), "transform"), /^translate3d\(-/);
  const script = await readFile(new URL("../assets/js/story.js", import.meta.url), "utf8");
  assert.match(script, /s\.classList\.toggle\("is-past", k < pos\.beat\)/);
  assert.match(script, /const OMEGA = 15;/);
});

test("edge: in the film frame the 3D object keeps to the right half and never crosses the copy's column", async () => {
  const { readFile } = await import("node:fs/promises");
  const { parseRules } = await import("./lib/css-contract.mjs");
  const css = await readFile(new URL("../src/styles/module-story.css", import.meta.url), "utf8");
  // The owner's screenshot of 15. 11. 2026: Bellows's wide bellows lay over its headline.
  const frame = parseRules(css).filter((r) => r.selector === "html.js .story.is-motion .story__object" && r.context.some((c) => c.includes("orientation: landscape") || c.includes("max-height: 760px")));
  assert.equal(frame.length, 2, "the frame's rule and the short window's rule");
  for (const rule of frame) {
    const width = rule.declarations.find((d) => d.prop === "width")?.value;
    assert.ok(width && parseFloat(width) < 50, `${rule.context.join(" ")}: width ${width} stays under half the frame`);
  }
  const main = frame.find((r) => r.context.some((c) => c.includes("orientation: landscape")));
  const value = (prop) => main.declarations.find((d) => d.prop === prop)?.value;
  assert.deepEqual([value("left"), value("right")], ["auto", "0"]);
  assert.equal(value("transform").includes("-50%"), false, "anchored to the right, not centred");
});
