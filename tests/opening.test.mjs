import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { openingShare } from "../assets/js/opening.js";
import { parseRules } from "./lib/css-contract.mjs";

test("expected: the opening's share is how far the hero has left the top of the screen", () => {
  assert.equal(openingShare(0, 1000), 0);
  assert.equal(openingShare(-250, 1000), 0.25);
  assert.equal(openingShare(-1000, 1000), 1);
});

test("edge: below the top it has not left at all; past its height it has left completely", () => {
  assert.equal(openingShare(120, 1000), 0);
  assert.equal(openingShare(-5000, 1000), 1);
  assert.equal(openingShare(-0.4, 1000), 0.0004);
});

test("error: no height or no number gives no movement; the styles need the script and spare reduced motion", async () => {
  assert.equal(openingShare(-200, 0), 0);
  assert.equal(openingShare(Number.NaN, 1000), 0);
  assert.equal(openingShare(-200, "1000"), 0);
  const css = await readFile(new URL("../src/styles/hero.css", import.meta.url), "utf8");
  const moving = parseRules(css).filter((r) => r.declarations.some((d) => d.value.includes("var(--o, 0)")));
  assert.deepEqual(moving.map((r) => r.selector), ["html.js .hero--stacked .hero__copy", "html.js .hero--stacked .film"]);
  const script = await readFile(new URL("../assets/js/opening.js", import.meta.url), "utf8");
  assert.match(script, /prefers-reduced-motion: reduce\)"\)\.matches\) return;/);
});
