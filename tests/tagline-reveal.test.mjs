import assert from "node:assert/strict";
import { test } from "node:test";
import { activeWords, sectionProgress } from "../assets/js/tagline.js";
import { MIN_WORDS, splitWords, taglineReveal } from "../src/components/tagline-reveal.mjs";
import { HOME } from "../src/content/home.mjs";

const words = (html) => [...html.matchAll(/<span class="tagline__word">([^<]+)<\/span>/g)].map((m) => m[1]);

test("expected: every word is its own element and the paragraph reads as plain text", () => {
  const html = taglineReveal({ sentences: HOME.tagline });
  const all = HOME.tagline.join(" ").split(" ");
  assert.deepEqual(words(html), all);
  assert.equal(html.replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim(), HOME.tagline.join(" "));
  assert.equal((html.match(/tagline__sentence/g) ?? []).length, HOME.tagline.length);
  assert.ok(html.includes("data-tagline"));
});

test("expected: the words light up in reading order with the scroll", () => {
  assert.equal(activeWords(0.5, 18), 9);
  assert.equal(activeWords(0, 18), 0);
  assert.equal(activeWords(1, 18), 18);
  assert.equal(sectionProgress(850, 200, 1000), 0);
  assert.equal(sectionProgress(250, 200, 1000), 1);
  assert.equal(sectionProgress(550, 200, 1000), 0.5);
});

test("edge: bounds, rounding and a non-breaking space inside a sentence", () => {
  assert.equal(activeWords(-0.4, 18), 0);
  assert.equal(activeWords(1.7, 18), 18);
  assert.equal(activeWords(0.49, 3), 1);
  assert.equal(activeWords(0.5, 0), 0);
  assert.equal(activeWords(Number.NaN, 18), 0);
  assert.equal(sectionProgress(2000, 200, 1000), 0);
  assert.equal(sectionProgress(-900, 200, 1000), 1);
  assert.equal(sectionProgress(Number.NaN, 200, 1000), 0);
  assert.equal(sectionProgress(100, 200, 0), 0);
  assert.deepEqual(splitWords("Agenti a lidé"), ["Agenti", " ", "a", " ", "lidé"]);
  const html = taglineReveal({ sentences: ["Agenti a lidé pracují spolu v jedné továrně každý den."] });
  assert.ok(html.includes('<span class="tagline__word">a</span>&nbsp;<span class="tagline__word">lidé</span>'));
});

test("error: no sentence, a short sentence and an invalid count throw", () => {
  assert.throws(() => taglineReveal({ sentences: [] }), /one or more sentences/);
  assert.throws(() => taglineReveal({ sentences: ["Jen tři slova."] }), new RegExp(`needs ${MIN_WORDS} or more words`));
  assert.throws(() => taglineReveal({ sentences: ["Dobrá věta.", " "] }), /sentences/);
  assert.throws(() => activeWords(0.5, -1), /count/);
  assert.throws(() => activeWords(0.5, 2.5), /count/);
});
