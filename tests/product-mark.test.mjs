import assert from "node:assert/strict";
import { test } from "node:test";
import { MARK_SLUGS, productMark } from "../src/components/product-mark.mjs";

const count = (text, part) => text.split(part).length - 1;

test("expected: Forge's mark is a white tile with three diamonds in its colours", () => {
  const svg = productMark("forge");
  assert.match(svg, /^<svg class="mark" viewBox="0 0 512 512" aria-hidden="true" focusable="false">/);
  assert.equal(count(svg, "<rect"), 4);
  for (const colour of ["#ffffff", "#9a3412", "#ea580c", "#f59e0b"]) assert.ok(svg.includes(`fill="${colour}"`), colour);
});

test("expected: every product has a mark", () => {
  assert.deepEqual(MARK_SLUGS, ["forge", "bellows", "anvil", "temper", "rivet", "harness"]);
  for (const slug of MARK_SLUGS) assert.match(productMark(slug), /^<svg[^>]*>.+<\/svg>$/s, slug);
  assert.equal(count(productMark("harness"), "<path"), 3);
  assert.equal(count(productMark("rivet"), "<path"), 3);
  assert.equal(count(productMark("bellows"), "<path"), 2);
});

test("edge: without a tile, with a label, and as a file of its own", () => {
  const bare = productMark("bellows", { tile: false });
  assert.equal(count(bare, "<rect"), 0);
  assert.ok(bare.includes("<path"));
  const labelled = productMark("forge", { label: "Forge" });
  assert.ok(labelled.includes('role="img"') && labelled.includes('aria-label="Forge"'));
  assert.equal(labelled.includes("aria-hidden"), false);
  const file = productMark("forge", { standalone: true });
  assert.ok(file.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"'));
});

test("error: an unknown product throws and names the slug", () => {
  assert.throws(() => productMark("kladivo"), /Unknown product mark: "kladivo"/);
  assert.throws(() => productMark(), /Unknown product mark/);
});
