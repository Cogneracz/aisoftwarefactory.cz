import assert from "node:assert/strict";
import { test } from "node:test";
import { render } from "../build.mjs";
import { languageLinks, siteNav } from "../src/components/site-nav.mjs";
import { CONTENT, content } from "../src/content/index.mjs";
import { DEFAULT_LOCALE, LOCALES, NOT_FOUND_PATH, PAGE_KEYS, ROUTES, alternates, currentLocale, fileOf, pathOf, routeOf, withLocale } from "../src/i18n/index.mjs";
import { alternateLinks } from "../src/layout.mjs";
import { PAGES } from "../src/pages/index.mjs";
import { built, h1, hrefs, main, plain, primaryButtons } from "./lib/pages.mjs";

test("expected: every page has an address in every language, Czech at the root", () => {
  assert.deepEqual(LOCALES, ["cs", "en"]);
  assert.equal(DEFAULT_LOCALE, "cs");
  assert.deepEqual(PAGE_KEYS, ["home", "forge", "modules", "operator"]);
  assert.equal(pathOf("modules", "cs"), "/moduly/");
  assert.equal(pathOf("modules", "en"), "/en/modules/");
  assert.deepEqual(routeOf("/en/forge/"), { key: "forge", locale: "en" });
  assert.deepEqual(alternates("operator"), [{ locale: "cs", path: "/provozovatel/" }, { locale: "en", path: "/en/operator/" }]);
  assert.equal(fileOf("/"), "index.html");
  assert.equal(fileOf("/en/modules/"), "en/modules/index.html");
  assert.equal(fileOf("/404.html"), "404.html");
  const paths = Object.values(ROUTES).flatMap((r) => Object.values(r));
  assert.equal(new Set(paths).size, paths.length, "no two pages share an address");
  for (const key of PAGE_KEYS) assert.ok(ROUTES[key].en.startsWith("/en/") && !ROUTES[key].cs.startsWith("/en/"), key);
});

test("expected: a render runs in its language and the previous one comes back", () => {
  assert.equal(currentLocale(), "cs");
  const seen = withLocale("en", () => [currentLocale(), pathOf("forge"), content().action.label, withLocale("cs", () => currentLocale()), currentLocale()]);
  assert.deepEqual(seen, ["en", "/en/forge/", "Book a demo", "cs", "en"]);
  assert.equal(currentLocale(), "cs");
});

test("edge: the language is restored when a render throws; an address that is no page has no route", () => {
  assert.throws(() => withLocale("en", () => { throw new Error("boom"); }), /boom/);
  assert.equal(currentLocale(), "cs");
  assert.equal(routeOf("/en/nothing/"), undefined);
  assert.equal(routeOf(NOT_FOUND_PATH), undefined);
  assert.equal(alternateLinks(NOT_FOUND_PATH), "");
});

test("error: an unknown language, page or address throws", () => {
  assert.throws(() => withLocale("de", () => 1), /Unknown language: "de"/);
  assert.throws(() => pathOf("forge", "de"), /Unknown language/);
  assert.throws(() => pathOf("pricing", "en"), /Unknown page: "pricing"/);
  assert.throws(() => content("de"), /Unknown language/);
  assert.throws(() => fileOf("forge/"), /Not a page address/);
  assert.throws(() => siteNav({ current: "/en/nothing/" }), /Unknown page path/);
});

/** The shape of a content value: keys and lengths, and the values of keys that must be the same in every language. */
const SAME = new Set(["slug", "screen", "film", "mark", "page"]);
function shape(value, key = "") {
  if (typeof value === "function") return "function";
  if (Array.isArray(value)) return value.map((v) => shape(v, key));
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((k) => [k, shape(value[k], k)]));
  return SAME.has(key) ? value : typeof value;
}

test("expected: English has the shape of Czech: the same keys, lists of the same length, the same slugs, screens and films", () => {
  const { notFound, ...czech } = CONTENT.cs;
  assert.ok(notFound, "the one 404 page is Czech with a line of English");
  assert.deepEqual(shape(CONTENT.en), shape(czech));
  assert.equal(CONTENT.en.faq.length, 9);
  assert.equal(CONTENT.en.modulesPage.moreLabel("Rivet"), "More about the Rivet module on cognera.cz");
});

test("expected: every page names its language versions, and the bar leads to the same page in the other language", () => {
  for (const key of PAGE_KEYS) {
    for (const locale of LOCALES) {
      const path = pathOf(key, locale);
      const html = built(path);
      const other = locale === "cs" ? "en" : "cs";
      assert.ok(html.includes(`<html lang="${locale}">`), path);
      assert.ok(html.includes(`<link rel="alternate" hreflang="cs" href="https://aisoftwarefactory.cz${pathOf(key, "cs")}">`), path);
      assert.ok(html.includes(`<link rel="alternate" hreflang="en" href="https://aisoftwarefactory.cz${pathOf(key, "en")}">`), path);
      assert.ok(html.includes(`<link rel="alternate" hreflang="x-default" href="https://aisoftwarefactory.cz${pathOf(key, "cs")}">`), path);
      assert.ok(html.includes(`<link rel="canonical" href="https://aisoftwarefactory.cz${path}">`), path);
      const label = content(other).ui.language;
      assert.ok(html.includes(`<a class="site-nav__link site-nav__lang" href="${pathOf(key, other)}" hreflang="${other}" lang="${other}" aria-label="${label.switchLabel}">${label.short}</a>`), `${path} -> ${other}`);
    }
  }
  assert.deepEqual(withLocale("en", () => languageLinks("/en/modules/")).map((l) => [l.locale, l.href, l.short]), [["cs", "/moduly/", "CS"]]);
});

test("expected: the English pages are English throughout", () => {
  const home = built("/en/");
  assert.equal(h1(home), "From an idea to a working app.");
  assert.ok(home.includes("<title>AI software factory | Forge by Cognera</title>"));
  assert.ok(home.includes('<meta property="og:locale" content="en_US">') && home.includes('<meta property="og:locale:alternate" content="cs_CZ">'));
  assert.ok(home.includes('content="https://aisoftwarefactory.cz/assets/og-en.png"'));
  assert.ok(home.includes('<a class="skip-link" href="#obsah">Skip to content</a>'));
  assert.ok(primaryButtons(home).every((b) => b.label.replace(/&nbsp;/g, " ") === "Book a demo" && b.href === "https://cognera.cz/en#contact-form"));
  // The home page tells the line as a story (no scroll scene); the assembly scene opens the modules page.
  assert.ok(home.includes('data-story="bellows,anvil,forge,temper,rivet,harness"') && !home.includes('data-scene="'));
  assert.ok(built("/en/modules/").includes('<section class="scene" id="skladani" aria-label="Modules" data-scene="assembly">'));
  const text = plain(main(home));
  for (const part of ["Five steps. Five decisions.", "You decide what gets merged.", "A factory we work in ourselves.", "Show us your backlog."]) assert.ok(text.includes(part), part);
  assert.equal(/[ěščřžůďťň]/i.test(text), false, "no Czech sentence on the English home page");
  const links = hrefs(home);
  for (const href of ["/en/forge/", "/en/modules/", "/en/operator/", "/en/modules/#rivet", "https://cognera.cz/en/references", "https://cognera.cz/en/privacy"]) assert.ok(links.includes(href), href);
  assert.equal(links.some((h) => h === "/forge/" || h === "/moduly/#rivet"), false, "an English page links English pages");
  assert.ok(built("/en/modules/").includes("https://cognera.cz/en/products/rivet"));
  assert.ok(plain(built("/en/operator/")).includes("company ID (IČO) 23743514"));
  assert.equal(h1(built("/en/forge/")), "You approve the plan. Forge writes the code.");
});

test("edge: the one 404 page is Czech, offers English and belongs to no language pair", async () => {
  const html = built(NOT_FOUND_PATH);
  assert.ok(html.includes('<html lang="cs">'));
  assert.ok(html.includes('<p lang="en">This page is not here. Continue to the <a class="link" href="/en/">English home page</a>.</p>'));
  assert.equal(html.includes('<link rel="alternate"'), false);
  assert.ok(html.includes('<a class="site-nav__link site-nav__lang" href="/en/" hreflang="en" lang="en"'));
  const sitemap = (await render()).get("sitemap.xml");
  assert.equal((sitemap.match(/<url>/g) ?? []).length, 8);
  assert.equal((sitemap.match(/<xhtml:link rel="alternate" hreflang="en"/g) ?? []).length, 8);
  assert.ok(sitemap.includes('<url><loc>https://aisoftwarefactory.cz/en/modules/</loc><xhtml:link rel="alternate" hreflang="cs" href="https://aisoftwarefactory.cz/moduly/"/><xhtml:link rel="alternate" hreflang="en" href="https://aisoftwarefactory.cz/en/modules/"/></url>'));
  assert.equal(PAGES.filter((p) => p.locale === "en").length, 4);
});
