import assert from "node:assert/strict";
import { test } from "node:test";
import { FAQ } from "../src/content/faq.mjs";
import { page } from "../src/layout.mjs";
import { built, h1, h2s, hrefs, jsonLd, main, plain, primaryButtons, sectionIds } from "./lib/pages.mjs";

const html = built("/");

test("expected: the first screen states the offer, one action, one proof and the factory's 3D film", () => {
  assert.equal(h1(html), "AI továrna na software, ve které rozhodujete vy.");
  const hero = main(html).slice(0, main(html).indexOf("</section>"));
  assert.ok(plain(hero).includes("Forge dovede zadání k hotovému, prověřenému kódu."));
  assert.equal(primaryButtons(hero).length, 1);
  assert.ok(plain(hero).includes("Forge vznikl v Cogneře a sami s ním pracujeme."));
  assert.ok(hero.includes('data-film-large="/assets/media/film/factory-large.mp4"') && hero.includes("/assets/media/film/factory-large-start.jpg"));
  assert.ok(html.includes('<link rel="preload" as="image" href="/assets/media/film/factory-large-start.jpg" media="(min-width: 768px)" fetchpriority="high">'));
});

test("expected: the sections follow the argument, each under its own heading", () => {
  assert.deepEqual(sectionIds(html), ["film", "linka", "bellows", "anvil", "forge", "temper", "rivet", "harness", "cognera", "otazky", "ukazka"]);
  const body = main(html);
  const order = ['class="hero hero--stacked"', 'class="tagline"', 'id="film"', 'id="linka"', 'class="story"', 'id="cognera"', 'id="otazky"', 'id="ukazka"'].map((part) => body.indexOf(part));
  assert.ok(order.every((at) => at >= 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.deepEqual(h2s(html), ["Forge v jedné minutě.", "Pět kroků. Pět rozhodnutí.", "Továrna, ve které sami pracujeme.", "Časté otázky", "Ukažte nám svůj backlog."]);
  assert.equal((html.match(/<h1[\s>]/g) ?? []).length, 1);
});

test("expected: the line is one story of five chapters and its base, each under the decision a person makes, with real screens", () => {
  const body = main(html);
  const line = body.slice(body.indexOf('id="linka"'), body.indexOf('id="cognera"'));
  assert.ok(line.includes('<div class="story" id="pribeh" data-story="bellows,anvil,forge,temper,rivet,harness" data-story-base="/assets/media/story/" data-story-steps="2">'));
  assert.ok(line.includes('<div class="story__track" style="--chapters: 6; --steps: 2">'));
  assert.deepEqual([...line.matchAll(/<h3 class="story__name" id="[a-z]+-title">([^<]+)/g)].map((m) => m[1]), ["Bellows", "Anvil", "Forge", "Temper", "Rivet", "Cognera Harness"]);
  assert.deepEqual(
    [...line.matchAll(/<p class="story__headline">([^<]+)/g)].map((m) => m[1].replace(/&nbsp;/g, " ")),
    ["O nápadu vždy rozhodne člověk.", "Zadání změní jen s vaším souhlasem.", "Bez schválení se nic nesloučí.", "Vizuální změny schvaluje člověk.", "Produkce chce druhé potvrzení.", "Pro každou úlohu doporučí vhodného agenta."],
  );
  assert.equal((line.match(/<li class="story__step/g) ?? []).length, 12);
  assert.equal((line.match(/<figure class="screen story__screen/g) ?? []).length, 12);
  // Forge is the core among the modules, and its plan is shown without the task's status bar.
  const forge = line.slice(line.indexOf('id="forge"'), line.indexOf('id="temper"'));
  assert.ok(plain(forge).includes("Vývoj Jádro Forge Bez schválení se nic nesloučí. 01 Plán ke schválení. Forge rozepíše postup a počká, až ho schválíte. 02 Kontrola kódu."));
  assert.ok(forge.includes('src="/assets/media/screens/forge-plan.webp"') && !forge.includes("forge-step-b.webp"));
  // No static boxes of claims and no pre-rendered scene: the story is the page's one pinned stage.
  assert.equal(body.includes('class="feature') || body.includes('class="evidence'), false);
  assert.equal((html.match(/data-scene="/g) ?? []).length, 0);
});

test("expected: the proof shows the systems built in the factory", () => {
  const body = main(html);
  const proof = body.slice(body.indexOf('id="cognera"'), body.indexOf('id="otazky"'));
  assert.deepEqual(hrefs(proof), ["https://cognera.cz/reference", "https://cognera.cz/reference/centera", "https://cognera.cz/reference/helpdesk", "https://cognera.cz/reference/cognera-crm", "https://cognera.cz/reference/invoiceai"]);
  assert.equal((proof.match(/<li class="ref-item/g) ?? []).length, 4);
  assert.ok(plain(proof).includes("Každý z těchto systémů jsme postavili s AI agenty pod dohledem seniorů."));
  // The English page tells the same story and links the English case studies.
  const english = main(built("/en/"));
  assert.ok(hrefs(english).includes("https://cognera.cz/en/references/invoiceai"));
  assert.equal((english.match(/<li class="story__step/g) ?? []).length, 12);
  assert.ok(plain(english).includes("Build Core Forge Nothing is merged without approval."));
});

test("expected: one primary action; the proof links Cognera's references; the page describes itself", () => {
  const buttons = primaryButtons(html);
  assert.equal(buttons.length, 3);
  assert.ok(buttons.every((b) => b.label === "Domluvit ukázku" && b.href === "https://cognera.cz/#contact-form"));
  assert.ok(hrefs(main(html)).includes("https://cognera.cz/reference"));
  const data = jsonLd(html);
  assert.deepEqual(data.map((d) => d["@type"]), ["WebSite", "Organization", "FAQPage"]);
  assert.equal(data[1].name, "Cognera s.r.o.");
  assert.deepEqual(data[2].mainEntity.map((q) => q.name), FAQ.map((f) => f.q));
  assert.ok(html.includes("<title>AI továrna na software | Forge od Cognery</title>"));
  assert.ok(html.includes('<link rel="canonical" href="https://aisoftwarefactory.cz/">'));
});

test("edge: the modules are the story's chapters, not a second list of cards; no testimonial or number is shown", () => {
  // The owner (14. 11. 2026): the section of five module cards under the story was needless.
  assert.equal(html.includes('class="module-grid"') || html.includes('class="module-card"'), false);
  assert.equal(h2s(html).includes("Jedno jádro. Pět modulů."), false);
  // The way to the modules page is the bar and the footer; the footer still leads to each module.
  assert.ok(hrefs(html).includes("/moduly/") && hrefs(html).includes("/moduly/#rivet"));
  // A chapter of the story has no link out: its only links are the row of chapters, each to a chapter on this page.
  const line = main(html).slice(main(html).indexOf('id="linka"'), main(html).indexOf('id="cognera"'));
  assert.deepEqual(hrefs(line), ["#bellows", "#anvil", "#forge", "#temper", "#rivet", "#harness"]);
  assert.equal(/blockquote|testimonial/.test(html), false);
  assert.equal(/\d+ ?%/.test(plain(main(html))), false);
});

test("error: a page whose content is missing does not render", () => {
  assert.throws(() => page({ path: "/", meta: { title: "AI továrna na software", description: "" }, body: "<p>x</p>" }), /description of \/ is required/);
  assert.throws(() => built("/neexistuje/"), /No page at/);
});
