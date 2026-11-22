import assert from "node:assert/strict";
import { test } from "node:test";
import { FAQ_MARKS, faq, faqJsonLd, partName } from "../src/components/faq.mjs";
import { productMark } from "../src/components/product-mark.mjs";
import { stagePart } from "../assets/js/faq.js";
import { CONTENT } from "../src/content/index.mjs";
import { withLocale } from "../src/i18n/index.mjs";
import { FAQ } from "../src/content/faq.mjs";
import { jsonForScript } from "../src/lib/html.mjs";

const item = (n) => ({ mark: "factory", q: `Otázka ${n}?`, a: `Odpověď ${n}.` });
const many = (n) => Array.from({ length: n }, (_, i) => item(i + 1));
const decode = (s) => s.replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&#39;/g, "'");
const visible = (html) =>
  [...html.matchAll(/<span class="faq__q">(.*?)<\/span>.*?<div class="faq__answer"><p>(.*?)<\/p>/gs)].map((m) => ({ q: decode(m[1]), a: decode(m[2]) }));

test("expected: nine questions render as native disclosures sharing one name, the first open", () => {
  const html = faq({ heading: "Časté otázky", items: FAQ });
  assert.equal(FAQ.length, 9);
  assert.equal((html.match(/<details class="faq__item" name="faq"/g) ?? []).length, 9);
  assert.equal((html.match(/<details class="faq__item" name="faq" data-mark="[a-z]+" open>/g) ?? []).length, 1);
  // Numbered in large type: 01 to 09.
  assert.deepEqual([...html.matchAll(/<span class="faq__number" aria-hidden="true">(\d+)<\/span>/g)].map((m) => m[1]), ["01", "02", "03", "04", "05", "06", "07", "08", "09"]);
  assert.ok(html.indexOf(" open>") < html.indexOf("Kdo rozhoduje"));
});

test("expected: the structured data equals the visible text", () => {
  const data = faqJsonLd(FAQ);
  assert.equal(data["@type"], "FAQPage");
  const shown = visible(faq({ heading: "Časté otázky", items: FAQ }));
  assert.deepEqual(
    data.mainEntity.map((e) => ({ q: e.name, a: e.acceptedAnswer.text })),
    shown,
  );
});

test("edge: six and twelve are the bounds; quotation marks, ampersands and markup cannot break the page", () => {
  assert.equal((faq({ heading: "A", items: many(6) }).match(/<details/g) ?? []).length, 6);
  assert.equal((faq({ heading: "A", items: many(12) }).match(/<details/g) ?? []).length, 12);
  const tricky = [...many(5), { mark: "forge", q: 'Co znamená "Merge" & <kontrola>?', a: 'Tlačítko "Merge" </script> & nic víc.' }];
  const html = faq({ heading: "A", items: tricky });
  assert.equal(html.includes("<kontrola>"), false);
  const json = jsonForScript(faqJsonLd(tricky));
  assert.equal(json.includes("</script>"), false);
  assert.equal(JSON.parse(json).mainEntity[5].acceptedAnswer.text, 'Tlačítko "Merge" </script> & nic víc.');
});

test("error: five or thirteen questions, a question without a question mark and an empty answer throw", () => {
  assert.throws(() => faq({ heading: "A", items: many(5) }), /takes 6 to 12 questions, got 5/);
  assert.throws(() => faq({ heading: "A", items: many(13) }), /takes 6 to 12 questions, got 13/);
  assert.throws(() => faq({ heading: "A", items: [...many(5), { mark: "anvil", q: "Bez otazníku", a: "x" }] }), /must end with a question mark/);
  assert.throws(() => faq({ heading: "A", items: [...many(5), { mark: "anvil", q: "Prázdná?", a: " " }] }), /answer to question 6 \(Prázdná\?\)/);
  assert.throws(() => faqJsonLd(many(2)), /takes 6 to 12 questions/);
});

test("expected: the stage shows one layer per part the answers are about, the first question's part in front", () => {
  const html = faq({ heading: "Časté otázky", items: FAQ });
  const layers = [...html.matchAll(/<div class="faq__layer( is-current)?" data-mark="([a-z]+)">/g)].map((m) => [m[2], Boolean(m[1])]);
  assert.deepEqual(layers, [["factory", true], ["rivet", false], ["forge", false], ["anvil", false], ["temper", false], ["bellows", false]]);
  assert.ok(html.includes('<div class="faq__stage" aria-hidden="true">'));
  // Each stage and narrow-screen answer uses the same official mark.
  for (const { mark } of FAQ) {
    const slug = mark === "factory" ? "forge" : mark;
    const start = html.indexOf(`data-mark="${mark}">`);
    const layer = html.slice(start, html.indexOf("</div>", start));
    assert.ok(layer.includes(productMark(slug, { className: "faq__mark", tile: false })), mark);
  }
  for (const row of html.matchAll(/<details[^>]*data-mark="([^"]+)"[^>]*>([\s\S]*?)<\/details>/g)) {
    const slug = row[1] === "factory" ? "forge" : row[1];
    assert.ok(row[2].includes(productMark(slug, { className: "faq__thumb", tile: false })), slug);
  }
  assert.doesNotMatch(html, /<img\b|\/assets\/media\/(film|3d)\//);
  assert.ok(html.includes('<p class="faq__ghost" style="--fit: 1">Anvil</p>'));
  assert.ok(html.includes('<p class="faq__caption"><span>Rivet</span><span>Nasazení</span></p>'));
  // Each question names its part, so the script can show it.
  assert.deepEqual([...html.matchAll(/data-mark="([a-z]+)"(?: open)?><summary/g)].map((m) => m[1]), FAQ.map((f) => f.mark));
  // The stage chooses: the pointed-at question, else the open one, else what it showed.
  assert.equal(stagePart("anvil", "rivet", "factory"), "anvil");
  assert.equal(stagePart(null, "rivet", "factory"), "rivet");
});

test("edge: English names the parts in English; with every question closed the stage keeps what it showed", () => {
  withLocale("en", () => {
    const html = faq({ heading: "Common questions", items: CONTENT.en.faq });
    assert.ok(html.includes('<p class="faq__caption"><span>Rivet</span><span>Deploy</span></p>'));
    assert.ok(html.includes('<p class="faq__caption"><span>AI Software Factory</span></p>'));
  });
  assert.deepEqual(CONTENT.en.faq.map((f) => f.mark), FAQ.map((f) => f.mark));
  assert.equal(stagePart(null, null, "temper"), "temper");
  assert.equal(stagePart("", undefined, "temper"), "temper");
  assert.deepEqual(partName("forge").ghost, "Forge");
  assert.deepEqual(FAQ_MARKS, ["factory", "forge", "bellows", "anvil", "temper", "rivet", "harness"]);
});

test("error: a question without its part, or with a part the factory does not have, stops the build", () => {
  assert.throws(() => faq({ heading: "A", items: [...many(5), { q: "Bez dílu?", a: "x" }] }), /Question 6 \(Bez dílu\?\) needs the part it is about: undefined/);
  assert.throws(() => faq({ heading: "A", items: [...many(5), { mark: "kladivo", q: "Kladivo?", a: "x" }] }), /needs the part it is about: "kladivo"/);
  assert.throws(() => partName("kladivo"), /Not a part of the factory: "kladivo"/);
  assert.equal(stagePart(null, null, null), null);
});
