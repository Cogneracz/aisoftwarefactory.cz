import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { ROOT, STYLES } from "../build.mjs";
import { parseRules, tokenViolations, tokens, violations } from "./lib/css-contract.mjs";

test("expected: rules built from tokens pass the contract", () => {
  const css = `
    .card { padding: var(--spacing-300) var(--spacing-400); border-radius: var(--radius-2xl); font: var(--body-3); border: 1px solid var(--line); }
    .card { transition: transform var(--dur-move) var(--ease), opacity var(--dur-fade) var(--ease); }
    @media (min-width: 768px) { .card { gap: var(--spacing-200); } }
    @keyframes rise { from { opacity: 0; transform: translateY(var(--spacing-300)); } }
  `;
  assert.deepEqual(violations(css), []);
});

test("edge: zero, auto, percentages, negative tokens, env() and the hero heading's gradient are allowed", () => {
  const css = `
    .a { margin: 0 auto; top: 50%; inset: calc(-1 * var(--spacing-50)); padding-bottom: env(safe-area-inset-bottom); border-radius: inherit; }
    .hero__title { background-image: linear-gradient(90deg, var(--hero-from), var(--hero-to)); }
    .scene__canvas { mask-image: linear-gradient(to bottom, black calc(100% - var(--spacing-600)), transparent); }
    .b { animation: none; transition: visibility 0s var(--ease) var(--dur-fade); }
  `;
  assert.deepEqual(violations(css), []);
  assert.deepEqual(tokens("var(--spacing-75) calc(-1 * var(--spacing-50)), 0"), ["var(--spacing-75)", "calc(-1 * var(--spacing-50))", "0"]);
});

test("error: off-scale sizes, raw spacing, gradients, default curves, one-sided borders, literals and italics are refused", () => {
  const cases = {
    ".a { font-size: 19px; }": /named text style/,
    ".a { font: 600 22px/1.2 sans-serif; }": /named text style/,
    ".a { margin-top: 18px; }": /spacing token/,
    ".a { gap: 1rem; }": /spacing token/,
    ".a { border-radius: 10px; }": /radius token/,
    ".a { background: linear-gradient(#fff, #eee); }": /backgrounds are flat/,
    ".a { transition: all 0.2s ease; }": /default curve/,
    ".a { transition: width var(--dur-move) var(--ease); }": /only transform, opacity and colours/,
    ".a { transition: opacity 250ms var(--ease); }": /motion tokens/,
    ".a { border-left: 2px solid var(--ink); }": /all the way around/,
    ".a { color: #ff0000; }": /colours come from tokens/,
    ".a { font-style: italic; }": /no italic/,
    "@keyframes x { from { height: 0; } }": /only transform and opacity/,
    ".a { --local: 4px; }": /tokens file only/,
  };
  for (const [css, message] of Object.entries(cases)) {
    const found = violations(css);
    assert.ok(found.some((line) => message.test(line)), `${css} should be refused (${message}); got ${JSON.stringify(found)}`);
  }
  assert.throws(() => parseRules(".a { color: red;"), /unbalanced/);
});

test("expected: the token file defines the type scale and the spacing table", async () => {
  const css = await readFile(new URL("../src/styles/tokens.css", import.meta.url), "utf8");
  assert.deepEqual(tokenViolations(css), []);
  assert.deepEqual(violations(css, { file: "tokens.css", tokensFile: true }), []);
});

test("error: a token off the scale, too heavy or off the spacing table is reported", () => {
  const css = ":root { --heading-1: 900 3.75rem/1 var(--font); --body-3: 400 1.05rem/1.5rem var(--font); --spacing-0: 0; --spacing-300: 20px; }";
  const found = tokenViolations(css);
  assert.ok(found.some((line) => /heavier than bold/.test(line)));
  assert.ok(found.some((line) => /not a step of the type scale/.test(line)));
  assert.ok(found.some((line) => /--spacing-300: 20px/.test(line)));
  assert.ok(found.some((line) => /--spacing-900 is missing/.test(line)));
});

test("expected: every stylesheet of the site keeps the contract", async () => {
  for (const name of STYLES.filter((n) => n !== "tokens.css")) {
    const css = await readFile(`${ROOT}/src/styles/${name}`, "utf8");
    assert.deepEqual(violations(css, { file: name }), [], name);
  }
});
