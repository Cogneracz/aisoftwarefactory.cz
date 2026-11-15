/**
 * A module of Forge as a card among the five: a single link to the module's chapter of the story (module-story.mjs) on
 * the modules page, or to that page from elsewhere.
 */
import { cls, need, t } from "../lib/html.mjs";
import { MODULE_ORDER } from "../content/modules.mjs";
import { pathOf } from "../i18n/index.mjs";
import { object3d } from "./object3d.mjs";

/** The modules in the family's order; throws for Forge, an unknown, a repeated or a missing module. */
export function inModuleOrder(modules) {
  if (!Array.isArray(modules)) throw new Error("A list of modules is required");
  const seen = new Set();
  for (const m of modules) {
    if (m?.slug === "forge") throw new Error("Forge is the core, not a module");
    if (!MODULE_ORDER.includes(m?.slug)) throw new Error(`Not a module of Forge: ${JSON.stringify(m?.slug)}`);
    if (seen.has(m.slug)) throw new Error(`Listed twice: ${m.name ?? m.slug}`);
    seen.add(m.slug);
  }
  const missing = MODULE_ORDER.filter((slug) => !seen.has(slug));
  if (missing.length > 0) throw new Error(`Missing modules: ${missing.join(", ")}`);
  return [...modules].sort((a, b) => MODULE_ORDER.indexOf(a.slug) - MODULE_ORDER.indexOf(b.slug));
}

export const moduleHref = (slug, { onPage = false } = {}) => (onPage ? `#${slug}` : `${pathOf("modules")}#${slug}`);

/** A card: one link with the module's 3D object, its role, its name and one line. */
export function moduleCard(module, { onPage = false } = {}) {
  for (const key of ["slug", "name", "role", "line"]) need(module?.[key], `A module's ${key}`);
  return `<li class="${cls("module-card-item", !onPage && "reveal")}"><a class="module-card" href="${moduleHref(module.slug, { onPage })}">${object3d(module.slug, { className: "module-card__object", eager: onPage })}<span class="module-card__role">${t(module.role)}</span><span class="module-card__name">${t(module.name)}</span><span class="module-card__line">${t(module.line)}</span></a></li>`;
}

/** The five cards in the family's order. */
export function moduleGrid(modules, { onPage = false, label } = {}) {
  const cards = inModuleOrder(modules).map((m) => moduleCard(m, { onPage })).join("");
  return `<ul class="module-grid"${label ? ` aria-label="${t(label)}"` : ""}>${cards}</ul>`;
}
