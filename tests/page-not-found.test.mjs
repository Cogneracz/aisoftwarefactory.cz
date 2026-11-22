import assert from "node:assert/strict";
import { test } from "node:test";
import { render } from "../build.mjs";
import { built, h1, hrefs, main, plain, primaryButtons } from "./lib/pages.mjs";
import { pageProblems } from "./lib/integrity.mjs";

const html = built("/404.html");

test("expected: a branded page that says plainly what happened and shows the ways back", () => {
  assert.equal(h1(html), "Tahle stránka tu není.");
  assert.ok(html.includes('<nav class="site-nav"') && html.includes('<footer class="site-footer">'));
  const links = hrefs(main(html));
  for (const href of ["/", "/forge/", "/moduly/"]) assert.ok(links.includes(href), href);
  assert.ok(main(html).includes('class="button button--secondary button--lg" href="/"'));
  assert.equal(primaryButtons(main(html)).length, 0);
});

test("edge: calm wording, root-relative addresses, and search engines skip it", async () => {
  const text = plain(main(html));
  assert.equal(/!/.test(text), false);
  assert.equal(/jejda|ups|ouha|oops/i.test(text), false);
  for (const href of [...hrefs(html), ...[...html.matchAll(/src="([^"]+)"/g)].map((m) => m[1])]) assert.match(href, /^(\/(?!\/)|https:\/\/|#)/, href);
  assert.ok(html.includes('<meta name="robots" content="noindex">'));
  assert.equal(html.includes('rel="canonical"'), false);
  assert.equal((await render()).get("sitemap.xml").includes("404"), false);
});

test("error: a relative address would break at depth and is reported", () => {
  const context = { path: "/404.html", origin: "https://aisoftwarefactory.cz", files: new Set(["/assets/site.css"]), idsOf: new Map([["/", new Set()]]), allowedHosts: ["cognera.cz"], noindex: true };
  assert.ok(pageProblems(html.replace('href="/forge/"', 'href="forge/"'), context).some((line) => /neither root-relative nor https: forge\//.test(line)));
  assert.ok(pageProblems(html.replace('src="/assets/js/site.js', 'src="assets/js/site.js'), context).some((line) => /not root-relative: assets\/js\/site\.js|unexpected script/.test(line)));
});
