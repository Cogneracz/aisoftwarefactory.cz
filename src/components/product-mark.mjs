/**
 * The marks of Forge and its modules as inline SVG, the same marks as on cognera.cz: three stacked diamonds for Forge,
 * Temper and Anvil; a rivet, bellows and three plates for the others.
 */
import { attrs } from "../lib/html.mjs";

export const MARK_SLUGS = ["forge", "bellows", "anvil", "temper", "rivet", "harness"];

const TILE = { fill: "#ffffff", stroke: "rgba(0,0,0,0.1)" };

/** Diamond layers, back to front. */
const LAYER_COLOURS = {
  forge: ["#9a3412", "#ea580c", "#f59e0b"],
  temper: ["#155e75", "#0e7490", "#22d3ee"],
  anvil: ["#1c1917", "#44403c", "#a8a29e"],
};

/** Stroke colours: primary, secondary, tertiary. */
const LINE_COLOURS = {
  rivet: ["#d97706", "#1d1d1f"],
  bellows: ["#d97706", "#1d1d1f"],
  harness: ["#1d1d1f", "#86868b", "#d97706"],
};

const DIAMOND_LAYERS = [
  { size: 240, rx: 30 },
  { size: 200, rx: 25 },
  { size: 156, rx: 20 },
];

/** Where each product's diamonds sit: Forge steps up to the right, Temper mirrors it, Anvil stacks them level. */
const DIAMONDS = {
  forge: { group: "translate(286 226)", layers: ["rotate(45) translate(0 50)", "rotate(45)", "rotate(45) translate(0 -50)"] },
  temper: { group: "translate(226 286)", layers: ["rotate(45) translate(0 -50)", "rotate(45)", "rotate(45) translate(0 50)"] },
  anvil: { group: "translate(256 229)", layers: ["translate(0 56) rotate(45)", "rotate(45)", "translate(0 -56) rotate(45)"] },
};

const tile = (size, rx) => {
  const inset = size / 128;
  return `<rect x="${inset}" y="${inset}" width="${size - inset * 2}" height="${size - inset * 2}" rx="${rx}" fill="${TILE.fill}" stroke="${TILE.stroke}" stroke-width="${inset * 2}"/>`;
};

function strokes(slug) {
  const [a, b, c] = LINE_COLOURS[slug];
  if (slug === "rivet") {
    return `<path d="M17 23a15 15 0 0 1 30 0H17Z" fill="none" stroke="${a}" stroke-width="4" stroke-linejoin="round"/><path d="M27 25v23m10-23v23M22 48h20M13 35h38" fill="none" stroke="${a}" stroke-width="4" stroke-linecap="round"/><path d="M13 41h38" stroke="${b}" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (slug === "bellows") {
    return `<path d="M17 16L41 25V39L17 48M17 24L41 29M17 32H41M17 40L41 35M41 29H49V35H41" fill="none" stroke="${a}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M49 32H56" stroke="${b}" stroke-width="4" stroke-linecap="round"/>`;
  }
  return `<path d="M14 22l18-8 18 8-18 8z" fill="none" stroke="${a}" stroke-width="3.5" stroke-linejoin="round"/><path d="M14 32l18 8 18-8" fill="none" stroke="${b}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 42l18 8 18-8" fill="none" stroke="${c}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/**
 * A product's mark. `tile: false` leaves out the white tile; `label` names the mark for assistive technology when it
 * stands alone (otherwise it is decorative); `standalone` adds the XML namespace for a file of its own.
 */
export function productMark(slug, { tile: withTile = true, label, className = "mark", standalone = false } = {}) {
  if (!MARK_SLUGS.includes(slug)) throw new Error(`Unknown product mark: ${JSON.stringify(slug)}`);
  const a11y = label ? { role: "img", "aria-label": label } : { "aria-hidden": "true", focusable: "false" };
  const diamonds = DIAMONDS[slug];
  if (diamonds) {
    const layers = DIAMOND_LAYERS.map(
      (layer, i) => `<rect x="${-layer.size / 2}" y="${-layer.size / 2}" width="${layer.size}" height="${layer.size}" rx="${layer.rx}" transform="${diamonds.layers[i]}" fill="${LAYER_COLOURS[slug][i]}"/>`,
    ).join("");
    return `<svg${attrs({ xmlns: standalone ? "http://www.w3.org/2000/svg" : false, class: standalone ? false : className, viewBox: "0 0 512 512", ...a11y })}>${withTile ? tile(512, 112) : ""}<g transform="${diamonds.group}">${layers}</g></svg>`;
  }
  return `<svg${attrs({ xmlns: standalone ? "http://www.w3.org/2000/svg" : false, class: standalone ? false : className, viewBox: "0 0 64 64", ...a11y })}>${withTile ? tile(64, 14) : ""}${strokes(slug)}</svg>`;
}
