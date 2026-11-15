import assert from "node:assert/strict";
import { test } from "node:test";
import { CONTENT, content } from "../src/content/index.mjs";
import { assemblyCaptions, lineCaptions } from "../src/content/scene.mjs";
import { LOCALES } from "../src/i18n/index.mjs";
import { OFFER_WORDS, copyOf, copyProblems } from "./lib/copy.mjs";

test("expected: the site's copy keeps the rules in every language", () => {
  for (const locale of LOCALES) {
    const c = content(locale);
    const strings = [...copyOf(c), ...copyOf(assemblyCaptions(c)), ...copyOf(lineCaptions(c))];
    assert.ok(strings.length > 200, `${locale}: only ${strings.length} strings`);
    for (const text of strings) assert.deepEqual(copyProblems(text, locale), [], `${locale}: ${text}`);
  }
});

test("expected: the two languages do not leak into each other", () => {
  const czechLetters = /[ěščřžůďťň]/i;
  for (const text of copyOf(CONTENT.en)) {
    // The company's seat and the register court keep their Czech names in English.
    if (/Chýnov|České Budějovice/.test(text)) continue;
    assert.equal(czechLetters.test(text), false, `Czech letters in English copy: ${text}`);
  }
  assert.ok(copyOf(CONTENT.cs).some((text) => czechLetters.test(text)));
  assert.equal(content("en").action.label, "Book a demo");
  assert.equal(content("cs").action.label, "Domluvit ukázku");
});

test("edge: addresses and identifiers are not copy; a module's link label is", () => {
  assert.deepEqual(copyOf({ slug: "forge-step-b", href: "https://cognera.cz/#contact-form", title: "A", nested: [{ screen: "x-y", body: "B", page: "forge", film: "factory" }] }), ["A", "B"]);
  assert.deepEqual(copyOf({ moreLabel: (name) => `Více o modulu ${name}` }), ["Více o modulu Bellows"]);
  assert.deepEqual(copyOf(null), []);
  assert.deepEqual(copyProblems("Ověří, že aplikace funguje."), []);
  assert.deepEqual(copyProblems("Tlačítko „Merge“ zmáčkne člověk."), []);
  assert.deepEqual(copyProblems("Tongs holding a red-hot bar.", "en"), []);
  assert.deepEqual(copyProblems("Verifies that your app works.", "en"), []);
});

test("edge: the closing band promises nothing Cognera does not publish", () => {
  for (const locale of LOCALES) {
    const c = content(locale);
    assert.equal(c.home.modules, undefined, "the home page shows the modules in the scene");
    for (const closing of [c.home.closing, c.forge.closing, c.modulesPage.closing]) {
      for (const text of copyOf(closing)) assert.equal(OFFER_WORDS[locale].test(text), false, `${locale}: ${text}`);
    }
  }
});

test("error: dashes, hyphens, vendors, metrics, filler and tool wording are refused", () => {
  const czech = {
    "Forge — továrna": "a dash",
    "AI-továrna": "a hyphen",
    "Vyzkoušejte to!": "an exclamation mark",
    "Postaveno na GPT": "an AI vendor or model",
    "O 40 % rychleji": "a metric",
    "Revoluční vývoj": "a filler word",
    "Šest nástrojů": "a module called a tool (Forge has modules, not tools)",
    "aplikace Temper": "a module called an application",
    "V továrně": "a non-breaking space typed into the source",
  };
  for (const [text, reason] of Object.entries(czech)) assert.ok(copyProblems(text, "cs").includes(reason), `${text}: ${reason}`);
  const english = {
    "Forge – the factory": "a dash",
    "Forge - the factory": "a hyphen",
    "Try it now!": "an exclamation mark",
    "Built on Claude": "an AI vendor or model",
    "40% faster": "a metric",
    "Three times faster": undefined,
    "A seamless workflow": "a filler word",
    "Six tools": "a module called a tool (Forge has modules, not tools)",
    "the Temper app": "a module called an application",
  };
  for (const [text, reason] of Object.entries(english)) {
    if (reason) assert.ok(copyProblems(text, "en").includes(reason), `${text}: ${reason}`);
  }
  assert.ok(copyProblems("3 times faster", "en").includes("a metric"));
});
