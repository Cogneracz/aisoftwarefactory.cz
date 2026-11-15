/** Helpers for the page tests: a page's built markup and simple readings of it. */
import { PAGES } from "../../src/pages/index.mjs";

export const built = (path) => {
  const found = PAGES.find((p) => p.path === path);
  if (!found) throw new Error(`No page at ${path}`);
  return found.render();
};

export const main = (html) => html.slice(html.indexOf("<main"), html.indexOf("</main>"));
export const plain = (html) => html.replace(/<script[\s\S]*?<\/script>/g, " ").replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
export const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
export const sectionIds = (html) => [...main(html).matchAll(/<section class="[^"]*" id="([^"]+)"/g)].map((m) => m[1]);
export const h1 = (html) => plain(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)?.[1] ?? "");
export const h2s = (html) => [...main(html).matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => plain(m[1]));
export const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
export const primaryButtons = (html) => [...html.matchAll(/<a class="button button--primary[^"]*" href="([^"]+)"><span>([^<]+)<\/span>/g)].map((m) => ({ href: m[1], label: m[2] }));
export const currentNav = (html) => [...html.matchAll(/<a[^>]*aria-current="page"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => plain(m[1]));
