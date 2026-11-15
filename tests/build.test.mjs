import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { ROOT, STYLES, drift, render } from "../build.mjs";
import { CONTENT } from "../src/content/index.mjs";
import { SCREENS } from "../src/content/screens.mjs";
import { GENERATED_NOTE, canonical, fullTitle, page } from "../src/layout.mjs";

test("expected: a build renders every page, the stylesheet, the sitemap, robots and the favicon", async () => {
  const files = await render();
  assert.deepEqual([...files.keys()], [
    "index.html",
    "forge/index.html",
    "moduly/index.html",
    "provozovatel/index.html",
    "en/index.html",
    "en/forge/index.html",
    "en/modules/index.html",
    "en/operator/index.html",
    "404.html",
    "assets/site.css",
    "sitemap.xml",
    "robots.txt",
    "favicon.svg",
  ]);
  for (const [path, content] of files) if (path.endsWith(".html")) assert.ok(content.startsWith(`<!doctype html>\n${GENERATED_NOTE}`), path);
  for (const name of STYLES) assert.ok(files.get("assets/site.css").includes(`/* ${name} */`), name);
});

test("expected: the files on disk equal a fresh build", async () => {
  assert.deepEqual(await drift(await render()), [], "run `node build.mjs`");
  assert.equal(await readFile(`${ROOT}/CNAME`, "utf8"), "aisoftwarefactory.cz");
});

test("edge: titles, canonical addresses and a page without extras", () => {
  assert.equal(fullTitle("/", "AI továrna na software | Forge od Cognery"), "AI továrna na software | Forge od Cognery");
  assert.equal(fullTitle("/forge/", "Forge"), "Forge | AI Software Factory");
  assert.equal(fullTitle("/en/", "AI software factory | Forge by Cognera"), "AI software factory | Forge by Cognera");
  assert.equal(fullTitle("/en/forge/", "Forge"), "Forge | AI Software Factory");
  assert.equal(canonical("/moduly/"), "https://aisoftwarefactory.cz/moduly/");
  const html = page({ path: "/forge/", meta: { title: "T", description: "D" }, body: "<p>x</p>" });
  assert.equal((html.match(/application\/ld\+json/g) ?? []).length, 0);
  assert.ok(html.includes('<link rel="canonical" href="https://aisoftwarefactory.cz/forge/">'));
  const hidden = page({ path: "/404.html", meta: { title: "T", description: "D" }, body: "<p>x</p>", noindex: true });
  assert.ok(hidden.includes('<meta name="robots" content="noindex">') && !hidden.includes('rel="canonical"') && !hidden.includes("og:url"));
});

test("error: the build stops when the manifest names a picture that is not on disk", async () => {
  SCREENS.__ghost = { file: "ghost.webp", width: 1, height: 1, alt: "A picture that does not exist, for this test only." };
  try {
    await assert.rejects(render(), /not on disk: \/assets\/media\/screens\/ghost\.webp/);
  } finally {
    delete SCREENS.__ghost;
  }
  assert.equal((await render()).size, 13);
});

test("error: drift is reported by file, and a page without its title, description or body does not render", async () => {
  assert.deepEqual(await drift(new Map([["index.html", "changed by hand"], ["nowhere/else.html", "x"]])), ["index.html", "nowhere/else.html"]);
  assert.throws(() => page({ path: "/", meta: { description: "D" }, body: "x" }), /title of \/ is required/);
  assert.throws(() => page({ path: "/", meta: { title: "T" }, body: "x" }), /description of \/ is required/);
  assert.throws(() => page({ path: "/", meta: { title: "T", description: "D" }, body: "" }), /body of \/ is required/);
  assert.throws(() => page({ path: "/nikde/", meta: { title: "T", description: "D" }, body: "x" }), /Unknown page path/);
});
