/** Every page of the site: each page in each language, in the sitemap's order, then the one 404 page. */
import { DEFAULT_LOCALE, LOCALES, NOT_FOUND_PATH, PAGE_KEYS, fileOf, pathOf, withLocale } from "../i18n/index.mjs";
import { forgePage } from "./forge.mjs";
import { homePage } from "./home.mjs";
import { modulesPage } from "./modules.mjs";
import { notFoundPage } from "./not-found.mjs";
import { operatorPage } from "./operator.mjs";

const RENDER = { home: homePage, forge: forgePage, modules: modulesPage, operator: operatorPage };

export const PAGES = [
  ...LOCALES.flatMap((locale) =>
    PAGE_KEYS.map((key) => {
      const path = pathOf(key, locale);
      return { key, locale, path, file: fileOf(path), render: () => withLocale(locale, RENDER[key]) };
    }),
  ),
  { key: "not-found", locale: DEFAULT_LOCALE, path: NOT_FOUND_PATH, file: fileOf(NOT_FOUND_PATH), inSitemap: false, render: () => withLocale(DEFAULT_LOCALE, notFoundPage) },
];
