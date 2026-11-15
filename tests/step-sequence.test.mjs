import assert from "node:assert/strict";
import { test } from "node:test";
import { stepSequence } from "../src/components/step-sequence.mjs";
import { FORGE } from "../src/content/forge.mjs";

const step = (n) => ({ title: `Krok ${n}.`, body: `Co se v kroku ${n} stane.`, screen: "forge-step-a" });
const many = (n) => Array.from({ length: n }, (_, i) => step(i + 1));
const numbers = (html) => [...html.matchAll(/<span class="step__number" aria-hidden="true">(\d+)<\/span>/g)].map((m) => m[1]);

test("expected: Forge's six steps render as an ordered list with numbers, titles and screens", () => {
  const html = stepSequence({ id: "postup", heading: FORGE.steps.heading, steps: FORGE.steps.items });
  assert.equal((html.match(/<ol class="steps">/g) ?? []).length, 1);
  assert.deepEqual(numbers(html), ["01", "02", "03", "04", "05", "06"]);
  assert.equal((html.match(/<h3 class="step__title">/g) ?? []).length, 6);
  assert.equal((html.match(/<figure class="screen">/g) ?? []).length, 6);
  assert.deepEqual(
    [...html.matchAll(/<h3 class="step__title">([^<]+)</g)].map((m) => m[1]),
    ["Zadání.", "Plán ke schválení.", "Kód a&nbsp;testy.", "Kontrola kódu.", "Ověření v&nbsp;prohlížeči.", "Sloučení."],
  );
  assert.ok(html.includes("Změny sloučí až člověk"));
});

test("edge: two and nine steps are the bounds; the visible number is hidden from assistive technology", () => {
  assert.deepEqual(numbers(stepSequence({ id: "a", heading: "A", steps: many(2) })), ["01", "02"]);
  assert.equal(numbers(stepSequence({ id: "a", heading: "A", steps: many(9) })).length, 9);
});

test("error: one step, ten steps and a step missing its title, body or screen throw", () => {
  assert.throws(() => stepSequence({ id: "a", heading: "A", steps: many(1) }), /takes 2 to 9 steps, got 1/);
  assert.throws(() => stepSequence({ id: "a", heading: "A", steps: many(10) }), /takes 2 to 9 steps, got 10/);
  assert.throws(() => stepSequence({ id: "a", heading: "A", steps: [step(1), { ...step(2), screen: "" }] }), /screen of step 02 \(Krok 2\.\)/);
  assert.throws(() => stepSequence({ id: "a", heading: "A", steps: [step(1), { ...step(2), title: "" }] }), /title of step 02/);
  assert.throws(() => stepSequence({ id: "a", heading: "A", steps: [step(1), { ...step(2), screen: "nic" }] }), /Unknown screen: "nic"/);
});
