/**
 * Languages of the site: which exist, where each page lives in each of them, and which one a render is in.
 * Czech is the default and lives at the root; every other language lives under its own prefix.
 *
 * The current language is a module-level value set for the length of one page render (`withLocale`): rendering is
 * synchronous, so components can ask for it (`currentLocale`, and `content()` in ../content/index.mjs) without every
 * call passing it along.
 */
export const LOCALES = ["cs", "en"];
export const DEFAULT_LOCALE = "cs";

/** What each language is called in the Open Graph tags. */
export const OG_LOCALE = { cs: "cs_CZ", en: "en_US" };

/** Every page with a language version, and its address in each language. */
export const ROUTES = {
  home: { cs: "/", en: "/en/" },
  forge: { cs: "/forge/", en: "/en/forge/" },
  modules: { cs: "/moduly/", en: "/en/modules/" },
  operator: { cs: "/provozovatel/", en: "/en/operator/" },
};

export const PAGE_KEYS = Object.keys(ROUTES);

/** The one page without language versions: GitHub Pages serves a single 404 file. */
export const NOT_FOUND_PATH = "/404.html";

export function assertLocale(locale) {
  if (!LOCALES.includes(locale)) throw new Error(`Unknown language: ${JSON.stringify(locale)}`);
  return locale;
}

/** A page's address in a language; throws for an unknown page or language. */
export function pathOf(key, locale = currentLocale()) {
  assertLocale(locale);
  if (!Object.prototype.hasOwnProperty.call(ROUTES, key)) throw new Error(`Unknown page: ${JSON.stringify(key)}`);
  return ROUTES[key][locale];
}

/** The page and language an address belongs to, or undefined for an address that is no page. */
export function routeOf(path) {
  for (const key of PAGE_KEYS) for (const locale of LOCALES) if (ROUTES[key][locale] === path) return { key, locale };
  return undefined;
}

/** A page's address in every language, the default language first. */
export function alternates(key) {
  return LOCALES.map((locale) => ({ locale, path: pathOf(key, locale) }));
}

/** The file a page address is written to: "/" is index.html, "/en/forge/" is en/forge/index.html. */
export function fileOf(path) {
  if (typeof path !== "string" || !path.startsWith("/")) throw new Error(`Not a page address: ${JSON.stringify(path)}`);
  return path.endsWith("/") ? `${path.slice(1)}index.html` : path.slice(1);
}

let current = DEFAULT_LOCALE;

/** The language of the render in progress (the default language outside one). */
export const currentLocale = () => current;

/** Runs `fn` with `locale` as the current language and restores the previous one, also when `fn` throws. */
export function withLocale(locale, fn) {
  assertLocale(locale);
  const previous = current;
  current = locale;
  try {
    return fn();
  } finally {
    current = previous;
  }
}
