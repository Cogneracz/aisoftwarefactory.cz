import assert from "node:assert/strict";
import { test } from "node:test";
import { ctaBand } from "../src/components/cta-band.mjs";
import { button } from "../src/components/rich.mjs";
import { HOME } from "../src/content/home.mjs";
import { PRIMARY_ACTION } from "../src/content/site.mjs";

test("expected: the band holds a heading, a sentence and the site's one action", () => {
  const html = ctaBand(HOME.closing);
  assert.equal((html.match(/<h2 /g) ?? []).length, 1);
  assert.ok(html.includes("Ukažte nám svůj backlog."));
  assert.equal((html.match(/button--primary/g) ?? []).length, 1);
  assert.ok(html.includes('href="https://cognera.cz/#contact-form"') && html.includes("<span>Domluvit ukázku</span>"));
  assert.deepEqual(PRIMARY_ACTION, { label: "Domluvit ukázku", href: "https://cognera.cz/#contact-form" });
});

test("edge: without a sentence there is no empty paragraph; the action cannot be overridden", () => {
  const html = ctaBand({ heading: "Začněte jasným zadáním." });
  assert.equal(/<p[ >]/.test(html), false);
  const forced = ctaBand({ heading: "A.", action: { label: "Koupit", href: "/koupit/" } });
  assert.equal(forced.includes("Koupit"), false);
  assert.ok(forced.includes("Domluvit ukázku"));
});

test("error: an empty heading and a malformed button throw", () => {
  assert.throws(() => ctaBand({ heading: " " }), /closing heading is required/);
  assert.throws(() => ctaBand({}), /closing heading is required/);
  assert.throws(() => button({ label: "", href: "/" }), /button's label/);
  assert.throws(() => button({ label: "A", href: "" }), /button's address/);
  assert.throws(() => button(PRIMARY_ACTION, { variant: "ghost" }), /Unknown button variant/);
  assert.throws(() => button(PRIMARY_ACTION, { size: "xl" }), /Unknown button size/);
});
