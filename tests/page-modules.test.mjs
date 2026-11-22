import assert from "node:assert/strict";
import { test } from "node:test";
import { moduleStory } from "../src/components/module-story.mjs";
import { MODULES, MODULES_PAGE } from "../src/content/modules.mjs";
import { withLocale } from "../src/i18n/index.mjs";
import { built, currentNav, h1, h2s, hrefs, main, plain, primaryButtons, sectionIds } from "./lib/pages.mjs";

const html = built("/moduly/");

test("expected: five addressable chapters of the story in the family's order", () => {
  assert.deepEqual(sectionIds(html), ["skladani", "bellows", "anvil", "temper", "rivet", "harness", "ukazka"]);
  assert.deepEqual(h2s(html).slice(0, 5), ["Bellows", "Anvil", "Temper", "Rivet", "Cognera Harness"]);
  assert.deepEqual(currentNav(html), ["Moduly"]);
});

test("expected: under the heading the assembly scene seats the modules beside Forge, before the index and the story", () => {
  const body = main(html);
  const order = ['class="hero hero--plain"', 'id="skladani"', "module-index", 'class="story"', 'id="bellows"', 'id="ukazka"'].map((part) => body.indexOf(part));
  assert.ok(order.every((at) => at >= 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  const scene = body.slice(body.indexOf('id="skladani"'), body.indexOf("module-index"));
  // The page's h1 is the scene's heading: the scene has no heading block and is named for assistive technology.
  assert.ok(body.includes('<section class="scene" id="skladani" aria-label="Moduly" data-scene="assembly">'));
  assert.equal(scene.includes("scene__intro"), false);
  assert.equal(/<h2/.test(scene), false);
  assert.equal((scene.match(/class="scene__caption /g) ?? []).length, 6);
  assert.ok(plain(scene).includes("Forge. Ze zadání udělá hotový, prověřený kód."));
  assert.equal(scene.includes("scene-more"), false, "the scene on the modules page does not link the modules page");
  // The modules' story: one chapter each, three steps and three screens, the 3D canvas loaded by its script.
  assert.ok(body.includes('<div class="story" id="pribeh" data-story="bellows,anvil,temper,rivet,harness" data-story-base="/assets/media/story/">'));
  assert.equal((body.match(/<li class="story__step/g) ?? []).length, 15);
  assert.equal((body.match(/<figure class="screen story__screen/g) ?? []).length, 15);
  assert.equal(/data-film-large/.test(body.slice(body.indexOf('class="story"'))), false, "the story's 3D is the canvas, not the films");
});

test("expected: the page presents modules as parts of Forge and each leads to its detail", () => {
  assert.equal(h1(html), "Jedno jádro. Pět modulů.");
  const hero = main(html).slice(0, main(html).indexOf("</section>"));
  assert.ok(hero.includes('<a class="link" href="/forge/">Forge</a>'));
  const out = hrefs(main(html)).filter((h) => h.startsWith("https://cognera.cz/") && !h.includes("#"));
  assert.deepEqual(out, ["https://cognera.cz/bellows", "https://cognera.cz/anvil", "https://cognera.cz/temper", "https://cognera.cz/rivet", "https://cognera.cz/harness"]);
  const last = main(html).slice(main(html).lastIndexOf("<section"));
  assert.equal(primaryButtons(last).length, 1);
  for (const slug of ["bellows", "anvil", "temper", "rivet", "harness"]) {
    assert.ok(html.includes(`class="object3d module-card__object" src="/assets/media/3d/${slug}.jpg"`), `${slug} object`);
    assert.ok(html.includes(`<img class="object3d" src="/assets/media/3d/${slug}.jpg" alt="" aria-hidden="true"`), `${slug} still of the story`);
  }
});

test("edge: the in-page index jumps to the chapters; no module is called a tool or an application", () => {
  const index = main(html).slice(main(html).indexOf("module-index"), main(html).indexOf('class="story"'));
  assert.deepEqual(hrefs(index), ["#bellows", "#anvil", "#temper", "#rivet", "#harness"]);
  const text = plain(main(html));
  assert.equal(/nástroj/i.test(text), false);
  assert.equal(/aplikac\S* (Bellows|Anvil|Temper|Rivet|Harness)/.test(text), false);
  assert.doesNotMatch(text, /\bModul\b/, "the common module badge is redundant on each chapter");
});

test("error: a story without the link label or with a module missing stops the page", () => {
  withLocale("cs", () => {
    assert.throws(() => moduleStory(MODULES), /label of each chapter's outward link/);
    assert.throws(() => moduleStory(MODULES.slice(1), { moreLabel: MODULES_PAGE.moreLabel }), /Missing modules: bellows/);
  });
});
