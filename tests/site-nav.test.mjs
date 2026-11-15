import assert from "node:assert/strict";
import { test } from "node:test";
import { NAV_EVENTS, navState } from "../assets/js/nav.js";
import { siteNav } from "../src/components/site-nav.mjs";
import { PRIMARY_ACTION } from "../src/content/site.mjs";

const current = (html) => [...html.matchAll(/<a[^>]*aria-current="page"[^>]*>(.*?)<\/a>/gs)].map((m) => m[1].replace(/<[^>]+>/g, ""));

test("expected: the bar holds the brand, two page links and the site's one action", () => {
  const html = siteNav({ current: "/moduly/" });
  assert.equal((html.match(/<nav /g) ?? []).length, 1);
  assert.ok(html.includes('<a class="site-nav__brand" href="/">'));
  assert.ok(html.includes('href="/forge/"') && html.includes('href="/moduly/"'));
  assert.equal((html.match(/button--primary/g) ?? []).length, 1);
  assert.ok(html.includes(`href="${PRIMARY_ACTION.href}"`) && html.includes(PRIMARY_ACTION.label));
  assert.deepEqual(current(html), ["Moduly"]);
  assert.ok(html.includes('aria-expanded="false" aria-controls="site-menu"') && html.includes('id="site-menu"'));
});

test("edge: the home page marks the brand; a page outside the bar marks nothing", () => {
  assert.deepEqual(current(siteNav({ current: "/" })), ["AI Software Factory"]);
  assert.deepEqual(current(siteNav({ current: "/provozovatel/" })), []);
  assert.deepEqual(current(siteNav({ current: "/404.html" })), []);
});

test("error: an unknown path throws", () => {
  assert.throws(() => siteNav({ current: "/neexistuje/" }), /Unknown page path: "\/neexistuje\/"/);
  assert.throws(() => siteNav({}), /Unknown page path/);
});

test("expected: the menu opens to its first link and closes back to its button", () => {
  assert.deepEqual(navState({ open: false }, "toggle"), { open: true, focus: "first-link" });
  assert.deepEqual(navState({ open: true }, "toggle"), { open: false, focus: "toggle" });
  assert.deepEqual(navState({ open: true }, "escape"), { open: false, focus: "toggle" });
});

test("edge: Escape on a closed menu, a followed link and a widened bar move no focus", () => {
  assert.deepEqual(navState({ open: false }, "escape"), { open: false, focus: null });
  assert.deepEqual(navState({ open: true }, "navigate"), { open: false, focus: null });
  assert.deepEqual(navState({ open: true }, "widen"), { open: false, focus: null });
  assert.deepEqual(NAV_EVENTS, ["toggle", "escape", "navigate", "widen"]);
});

test("error: an unknown event or a malformed state throws", () => {
  assert.throws(() => navState({ open: false }, "swipe"), /unknown event "swipe"/);
  assert.throws(() => navState(null, "toggle"), /state/);
  assert.throws(() => navState({ open: "yes" }, "toggle"), /state/);
});
