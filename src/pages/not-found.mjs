/**
 * The page GitHub Pages serves for any unknown address, in every language's part of the site: the same site, the
 * ways back, and a line in the other language.
 */
import { hero } from "../components/hero.mjs";
import { rich } from "../components/rich.mjs";
import { content } from "../content/index.mjs";
import { DEFAULT_LOCALE, NOT_FOUND_PATH } from "../i18n/index.mjs";
import { page } from "../layout.mjs";

export function notFoundPage() {
  const { notFound } = content(DEFAULT_LOCALE);
  return page({
    path: NOT_FOUND_PATH,
    meta: notFound.meta,
    noindex: true,
    body: [
      hero({ layout: "plain", eyebrow: notFound.eyebrow, title: notFound.title, lead: notFound.lead, action: { ...notFound.action, variant: "secondary" } }),
      `<div class="container not-found-other"><p lang="${notFound.other.lang}">${rich(notFound.other.text)}</p></div>`,
    ].join("\n"),
  });
}
