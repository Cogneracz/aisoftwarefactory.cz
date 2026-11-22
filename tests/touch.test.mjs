import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { parseRules } from "./lib/css-contract.mjs";

const css = async (file) => parseRules(await readFile(new URL(`../src/styles/${file}`, import.meta.url), "utf8"));
const value = (rule, prop) => rule?.declarations.find((d) => d.prop === prop)?.value;
const inMedia = (rules, selector, media) => rules.find((r) => r.selector === selector && r.context.some((c) => c.includes(media)));

test("expected: on touch screens links, the brands and the footer's links are 44 px tall targets", async () => {
  const base = await css("base.css");
  const link = inMedia(base, ".link::after", "pointer: coarse");
  assert.equal(value(link, "inset"), "calc(-1 * var(--spacing-100)) calc(-1 * var(--spacing-50))");
  assert.equal(value(inMedia(base, ".link", "pointer: coarse"), "position"), "relative");
  const nav = await css("site-nav.css");
  assert.equal(value(inMedia(nav, ".site-nav__brand::after", "pointer: coarse"), "inset"), "calc(-1 * var(--spacing-50))");
  const footer = await css("site-footer.css");
  assert.equal(value(inMedia(footer, ".site-footer__link", "pointer: coarse"), "padding-block"), "var(--spacing-100)");
  assert.equal(value(inMedia(footer, ".site-footer__col ul", "pointer: coarse"), "gap"), "var(--spacing-0)");
  // The skip link is 44 px tall for every pointer: 20 px of text and 12 px above and below.
  assert.equal(value(base.find((r) => r.selector === ".skip-link" && r.context.length === 0), "padding"), "var(--spacing-100) var(--spacing-200)");
});

test("edge: phones get 14 px labels where 12 px was used; wider screens keep the smaller style", async () => {
  const pairs = [
    ["base.css", ".tag", "var(--caption-1)"],
    ["reference-showcase.css", ".ref__built", "var(--caption-1)"],
    ["step-sequence.css", ".step__number", "var(--caption-1)"],
  ];
  for (const [file, selector, font] of pairs) {
    const rules = await css(file);
    assert.equal(value(inMedia(rules, selector, "max-width: 767px"), "font"), font, `${file} ${selector}`);
    assert.match(value(rules.find((r) => r.selector === selector && r.context.length === 0), "font"), /caption-[345]/, `${selector} keeps its smaller style above phones`);
  }
  const mark = (await css("module-story.css")).find((r) => r.selector === "html.js .story.is-motion .story__mark" && !r.context.length);
  assert.equal(value(mark, "min-height"), "44px");
  assert.equal(value(mark, "font"), "var(--body-4)");
  // The scene's rail labels (12 px) are not shown on phones at all.
  const scene = await css("scroll-scene.css");
  assert.equal(value(inMedia(scene, ".scene__seg b", "max-width: 767px"), "display"), "none");
});

test("edge: six mobile chapter links reserve room for complete product words and a tap target", async () => {
  const rules = await css("module-story.css");
  const rail = rules.find((r) => r.selector === "html.js .story.is-motion .story__progress" && !r.context.length);
  const mark = rules.find((r) => r.selector === "html.js .story.is-motion .story__mark" && !r.context.length);
  assert.equal(value(rail, "grid-auto-columns"), "minmax(min-content, 1fr)");
  assert.equal(value(rail, "gap"), "var(--spacing-50)");
  assert.equal(value(mark, "overflow-wrap"), "normal");
  assert.equal(value(mark, "min-width"), "44px");
  assert.equal(value(mark, "min-height"), "44px");
});

test("error: no touch rule enlarges what people see; only invisible areas and padding change", async () => {
  for (const file of ["base.css", "site-nav.css", "site-footer.css"]) {
    for (const rule of (await css(file)).filter((r) => r.context.some((c) => c.includes("pointer: coarse")))) {
      for (const d of rule.declarations) assert.ok(["position", "content", "inset", "display", "padding-block", "gap"].includes(d.prop), `${file} ${rule.selector}: ${d.prop}`);
      if (rule.selector.endsWith("::after")) assert.equal(value(rule, "content"), '""');
    }
  }
});
