import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { coverShare, deckFits, driftShare } from "../assets/js/stack.js";
import { parseRules } from "./lib/css-contract.mjs";

test("expected: a card is covered by the share of it the next card has slid over, and drifts until it reaches its place", () => {
  // Both stick 96 px from the top; the next card arrives from below and slides over.
  assert.equal(coverShare(96, 400, 900), 0);
  assert.equal(coverShare(96, 400, 496), 0);
  assert.equal(coverShare(96, 400, 296), 0.5);
  assert.equal(coverShare(96, 400, 112), 0.96);
  // A card entering at the bottom of a 900 px viewport is a whole drift away; at its place it has none.
  assert.equal(driftShare(900, 96, 900), 1);
  assert.equal(driftShare(498, 96, 900), 0.5);
  assert.equal(driftShare(96, 96, 900), 0);
  assert.equal(deckFits([420, 430, 410, 425], 96, 900), true);
});

test("edge: the shares stay within 0 and 1; a deck that would not fit the screen does not stack; one card is no deck", () => {
  assert.equal(coverShare(96, 400, 0), 1);
  assert.equal(coverShare(96, 400, 5000), 0);
  assert.equal(driftShare(5000, 96, 900), 1);
  assert.equal(driftShare(-300, 96, 900), 0);
  // 700 px of card, three edges of 16 px, the bar's 96 px and one more step: 860 px needed.
  assert.equal(deckFits([700, 650, 600, 640], 96, 860), true);
  assert.equal(deckFits([700, 650, 600, 640], 96, 859), false);
  assert.equal(deckFits([400], 96, 900), false);
});

test("error: values that are no numbers give no cover, no drift and no deck", () => {
  assert.equal(coverShare(Number.NaN, 400, 100), 0);
  assert.equal(coverShare(96, 0, 100), 0);
  assert.equal(coverShare(96, 400, undefined), 0);
  assert.equal(driftShare(500, 900, 900), 0);
  assert.equal(driftShare("500", 96, 900), 0);
  assert.equal(deckFits("cards", 96, 900), false);
  assert.equal(deckFits([400, 0], 96, 900), false);
  assert.equal(deckFits([400, Number.NaN], 96, 900), false);
});

test("expected: the deck's styles need the script's class, stick the cards at one place and move only transform and opacity", async () => {
  const css = await readFile(new URL("../src/styles/reference-showcase.css", import.meta.url), "utf8");
  const deck = parseRules(css).filter((r) => r.selector.includes(".is-stack"));
  assert.ok(deck.length >= 4);
  assert.ok(deck.every((r) => r.selector.split(", ").every((s) => s.startsWith("html.js .refs.is-stack"))), "no stacking without the script");
  const item = deck.find((r) => r.selector === "html.js .refs.is-stack .ref-item");
  const value = (prop) => item.declarations.find((d) => d.prop === prop)?.value;
  assert.equal(value("position"), "sticky");
  assert.equal(value("top"), "var(--spacing-900)");
  assert.ok(value("transform").includes("var(--n, 0)") && value("transform").includes("var(--cover, 0)"));
  // A covered card pales under a veil; the card itself is never see-through (it covers the cards under it).
  assert.equal(value("opacity"), undefined);
  const veil = deck.find((r) => r.selector === "html.js .refs.is-stack .ref::after");
  assert.ok(veil.declarations.find((d) => d.prop === "opacity").value.includes("var(--cover, 0)"));
  assert.equal(veil.declarations.find((d) => d.prop === "pointer-events").value, "none");
  // Nothing in the stylesheet stacks under reduced motion: the script never adds the class there.
  const script = await readFile(new URL("../assets/js/stack.js", import.meta.url), "utf8");
  assert.match(script, /prefers-reduced-motion: reduce\)"\)\.matches\) return;/);
});
