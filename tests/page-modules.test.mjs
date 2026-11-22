import assert from "node:assert/strict";
import { test } from "node:test";
import { productMark } from "../src/components/product-mark.mjs";
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

test("expected: the original assembly bookmark now opens the accessible logo index before the story", () => {
  const body = main(html);
  const order = ['class="hero hero--plain"', 'id="skladani"', 'class="story"', 'id="bellows"', 'id="ukazka"'].map((part) => body.indexOf(part));
  assert.ok(order.every((at) => at >= 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(body.includes(`<section class="container module-index" id="skladani" aria-label="${MODULES_PAGE.indexLabel}">`));
  assert.doesNotMatch(body, /data-scene="assembly"|src="[^"]*\/scenes\/assembly\//);
  assert.ok(body.includes('<div class="story" id="pribeh" data-story="bellows,anvil,temper,rivet,harness">'));
  assert.equal((body.match(/<li class="story__step/g) ?? []).length, 15);
  assert.equal((body.match(/<figure class="screen story__screen/g) ?? []).length, 15);
  assert.doesNotMatch(body, /data-film-large|data-story-base|class="story__object"/);
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
    assert.ok(html.includes(productMark(slug, { className: "module-card__logo", tile: false })), `${slug} logo`);
    assert.ok(html.includes(productMark(slug, { className: "story__logo", tile: false })), `${slug} chapter logo`);
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
