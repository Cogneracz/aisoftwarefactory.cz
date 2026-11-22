import assert from "node:assert/strict";
import { test } from "node:test";
import { stepSequence } from "../src/components/step-sequence.mjs";
import { FORGE } from "../src/content/forge.mjs";
import { built, currentNav, h1, h2s, main, plain, primaryButtons, sectionIds } from "./lib/pages.mjs";

const html = built("/forge/");

test("expected: the page opens with what Forge does and one action", () => {
  assert.equal(h1(html), "Schválíte plán. Forge napíše kód.");
  const hero = main(html).slice(0, main(html).indexOf("</section>"));
  assert.ok(hero.includes('<span class="tag">Jádro</span>') && hero.includes("<svg"));
  assert.ok(plain(hero).includes("Projdete si změny i výsledky testů"));
  assert.equal(primaryButtons(hero).length, 1);
  assert.ok(hero.includes("data-hero-promo") && hero.includes('src="/assets/media/film/forge-relay.mp4"'));
  assert.deepEqual(currentNav(html), ["Forge"]);
});

test("expected: six steps from brief to merge, then how Forge works, proof and the closing action", () => {
  assert.deepEqual(sectionIds(html), ["postup", "prace", "cognera", "ukazka"]);
  assert.deepEqual(h2s(html), ["Od zadání po sloučení.", "Jak Forge pracuje.", "Továrna, ve které sami pracujeme.", "Ukažte nám svůj backlog."]);
  const steps = [...html.matchAll(/<h3 class="step__title">([^<]+)</g)].map((m) => m[1].replace(/&nbsp;/g, " "));
  assert.deepEqual(steps, ["Zadání.", "Plán ke schválení.", "Kód a testy.", "Kontrola kódu.", "Ověření v prohlížeči.", "Sloučení."]);
  assert.ok(plain(main(html)).includes("Změny sloučí až člověk tlačítkem „Merge“."));
  const last = main(html).slice(main(html).lastIndexOf("<section"));
  assert.deepEqual(primaryButtons(last), [{ href: "https://cognera.cz/#contact-form", label: "Domluvit ukázku" }]);
});

test("edge: two picture shapes share the sequence; claims stay as published", () => {
  const body = main(html);
  assert.ok(body.includes('forge-step-a.webp" alt') && body.includes('width="1920" height="1200"'));
  assert.ok(body.includes("forge-tile-d.webp") && body.includes('width="1920" height="960"'));
  const text = plain(body).toLowerCase();
  for (const word of ["vždy zkontroluje", "každou změnu", "automaticky sloučí", "pull request"]) assert.equal(text.includes(word), false, word);
});

test("error: a step whose screen is missing stops the page", () => {
  const broken = FORGE.steps.items.map((s, i) => (i === 3 ? { ...s, screen: "forge-step-z" } : s));
  assert.throws(() => stepSequence({ id: "postup", heading: FORGE.steps.heading, steps: broken }), /Unknown screen: "forge-step-z"/);
});
