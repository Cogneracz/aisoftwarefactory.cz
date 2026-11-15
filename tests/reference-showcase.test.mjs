import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { test } from "node:test";
import { REFERENCE_RANGE, referenceCard, referenceShowcase } from "../src/components/reference-showcase.mjs";
import { HOME } from "../src/content/home.mjs";
import { CONTENT } from "../src/content/index.mjs";
import { REFERENCES, REFERENCE_SYSTEMS, referenceFiles, referencePicture } from "../src/content/references.mjs";
import { withLocale } from "../src/i18n/index.mjs";

const plain = (html) => html.replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
const showcase = (extra = {}) => referenceShowcase({ id: "cognera", ...HOME.proof, references: REFERENCES, ...extra });

test("expected: the claim, then the four systems of cognera.cz's home page, each one link to its case study", () => {
  const html = showcase();
  assert.ok(html.includes('<section class="section" id="cognera" aria-labelledby="cognera-title">'));
  assert.ok(plain(html).includes("Továrna, ve které sami pracujeme. Forge vznikl v naší dílně a používáme ho na vlastní práci."));
  assert.deepEqual(hrefs(html), [
    "https://cognera.cz/reference",
    "https://cognera.cz/reference/centera",
    "https://cognera.cz/reference/helpdesk",
    "https://cognera.cz/reference/cognera-crm",
    "https://cognera.cz/reference/invoiceai",
  ]);
  // The name is the card's heading; the arrow that leaves the site stays with its last word.
  assert.ok(html.includes('<h3 class="ref__name"><span class="link__end">Centera<svg class="icon"'));
  assert.ok(html.includes('<h3 class="ref__name">Cognera <span class="link__end">Helpdesk<svg class="icon"'));
  assert.equal((html.match(/<h3 class="ref__name">/g) ?? []).length, 4);
  // A deck: every system is one wide card that knows its place in the deck; the script may let them stack.
  assert.ok(html.includes('<ul class="refs" data-stack>'));
  const cards = html.split('<li class="ref-item"').slice(1);
  assert.equal(cards.length, 4);
  assert.deepEqual(cards.map((c) => /^ style="--n: (\d)">/.exec(c)?.[1]), ["0", "1", "2", "3"]);
  assert.ok(plain(cards[0]).includes("Proptech · ERP Centera Provozní systém pro majitele a správce nákupních center. Nahradil letitou aplikaci a je nasazený naostro. Postaveno s Forge Temper"));
  assert.ok(plain(cards[1]).includes("Podpora Cognera Helpdesk Hlášení zákazníka rovnou u vývojáře. Postaveno s Forge Temper Rivet"));
  assert.ok(plain(cards[3]).includes("Postaveno s Forge Cognera Harness"));
  // Under the cards: the systems were built with AI agents under senior oversight, on screens with invented data.
  assert.ok(html.includes('<p class="refs__note reveal">') && plain(html).includes("Obrazovky ukazují vymyšlená ukázková data, skutečné údaje klientů nikdy nezveřejňujeme."));
});

test("expected: pictures have sizes, width variants and a description; from 768 px every system shows its laptop and phone", () => {
  const cards = showcase().split('<li class="ref-item"').slice(1);
  for (const [i, slug] of ["centera", "helpdesk", "cognera-crm", "invoiceai"].entries()) {
    assert.ok(cards[i].includes(`<source media="(min-width: 768px)" srcset="/assets/media/references/${slug}-hero-1280.webp 1280w, /assets/media/references/${slug}-hero-1920.webp 1920w, /assets/media/references/${slug}-hero.webp 2520w"`), slug);
    assert.ok(cards[i].includes('width="2520" height="1080"'), slug);
    assert.ok(cards[i].includes(`srcset="/assets/media/references/${slug}-card-640.webp 640w, /assets/media/references/${slug}-card-960.webp 960w, /assets/media/references/${slug}-card.webp 1280w"`), slug);
    assert.ok(cards[i].includes(`<img src="/assets/media/references/${slug}-card.webp" alt="${REFERENCES.items[i].alt}" width="1280" height="960" loading="lazy" decoding="async">`), slug);
  }
  assert.deepEqual(referencePicture("centera-card").files.map((f) => f.width), [640, 960, 1280]);
});

test("expected: English shows cognera.cz's English lines and its English case studies", () => {
  withLocale("en", () => {
    const html = referenceShowcase({ id: "cognera", ...CONTENT.en.home.proof, references: CONTENT.en.references });
    assert.deepEqual(hrefs(html).slice(0, 3), ["https://cognera.cz/en/references", "https://cognera.cz/en/references/centera", "https://cognera.cz/en/references/helpdesk"]);
    assert.ok(plain(html).includes("Support Cognera Helpdesk Customer reports, straight to the developer. Built with Forge Temper Rivet"));
    assert.ok(plain(html).includes("The screens show invented demo data, and we never publish real client data."));
  });
});

test("edge: every picture the systems name is on disk; the two languages show the same systems; two systems make a deck too", async () => {
  const files = referenceFiles();
  assert.equal(files.length, 24);
  for (const file of files) await access(new URL(`..${file}`, import.meta.url));
  assert.deepEqual(CONTENT.en.references.items.map((i) => i.slug), REFERENCES.items.map((i) => i.slug));
  assert.deepEqual(REFERENCES.items.map((i) => i.slug), Object.keys(REFERENCE_SYSTEMS));
  const two = showcase({ references: { ...REFERENCES, items: REFERENCES.items.slice(0, 2) }, surface: true });
  assert.equal((two.match(/<li class="ref-item"/g) ?? []).length, 2);
  assert.ok(two.includes('<section class="section section--surface" id="cognera"'));
  assert.deepEqual(REFERENCE_RANGE, [2, 4]);
  // The marks are decoration beside the parts' names, and a card holds no second link.
  const card = referenceCard(REFERENCES.items[1], { order: 1, builtWith: REFERENCES.builtWith });
  assert.equal((card.match(/<a /g) ?? []).length, 1);
  assert.equal((card.match(/<svg class="mark"[^>]*aria-hidden="true"/g) ?? []).length, 3);
});

test("error: an unpublished system, a system without a part, a missing line or label, and one system alone stop the build", () => {
  const item = REFERENCES.items[0];
  const opts = { builtWith: REFERENCES.builtWith };
  assert.throws(() => referenceCard({ ...item, slug: "tajny-system" }, opts), /Not a published reference: "tajny-system"/);
  assert.throws(() => referenceCard({ ...item, line: "" }, opts), /The line of Centera is required/);
  assert.throws(() => referenceCard({ ...item, alt: undefined }, opts), /The alt of Centera is required/);
  assert.throws(() => referenceCard(item), /The label of the parts a system was built with is required/);
  assert.throws(() => referenceCard({ slug: "centera" }, opts), /A reference's name is required/);
  assert.throws(() => showcase({ references: { ...REFERENCES, items: REFERENCES.items.slice(0, 1) } }), /takes 2 to 4 systems, got 1/);
  assert.throws(() => showcase({ references: undefined }), /takes 2 to 4 systems, got 0/);
  assert.throws(() => showcase({ link: { label: "Reference", cognera: "nikam" } }), /The link to all references on cognera\.cz is required/);
  assert.throws(() => showcase({ references: { ...REFERENCES, note: "" } }), /The note about demo data is required/);
  assert.throws(() => referenceCard(item, { ...opts, order: -1 }), /Invalid place in the deck: -1/);
  assert.throws(() => referencePicture("centera-card", "poster"), /Unknown reference picture kind/);
  assert.throws(() => referencePicture("../tajne"), /Invalid reference picture/);
  const saved = REFERENCE_SYSTEMS.helpdesk.marks;
  const pair = REFERENCE_SYSTEMS.invoiceai.pair;
  try {
    REFERENCE_SYSTEMS.invoiceai.pair = undefined;
    assert.throws(() => referenceCard(REFERENCES.items[3], opts), /A system's laptop and phone picture is required/);
    REFERENCE_SYSTEMS.invoiceai.pair = pair;
    REFERENCE_SYSTEMS.helpdesk.marks = [];
    assert.throws(() => referenceCard(REFERENCES.items[1], opts), /Cognera Helpdesk lists no part of the factory/);
    REFERENCE_SYSTEMS.helpdesk.marks = ["kladivo"];
    assert.throws(() => referenceCard(REFERENCES.items[1], opts), /Not a part of the factory: "kladivo"/);
  } finally {
    REFERENCE_SYSTEMS.helpdesk.marks = saved;
    REFERENCE_SYSTEMS.invoiceai.pair = pair;
  }
});
