/**
 * The opening of a page: an optional caption with a product mark, the page's only `h1` in authored lines, a lead,
 * one action, one proof line and one picture: a 3D film or a real screen. Layouts: "split" (copy beside the picture),
 * "stacked" (copy above it) and "plain" (copy only, the action optional).
 */
import { cls, need, t } from "../lib/html.mjs";
import { film as filmFigure } from "./film.mjs";
import { icon } from "./icons.mjs";
import { productMark } from "./product-mark.mjs";
import { button, rich } from "./rich.mjs";
import { screenFrame } from "./screen-frame.mjs";

const LAYOUTS = ["split", "stacked", "plain"];

export function hero({ layout = "split", eyebrow, mark, tag, title, lead, action, proof, screen, film }) {
  if (!LAYOUTS.includes(layout)) throw new Error(`Unknown hero layout: ${JSON.stringify(layout)}`);
  if (!Array.isArray(title) || title.length === 0 || title.some((line) => typeof line !== "string" || line.trim() === "")) throw new Error("A hero needs a title of one or more lines");
  if (layout !== "plain" && !action) throw new Error("A hero with a picture needs its action");
  if (screen && film) throw new Error("A hero shows a film or a screen, not both");
  if (layout !== "plain" && !screen && !film) throw new Error("A split or stacked hero needs a film or a screen");
  if (layout === "plain" && (screen || film)) throw new Error("A plain hero has no picture");

  // Reveal order with shrinking gaps (emilkowalski/skills choreograph: no uniform stagger); the eyebrow rides with the
  // title as one beat.
  const delays = eyebrow ? [0, 0, 1.4, 2.4, 3] : [0, 1.4, 2.4, 3];
  let i = 0;
  const step = () => `style="--i:${delays[Math.min(i++, delays.length - 1)]}"`;
  const parts = [];
  if (eyebrow) {
    parts.push(`<p class="hero__eyebrow" ${step()}>${mark ? productMark(mark) : ""}<span>${t(need(eyebrow, "A hero's caption"))}</span>${tag ? `<span class="tag">${t(tag)}</span>` : ""}</p>`);
  }
  parts.push(`<h1 class="hero__title" ${step()}>${title.map((line) => `<span class="hero__line">${t(line)}</span>`).join(" ")}</h1>`);
  if (lead) parts.push(`<p class="hero__lead" ${step()}>${rich(lead)}</p>`);
  if (action) parts.push(`<div class="hero__actions" ${step()}>${button(action, { variant: action.variant ?? "primary", size: "lg" })}</div>`);
  if (proof) parts.push(`<p class="hero__proof" ${step()}>${icon("check", { size: 16 })}<span>${t(proof)}</span></p>`);

  return `<section class="${cls("hero", `hero--${layout}`)}">
<div class="container hero__grid">
<div class="hero__copy">${parts.join("")}</div>
${film ? `<div class="hero__media">${filmFigure(film, { cut: layout === "split" ? "small" : "auto", eager: true })}</div>` : ""}${screen ? `<div class="hero__media">${screenFrame(screen, { eager: true })}</div>` : ""}
</div>
</section>`;
}
