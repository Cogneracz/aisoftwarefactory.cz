import assert from "node:assert/strict";
import { test } from "node:test";
import { rich } from "../src/components/rich.mjs";
import { built, h1, h2s, hrefs, main, plain, primaryButtons } from "./lib/pages.mjs";
import { pageProblems, scriptProblems } from "./lib/integrity.mjs";

const html = built("/provozovatel/");
const text = plain(main(html));

test("expected: the operator is stated in full, with the way to get in touch", () => {
  assert.equal(h1(html), "Provozovatel a soukromí");
  assert.deepEqual(h2s(html), ["Provozovatel", "Soukromí"]);
  for (const part of ["Cognera s.r.o.", "Panská 571, 391 55 Chýnov", "IČO 23743514", "DIČ CZ23743514", "oddíl C, vložka 35720"]) assert.ok(text.includes(part), part);
  assert.ok(hrefs(main(html)).includes("https://cognera.cz/#contact-form"));
});

test("expected: the privacy statements name what the site does not do, its host and the form's policy", () => {
  for (const part of ["žádné cookies", "Neměří návštěvnost a nezobrazuje reklamu", "přímo z této domény", "GitHub Pages", "IP adresu"]) assert.ok(text.includes(part), part);
  const links = hrefs(main(html));
  assert.ok(links.includes("https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement"));
  assert.ok(links.includes("https://cognera.cz/ochrana-osobnich-udaju"));
});

test("edge: a quiet page: no primary action in its body, no e-mail address, no phone number", () => {
  assert.equal(primaryButtons(main(html)).length, 0);
  assert.equal(/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(text), false);
  assert.equal(/\+420/.test(text), false);
  assert.ok(html.includes('<link rel="canonical" href="https://aisoftwarefactory.cz/provozovatel/">'));
});

test("error: the statements are enforced: a tracker or a cookie call fails the checks; a link without text or address throws", () => {
  const context = { path: "/provozovatel/", origin: "https://aisoftwarefactory.cz", files: new Set(), idsOf: new Map(), allowedHosts: ["cognera.cz", "docs.github.com"] };
  const tracked = html.replace("</head>", '<script async src="https://www.googletagmanager.com/gtag/js?id=G-X"></script></head>');
  assert.ok(pageProblems(tracked, context).some((line) => /not root-relative: https:\/\/www\.googletagmanager\.com/.test(line)));
  assert.ok(scriptProblems('document.cookie = "consent=1"', "x.js").length > 0);
  assert.throws(() => rich([{ text: "", href: "/" }]), /link's text/);
  assert.throws(() => rich([{ text: "a" }]), /link's address/);
  assert.throws(() => rich([]), /text is required/);
});
