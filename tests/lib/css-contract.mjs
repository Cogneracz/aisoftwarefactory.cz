/**
 * The visual contract of the site's styles: sizes come from the named text styles, spacing from the spacing tokens,
 * radii from the radius tokens, timing from the motion tokens; backgrounds are flat; nothing is italic; no box has a
 * one-sided border. `violations(css)` returns one line per broken rule.
 */

/** Rules of a stylesheet as { selector, context, declarations }, comments removed; `context` is the chain of at-rules. */
export function parseRules(css) {
  const text = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [];
  const stack = [];
  let buffer = "";
  for (const ch of text) {
    if (ch === "{") {
      stack.push({ head: buffer.trim(), body: "" });
      buffer = "";
    } else if (ch === "}") {
      const block = stack.pop();
      if (!block) throw new Error("css-contract: unbalanced braces");
      const body = `${block.body}${buffer}`.trim();
      buffer = "";
      if (!block.head.startsWith("@") || block.head.startsWith("@font-face")) {
        const declarations = body
          .split(";")
          .map((d) => d.trim())
          .filter(Boolean)
          .map((d) => ({ prop: d.slice(0, d.indexOf(":")).trim().toLowerCase(), value: d.slice(d.indexOf(":") + 1).trim() }));
        rules.push({ selector: block.head.replace(/\s+/g, " "), context: stack.map((s) => s.head), declarations });
      }
    } else if (ch === ";" && stack.length > 0) {
      stack[stack.length - 1].body += `${buffer};`;
      buffer = "";
    } else {
      buffer += ch;
    }
  }
  if (stack.length > 0) throw new Error("css-contract: unbalanced braces");
  return rules;
}

/** Splits a value at top-level spaces and commas, keeping function calls whole. */
export function tokens(value) {
  const out = [];
  let depth = 0;
  let current = "";
  for (const ch of value) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth -= 1;
    if ((ch === " " || ch === "," || ch === "\n") && depth === 0) {
      if (current) out.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current) out.push(current);
  return out;
}

const SPACING_PROP = /^(margin|padding|gap|row-gap|column-gap|inset|top|right|bottom|left|scroll-margin|scroll-padding)(-|$)/;
const SPACING_VALUE = /^(0|auto|inherit|-?\d+(\.\d+)?%|var\(--spacing-\d+\)|calc\(-1 \* var\(--spacing-\d+\)\)|env\([a-z-]+\))$/;
const TEXT_STYLE = /^var\(--(display|ghost|heading|title|body|button|caption)-[a-z0-9]+\)$/;
const RADIUS_VALUE = /^(0|inherit|var\(--radius-[a-z0-9]+\))$/;
const ANIMATABLE = new Set(["transform", "opacity", "color", "background-color", "border-color", "text-decoration-color", "visibility"]);
const DEFAULT_CURVE = /(^|[\s,])(ease|linear|ease-in|ease-out|ease-in-out)(?=[\s,]|$)/;
const RAW_TIME = /(^|[\s,(])(?!0s\b)\d*\.?\d+m?s\b/;
const COLOUR_LITERAL = /#[0-9a-f]{3,8}\b|\b(rgb|rgba|hsl|hsla)\(/i;
const ONE_SIDED_BORDER = /^border-(top|right|bottom|left|block-start|block-end|inline-start|inline-end)(-|$)/;

/** Broken rules of one stylesheet. `tokensFile` is true for the file that defines the tokens. */
export function violations(css, { file = "styles", tokensFile = false } = {}) {
  const found = [];
  for (const rule of parseRules(css)) {
    if (rule.selector.startsWith("@font-face")) continue;
    const inKeyframes = rule.context.some((c) => c.startsWith("@keyframes"));
    for (const { prop, value } of rule.declarations) {
      const where = `${file}: ${rule.selector} { ${prop}: ${value} }`;
      if (prop.startsWith("--")) {
        if (!tokensFile) found.push(`${where}: custom properties are defined in the tokens file only`);
        continue;
      }
      if (inKeyframes && !ANIMATABLE.has(prop)) found.push(`${where}: keyframes may change only transform and opacity`);
      if (SPACING_PROP.test(prop) && !tokens(value).every((v) => SPACING_VALUE.test(v))) found.push(`${where}: spacing must be a spacing token`);
      if (["font-size", "line-height", "font-weight", "font-family"].includes(prop)) found.push(`${where}: use a named text style (font: var(--...))`);
      if (prop === "font" && !TEXT_STYLE.test(value)) found.push(`${where}: font must be a named text style`);
      if (prop === "font-style" && /italic|oblique/.test(value)) found.push(`${where}: no italic type`);
      if (prop === "border-radius" && !tokens(value).every((v) => RADIUS_VALUE.test(v))) found.push(`${where}: radius must be a radius token`);
      if (ONE_SIDED_BORDER.test(prop)) found.push(`${where}: borders go all the way around or not at all`);
      // A gradient may fade a picture's edge as a mask; as a background only the hero heading's text carries one.
      if (/gradient\(/.test(value) && !/^(-webkit-)?mask-image$/.test(prop) && !rule.selector.includes(".hero__title")) found.push(`${where}: backgrounds are flat (the hero heading's text gradient is the only one)`);
      if (!tokensFile && COLOUR_LITERAL.test(value)) found.push(`${where}: colours come from tokens`);
      if (prop === "transition" || prop === "animation") {
        if (value === "none") continue;
        if (DEFAULT_CURVE.test(value)) found.push(`${where}: no browser default curve`);
        if (RAW_TIME.test(value)) found.push(`${where}: durations come from the motion tokens`);
        if (!value.includes("var(--ease)")) found.push(`${where}: use the base curve`);
        if (prop === "transition") {
          // The accordion's opening height is the one size that may animate (faq.css, ::details-content only).
          const allowed = rule.selector.includes("::details-content") ? new Set([...ANIMATABLE, "block-size", "content-visibility"]) : ANIMATABLE;
          for (const part of value.split(/,(?![^(]*\))/)) {
            const name = part.trim().split(/\s+/)[0];
            if (!allowed.has(name)) found.push(`${where}: only transform, opacity and colours may transition (got ${name})`);
          }
        }
      }
      if (["transition-duration", "animation-duration", "transition-delay", "animation-delay"].includes(prop) && RAW_TIME.test(value)) found.push(`${where}: durations come from the motion tokens`);
      if (["transition-timing-function", "animation-timing-function"].includes(prop) && value !== "var(--ease)") found.push(`${where}: use the base curve`);
    }
  }
  return found;
}

/** Tailwind's type scale: size in rem with its line height. */
const SCALE = { "0.75rem": "1rem", "0.875rem": "1.25rem", "1rem": "1.5rem", "1.125rem": "1.75rem", "1.25rem": "1.75rem", "1.5rem": "2rem", "1.875rem": "2.25rem", "2.25rem": "2.5rem", "3rem": "1", "3.75rem": "1", "4.5rem": "1", "6rem": "1", "8rem": "1" };
const SPACING_SCALE = { 0: "0", 25: "2px", 50: "4px", 75: "8px", 100: "12px", 200: "16px", 300: "24px", 400: "32px", 500: "40px", 600: "48px", 700: "64px", 800: "80px", 900: "96px" };

/** Broken token definitions: a text style off the type scale or heavier than bold, a spacing token off the table. */
export function tokenViolations(css) {
  const found = [];
  const root = parseRules(css).find((r) => r.selector === ":root");
  if (!root) return ["tokens: no :root rule"];
  for (const { prop, value } of root.declarations) {
    const style = /^--(heading|title|body|button|caption)-/.test(prop);
    if (style) {
      const m = /^(\d{3}) ([\d.]+rem)\/([\d.]+(?:rem)?) var\(--font\)$/.exec(value);
      if (!m) found.push(`${prop}: ${value}: not "weight size/line-height var(--font)"`);
      else {
        if (Number(m[1]) > 700) found.push(`${prop}: weight ${m[1]} is heavier than bold`);
        if (SCALE[m[2]] !== m[3]) found.push(`${prop}: ${m[2]}/${m[3]} is not a step of the type scale`);
      }
    }
    const spacing = /^--spacing-(\d+)$/.exec(prop);
    if (spacing && SPACING_SCALE[spacing[1]] !== value) found.push(`${prop}: ${value} is not in the spacing table`);
  }
  for (const key of Object.keys(SPACING_SCALE)) if (!root.declarations.some((d) => d.prop === `--spacing-${key}`)) found.push(`--spacing-${key} is missing`);
  return found;
}
