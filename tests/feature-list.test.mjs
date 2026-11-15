import assert from "node:assert/strict";
import { test } from "node:test";
import { featureList } from "../src/components/feature-list.mjs";
import { FORGE } from "../src/content/forge.mjs";

const item = (n) => ({ title: `Tvrzení ${n}.`, body: `Podrobnost ${n}.` });
const many = (n) => Array.from({ length: n }, (_, i) => item(i + 1));

test("expected: four claims render as a heading and a list of four claims with their detail", () => {
  const html = featureList({ id: "jistoty", ...FORGE.work });
  assert.equal((html.match(/<h2 /g) ?? []).length, 1);
  assert.equal((html.match(/<li class="feature reveal">/g) ?? []).length, 4);
  assert.equal((html.match(/<h3 class="feature__title">/g) ?? []).length, 4);
  assert.ok(html.includes('data-count="4"') && html.includes('id="jistoty"') && html.includes('aria-labelledby="jistoty-title"'));
  assert.ok(html.includes("Slučuje vždy člověk."));
});

test("edge: two and six items are the bounds; six set three columns through data-count", () => {
  assert.ok(featureList({ id: "a", heading: "A", items: many(2) }).includes('data-count="2"'));
  assert.ok(featureList({ id: "a", heading: "A", items: many(6) }).includes('data-count="6"'));
  assert.ok(featureList({ id: "a", heading: "A", items: many(2), surface: true }).includes("section--surface"));
});

test("error: too few, too many, an item without a title or a body, a missing id or heading throw", () => {
  assert.throws(() => featureList({ id: "a", heading: "A", items: many(1) }), /takes 2 to 6 items, got 1/);
  assert.throws(() => featureList({ id: "a", heading: "A", items: many(7) }), /takes 2 to 6 items, got 7/);
  assert.throws(() => featureList({ id: "a", heading: "A", items: [item(1), { title: "Bez těla.", body: "" }] }), /body of item 2 \(Bez těla\.\)/);
  assert.throws(() => featureList({ id: "a", heading: "A", items: [item(1), { body: "x" }] }), /title of item 2/);
  assert.throws(() => featureList({ heading: "A", items: many(2) }), /id is required/);
  assert.throws(() => featureList({ id: "a", items: many(2) }), /heading is required/);
});
