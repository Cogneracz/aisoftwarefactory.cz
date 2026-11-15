import assert from "node:assert/strict";
import { test } from "node:test";
import { siteFooter } from "../src/components/site-footer.mjs";
import { COMPANY, imprintLine, isValidIco } from "../src/content/site.mjs";

const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
const plain = (html) => html.replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, "");

test("expected: the imprint states the operator in full", () => {
  const text = plain(siteFooter());
  for (const part of ["Cognera s.r.o.", "Panská 571, 391 55 Chýnov", "IČO 23743514", "DIČ CZ23743514", "oddíl C, vložka 35720"]) assert.ok(text.includes(part), part);
  assert.equal(imprintLine(), "Cognera s.r.o., Panská 571, 391 55 Chýnov, IČO 23743514, DIČ CZ23743514. Společnost je zapsána v obchodním rejstříku vedeném Krajským soudem v Českých Budějovicích, oddíl C, vložka 35720.");
});

test("expected: the footer links the whole site and Cognera", () => {
  const links = hrefs(siteFooter());
  for (const href of ["/", "/forge/", "/moduly/", "/provozovatel/", "https://cognera.cz/", "https://cognera.cz/reference", "https://cognera.cz/ochrana-osobnich-udaju"]) assert.ok(links.includes(href), href);
});

test("edge: module anchors run in the family's order; outward links stay in the tab; no contact detail is printed", () => {
  const html = siteFooter();
  assert.deepEqual(
    hrefs(html).filter((h) => h.startsWith("/moduly/#")),
    ["/moduly/#bellows", "/moduly/#anvil", "/moduly/#temper", "/moduly/#rivet", "/moduly/#harness"],
  );
  assert.ok(hrefs(html).filter((h) => h.startsWith("http")).every((h) => h.startsWith("https://cognera.cz")));
  assert.equal(html.includes("target="), false);
  assert.equal(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(plain(html)), false);
  assert.equal(/\+420/.test(html), false);
});

test("error: a malformed IČO stops the footer", () => {
  assert.equal(isValidIco("23743514"), true);
  assert.equal(isValidIco("23743515"), false);
  assert.equal(isValidIco("2374351"), false);
  assert.equal(isValidIco(23743514), false);
  assert.throws(() => siteFooter({ company: { ...COMPANY, ico: "23743515" } }), /Malformed IČO/);
});
