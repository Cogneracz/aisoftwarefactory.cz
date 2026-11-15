import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { test } from "node:test";
import { ROOT, mediaFiles } from "../build.mjs";
import { captionUnits, scrollScene } from "../src/components/scroll-scene.mjs";
import { content } from "../src/content/index.mjs";
import { LINE_ORDER } from "../src/content/line.mjs";
import { ASSEMBLY_STOPS, assemblyCaptions, lineCaptions } from "../src/content/scene.mjs";
import { withLocale } from "../src/i18n/index.mjs";
import { sceneManifest } from "../src/scenes.mjs";

const cs = content("cs");
const assembly = (extra = {}) => scrollScene({ id: "moduly", scene: "assembly", ...cs.assembly, captions: assemblyCaptions(cs), manifest: sceneManifest("assembly"), ...extra });
const line = (extra = {}) => scrollScene({ id: "linka", scene: "line-cs", eyebrow: cs.line.eyebrow, heading: cs.line.heading, lead: cs.line.lead, label: cs.line.label, captions: lineCaptions(cs), manifest: sceneManifest("line-cs"), ...extra });
const plain = (html) => html.replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const railOf = (html) => [...html.matchAll(/<span class="scene__seg[^"]*"><i><\/i><b>([^<]+)<\/b>/g)].map((m) => m[1]);

test("expected: the assembly's six stops are named by their product and its sentence from the line", () => {
  const captions = assemblyCaptions(cs);
  assert.deepEqual(captions.map((c) => c.slug), ASSEMBLY_STOPS);
  assert.deepEqual(captions.map((c) => c.name), ["Forge", "Anvil", "Temper", "Bellows", "Rivet", "Cognera Harness"]);
  assert.equal(captions[0].title, "Ze zadání udělá hotový, prověřený kód.");
  assert.equal(captions[5].title, "Společný základ pro Forge i moduly.");
  for (const c of captions) assert.ok(c.alt.length > 20, c.slug);
});

test("expected: the line's six stops are the five steps with their decisions, then the base", () => {
  const captions = lineCaptions(cs);
  assert.deepEqual(captions.map((c) => c.slug), [...LINE_ORDER, "harness"]);
  assert.deepEqual(captions.map((c) => c.name), ["Průzkum", "Zadání", "Vývoj", "Ověření", "Nasazení", "Základ"]);
  assert.deepEqual(captions.map((c) => c.title), [
    "O nápadu vždy rozhodne člověk.",
    "Zadání změní jen s vaším souhlasem.",
    "Bez schválení se nic nesloučí.",
    "Vizuální změny schvaluje člověk.",
    "Produkce chce druhé potvrzení.",
    "Pro každou úlohu doporučí vhodného agenta.",
  ]);
  const english = lineCaptions(content("en"));
  assert.deepEqual(english.map((c) => c.name), ["Research", "Spec", "Build", "Verify", "Deploy", "Foundation"]);
  assert.equal(english[2].title, "Nothing is merged without approval.");
});

test("expected: a scene holds a canvas with its description, the live captions, the rail and the stills", () => {
  const html = assembly();
  const m = sceneManifest("assembly");
  assert.ok(html.startsWith('<section class="scene" id="moduly" aria-labelledby="moduly-title" data-scene="assembly">'));
  assert.ok(html.includes(`<canvas class="scene__canvas" width="1600" height="900" role="img" aria-label="${cs.assembly.label}"></canvas>`));
  assert.equal((html.match(/class="scene__caption /g) ?? []).length, 6);
  assert.deepEqual([...html.matchAll(/data-at="([\d.]+)"/g)].map((x) => Number(x[1])), [0, 0.126, 0.314, 0.501, 0.688, 0.876]);
  assert.equal((html.match(/aria-current="step"/g) ?? []).length, 1);
  assert.equal((html.match(/class="scene__caption is-next"[^>]*aria-hidden="true"/g) ?? []).length, 5);
  assert.deepEqual(railOf(html), ["Forge", "Anvil", "Temper", "Bellows", "Rivet", "Cognera Harness"]);
  assert.equal((html.match(/<li class="scene__step">/g) ?? []).length, 6);
  assert.ok(html.includes(`/assets/media/scenes/assembly/steps/large-6.webp?v=${m.revision}`) && html.includes(`/assets/media/scenes/assembly/steps/small-1.avif?v=${m.revision}`));
  assert.ok(html.includes('<div class="scene-more"><p class="container"><a class="link link--more" href="/moduly/">'));
});

test("expected: the line scene names its own frames, per language, and has no link after it", () => {
  const html = line();
  assert.ok(html.startsWith('<section class="scene" id="linka" aria-labelledby="linka-title" data-scene="line-cs">'));
  assert.deepEqual(railOf(html), ["Průzkum", "Zadání", "Vývoj", "Ověření", "Nasazení", "Základ"]);
  assert.deepEqual([...html.matchAll(/data-at="([\d.]+)"/g)].map((x) => Number(x[1])), [0, 0.188, 0.349, 0.52, 0.681, 0.848]);
  assert.ok(html.includes("/assets/media/scenes/line-cs/steps/large-1.webp") && !html.includes("scene-more"));
  assert.ok(plain(html).includes("Pět kroků. Pět rozhodnutí."));
  const en = content("en");
  const english = withLocale("en", () => scrollScene({ id: "linka", scene: "line-en", eyebrow: en.line.eyebrow, heading: en.line.heading, lead: en.line.lead, label: en.line.label, captions: lineCaptions(en), manifest: sceneManifest("line-en") }));
  assert.ok(english.includes('data-scene="line-en"') && english.includes("/assets/media/scenes/line-en/steps/small-3.avif"));
  assert.ok(plain(english).includes("Five steps. Five decisions.") && plain(english).includes("Build. Nothing is merged without approval."));
});

test("expected: a caption's words are separate units, the name leading, and read as the plain sentence", () => {
  assert.deepEqual(captionUnits("Forge", "Ze zadání udělá hotový, prověřený kód."), ["Forge.", "Ze", "zadání", "udělá", "hotový,", "prověřený", "kód."]);
  const html = assembly();
  const first = html.slice(html.indexOf('<p class="scene__line">'), html.indexOf("</p>", html.indexOf('<p class="scene__line">')));
  assert.ok(first.includes('<span class="scene__w is-lead" style="--k:0"><span>Forge.</span></span>'));
  assert.ok(first.includes('<span class="scene__w" style="--k:6"><span>kód.</span></span>'));
  assert.equal(plain(first), "Forge. Ze zadání udělá hotový, prověřený kód.");
});

test("edge: a one-letter word rides with the next one; without a link or a lead nothing empty is left", () => {
  assert.deepEqual(captionUnits("Rivet", "Nasadí jen ověřenou a schválenou verzi."), ["Rivet.", "Nasadí", "jen", "ověřenou", "a schválenou", "verzi."]);
  const bare = assembly({ link: undefined, lead: undefined, eyebrow: undefined });
  assert.equal(bare.includes("scene-more"), false);
  assert.equal(bare.includes('class="section__lead"'), false);
  assert.equal(bare.includes('class="eyebrow"'), false);
  assert.ok(bare.trimEnd().endsWith("</section>"));
});

test("edge: under a page's own heading a scene has no heading block and is named by its name", () => {
  const html = assembly({ id: "skladani", eyebrow: undefined, heading: undefined, lead: undefined, link: undefined, name: "Moduly" });
  assert.ok(html.startsWith('<section class="scene" id="skladani" aria-label="Moduly" data-scene="assembly">'));
  assert.equal(html.includes("scene__intro") || html.includes("aria-labelledby") || html.includes("<h2"), false);
  assert.equal((html.match(/class="scene__caption /g) ?? []).length, 6);
  assert.equal((html.match(/<li class="scene__step">/g) ?? []).length, 6);
  // With a heading the name is not needed and not printed.
  assert.equal(assembly({ name: "Moduly" }).includes("aria-label=\"Moduly\""), false);
});

test("error: captions that do not match the stops, a missing manifest, name, heading or description throw", () => {
  assert.throws(() => assembly({ captions: assemblyCaptions(cs).slice(0, 5) }), /one caption per stop: 6 stops, 5 captions/);
  assert.throws(() => assembly({ manifest: undefined }), /one caption per stop: 0 stops/);
  assert.throws(() => assembly({ manifest: { ...sceneManifest("assembly"), revision: "" } }), /needs its frame manifest/);
  assert.throws(() => assembly({ manifest: { ...sceneManifest("assembly"), stills: undefined } }), /needs its frame manifest/);
  assert.throws(() => assembly({ scene: "../etc" }), /Not a scene name/);
  assert.throws(() => assembly({ scene: undefined }), /Not a scene name/);
  assert.throws(() => assembly({ heading: "" }), /scene's heading or name is required/);
  assert.throws(() => assembly({ heading: undefined, name: " " }), /scene's heading or name is required/);
  assert.throws(() => assembly({ label: " " }), /scene's description is required/);
  const noAlt = assemblyCaptions(cs).map((c, k) => (k === 2 ? { ...c, alt: "" } : c));
  assert.throws(() => assembly({ captions: noAlt }), /alt of stop 3 is required/);
  assert.throws(() => assemblyCaptions({ ...cs, line: { ...cs.line, steps: cs.line.steps.filter((s) => s.slug !== "temper") } }), /no caption for the stop "temper"/);
  assert.throws(() => lineCaptions({ line: { ...cs.line, steps: cs.line.steps.slice(0, 4) } }), /must run bellows, anvil, forge, temper, rivet/);
  assert.throws(() => lineCaptions({ line: { ...cs.line, base: undefined } }), /needs its base/);
  assert.throws(() => lineCaptions({ line: { ...cs.line, stills: cs.line.stills.slice(0, 5) } }), /each of its six stops/);
});

test("expected: every frame, still, film and picture the manifests name is on disk", async () => {
  const files = mediaFiles();
  assert.ok(files.length > 6500, `only ${files.length} files`);
  for (const file of files) await access(`${ROOT}${file}`);
});
