import assert from "node:assert/strict";
import { test } from "node:test";
import { icon } from "../src/components/icons.mjs";
import { arrowLabel } from "../src/components/rich.mjs";

const arrow = icon("arrow-up-right", { size: 14 });

test("expected: the last word and the arrow are bound; the rest of the label may wrap", () => {
  const html = arrowLabel("Více o modulu Cognera Harness na cognera.cz", arrow);
  assert.ok(html.startsWith("Více o&nbsp;modulu Cognera Harness na "));
  assert.ok(html.endsWith(`<span class="link__end">cognera.cz${arrow}</span>`));
  assert.equal((html.match(/link__end/g) ?? []).length, 1);
});

test("edge: a one-word label is bound whole; a word joined by a non-breaking space stays with it; text is escaped", () => {
  assert.equal(arrowLabel("Reference", arrow), `<span class="link__end">Reference${arrow}</span>`);
  // "a" keeps its next word (Czech typography), so the arrow carries both.
  assert.ok(arrowLabel("Moduly a Forge", arrow).endsWith(`<span class="link__end">a&nbsp;Forge${arrow}</span>`));
  assert.ok(arrowLabel("R&D <tým>", arrow).includes("R&amp;D <span class=\"link__end\">&lt;tým&gt;"));
});

test("error: a missing label or a missing icon throws", () => {
  assert.throws(() => arrowLabel("", arrow), /A link's label is required/);
  assert.throws(() => arrowLabel(undefined, arrow), /A link's label is required/);
  assert.throws(() => arrowLabel("Reference", ""), /an icon is required/);
  assert.throws(() => arrowLabel("Reference", "<script>"), /an icon is required/);
});
