import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { ROOT, render } from "../build.mjs";
import { content } from "../src/content/index.mjs";
import { ALLOWED_EXTERNAL_HOSTS, SITE } from "../src/content/site.mjs";
import { PAGES } from "../src/pages/index.mjs";
import { ids, pageProblems, resourceUrls, scriptProblems } from "./lib/integrity.mjs";

async function walk(dir, base = "") {
  const out = [];
  for (const entry of await readdir(join(ROOT, dir), { withFileTypes: true })) {
    const rel = `${base}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await walk(join(dir, entry.name), rel)));
    else out.push(rel);
  }
  return out;
}

/** The only script that may fetch: the scene's frame player, and only from this site. */
// The scroll scene's frames and the story canvas's models and textures, both from this site only.
const FRAME_LOADERS = ["/assets/js/scrub-player.js", "/assets/js/story-canvas.js"];

const built = await render();
const onDisk = (await readdir(ROOT, { withFileTypes: true })).filter((entry) => entry.isFile()).map((entry) => `/${entry.name}`);
const files = new Set([...(await walk("assets", "/assets")), ...onDisk, ...[...built.keys()].map((k) => `/${k}`)]);
const html = new Map(PAGES.map((p) => [p.path, built.get(p.file)]));
const idsOf = new Map([...html].map(([path, page]) => [path, ids(page)]));
const context = (path, extra = {}) => ({ path, origin: SITE.origin, files, idsOf, allowedHosts: ALLOWED_EXTERNAL_HOSTS, ...extra });

test("expected: every built page meets the baseline and every link, anchor and picture resolves", () => {
  assert.equal(PAGES.length, 9);
  for (const p of PAGES) assert.deepEqual(pageProblems(html.get(p.path), context(p.path, { noindex: p.path === "/404.html", lang: p.locale })), [], p.path);
});

test("expected: titles are unique and every primary button is the site's one action", () => {
  const titles = [...html.values()].map((page) => /<title>([^<]+)<\/title>/.exec(page)[1]);
  assert.equal(new Set(titles).size, titles.length);
  for (const p of PAGES) {
    const primary = [...html.get(p.path).matchAll(/<a class="button button--primary[^"]*" href="([^"]+)"><span>([^<]+)<\/span>/g)];
    assert.ok(primary.length >= 1, p.path);
    // The one action of the page's language: its label and its form on cognera.cz.
    const { action } = content(p.locale);
    for (const [, href, label] of primary) assert.deepEqual({ href, label: label.replace(/&nbsp;/g, " ") }, { href: action.href, label: action.label }, p.path);
  }
});

test("expected: nothing is loaded from another origin and no script stores, sends or measures", async () => {
  for (const [path, page] of html) for (const url of resourceUrls(page)) assert.match(url, /^\/(?!\/)/, `${path}: ${url}`);
  const scripts = (await walk("assets/js", "/assets/js")).filter((f) => f.endsWith(".js"));
  assert.ok(scripts.includes("/assets/js/scenes/line-en.js"));
  for (const file of scripts) {
    assert.deepEqual(scriptProblems(await readFile(join(ROOT, file), "utf8"), file, { mayLoad: FRAME_LOADERS.includes(file) }), [], file);
  }
  const css = built.get("assets/site.css");
  assert.equal(/url\((?!["']?\/assets\/)/.test(css), false, "styles load only from /assets/");
  assert.equal(/@import/.test(css), false);
});

test("edge: the sitemap lists the four content pages in both languages, robots keeps crawlers out of the source", () => {
  const locs = [...built.get("sitemap.xml").matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
  assert.deepEqual(locs, [
    "https://aisoftwarefactory.cz/",
    "https://aisoftwarefactory.cz/forge/",
    "https://aisoftwarefactory.cz/moduly/",
    "https://aisoftwarefactory.cz/provozovatel/",
    "https://aisoftwarefactory.cz/en/",
    "https://aisoftwarefactory.cz/en/forge/",
    "https://aisoftwarefactory.cz/en/modules/",
    "https://aisoftwarefactory.cz/en/operator/",
  ]);
  const robots = built.get("robots.txt");
  assert.ok(robots.includes("Disallow: /src/") && robots.includes("Disallow: /tests/") && robots.includes("Sitemap: https://aisoftwarefactory.cz/sitemap.xml"));
  assert.ok(built.get("favicon.svg").startsWith('<svg xmlns="http://www.w3.org/2000/svg"'));
  for (const file of ["/apple-touch-icon.png", "/assets/og.png", "/assets/og-en.png", "/favicon.svg", "/.nojekyll", "/CNAME"]) assert.ok(files.has(file), file);
});

test("error: a third-party resource, a relative address, a dead anchor and an undescribed picture are reported", () => {
  const home = html.get("/");
  const cases = [
    [home.replace("</head>", '<script src="https://cdn.example.com/track.js"></script></head>'), /not root-relative: https:\/\/cdn\.example\.com|unexpected script/],
    [home.replace('href="/assets/site.css"', 'href="assets/site.css"'), /not root-relative: assets\/site\.css/],
    [home.replace('href="/moduly/#bellows"', 'href="/moduly/#nic"'), /anchor that does not exist: \/moduly\/#nic/],
    [home.replace('href="/forge/"', 'href="forge/"'), /neither root-relative nor https: forge\//],
    [home.replace('href="/forge/"', 'href="/kontakt/"'), /page that does not exist: \/kontakt\//],
    [home.replace(/alt="[^"]+" width="1920"/, 'alt="" width="1920"'), /picture without a description/],
    [home.replace("<main", '<figure data-film-large="https://cdn.example.com/ambient.mp4"></figure><main'), /not root-relative: https:\/\/cdn\.example\.com/],
    [home.replace('poster="/assets/media/film/forge-relay-poster.webp"', 'poster="https://cdn.example.com/poster.webp"'), /resource is not root-relative/],
    [home.replace('src="/assets/media/film/forge-relay-en.vtt"', 'src="/assets/missing.vtt"'), /resource is missing on disk/],
    [home.replace('src="/assets/media/film/forge-relay.mp4"', 'src="relative.mp4"'), /resource is not root-relative/],
    [home.replace('href="/assets/media/film/forge-relay.mp4" download', 'href="/assets/missing.mp4" download'), /download is missing on disk/],
    [home.replace("<main", "<h1>Druhý</h1><main"), /expected one h1, found 2/],
    [home.replace("<main", '<a href="https://example.com/">x</a><main'), /host that is not allowed/],
    [home.replace("<main", '<a href="/forge/" target="_blank">x</a><main'), /opens a new window/],
    [home.replace("<main", "<p>napiste@example.com</p><main"), /e-mail address in plain text/],
    [home.replace("<main", '<button onclick="x()">x</button><main'), /inline event handler/],
    [home.replace('<html lang="cs">', '<html lang="en">'), /lang="cs"/],
    [html.get("/en/"), /must declare lang="cs"/],
  ];
  for (const [page, message] of cases) {
    const found = pageProblems(page, context("/"));
    assert.ok(found.some((line) => message.test(line)), `${message} not reported; got ${JSON.stringify(found)}`);
  }
});

test("error: a script that sets a cookie, stores, sends or measures is reported", () => {
  assert.match(scriptProblems('document.cookie = "a=1";', "x.js").join(), /cookies/);
  assert.match(scriptProblems('localStorage.setItem("a", "1");', "x.js").join(), /storage/);
  assert.match(scriptProblems('fetch("/collect");', "x.js").join(), /sends a request/);
  assert.match(scriptProblems("window.dataLayer = [];", "x.js").join(), /measuring/);
  // An XML namespace name is not an address; a look-alike on another path still is.
  assert.deepEqual(scriptProblems('createElementNS("http://www.w3.org/2000/svg", "svg");', "x.js"), []);
  assert.match(scriptProblems('fetch("http://www.w3.org/2000/svg-tracker");', "x.js", { mayLoad: true }).join(), /outside address/);
  assert.match(scriptProblems('const u = "https://example.com/a";', "x.js").join(), /outside address/);
  assert.match(scriptProblems('import("https://cdn.example.com/a.js");', "x.js").join(), /outside address/);
  assert.deepEqual(scriptProblems("// see https://example.com\nexport const a = 1; /* fetch( */", "x.js"), []);
  assert.deepEqual(scriptProblems('if (!ok) throw new Error("frames must come from this site"); fetch(url);', "x.js", { mayLoad: true }), []);
  assert.match(scriptProblems("fetch(url);", "x.js", { mayLoad: true }).join(), /refuse addresses outside this site/);
  assert.match(scriptProblems('document.cookie = "a"; fetch(url); // must come from this site', "x.js", { mayLoad: true }).join(), /cookies/);
});
