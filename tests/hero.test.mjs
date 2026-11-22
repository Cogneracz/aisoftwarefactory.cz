import assert from "node:assert/strict";
import { test } from "node:test";
import { hero } from "../src/components/hero.mjs";
import { HOME } from "../src/content/home.mjs";
import { PRIMARY_ACTION } from "../src/content/site.mjs";

const count = (html, part) => html.split(part).length - 1;

test("expected: the home hero pairs the brief and demo link with the full promo", () => {
  const html = hero({ ...HOME.hero, promo: HOME.promo, layout: "split", action: PRIMARY_ACTION });
  assert.equal(count(html, "<h1"), 1);
  assert.equal(count(html, 'class="hero__line"'), 2);
  assert.equal(count(html, "button--primary"), 1);
  assert.equal(count(html, "data-hero-promo"), 1);
  assert.equal(count(html, "hero__proof"), 0);
  for (const part of ["hero__title", "hero__lead", "hero__actions", "hero__media"]) assert.ok(html.includes(part));
  assert.ok(html.includes('class="hero hero--split hero--promo"'));
});

test("edge: a plain hero needs no action or screen; a one-line title, a mark with a tag and a linked lead render", () => {
  const plain = hero({ layout: "plain", title: ["Provozovatel a soukromí"], lead: "Kdo tento web provozuje." });
  assert.equal(count(plain, "button"), 0);
  assert.equal(count(plain, "hero__media"), 0);
  assert.equal(count(plain, 'class="hero__line"'), 1);
  const tagged = hero({ layout: "plain", eyebrow: "Forge", mark: "forge", tag: "Jádro", title: ["A"], lead: ["K ", { text: "Forge", href: "/forge/" }, "."], action: { label: "Zpět na úvod", href: "/", variant: "secondary" } });
  assert.ok(tagged.includes('<span class="tag">Jádro</span>') && tagged.includes("<svg"));
  assert.ok(tagged.includes('<a class="link" href="/forge/">Forge</a>'));
  assert.ok(tagged.includes("button--secondary") && !tagged.includes("button--primary"));
  const beside = hero({ layout: "split", title: ["A"], action: PRIMARY_ACTION, film: "forge" });
  assert.ok(beside.includes('data-film-cut="small"') && beside.includes("film--small"));
  const withScreen = hero({ layout: "split", title: ["A"], action: PRIMARY_ACTION, screen: "forge-step-b" });
  assert.ok(withScreen.includes("forge-step-b.webp") && !withScreen.includes("data-film"));
});

test("error: an empty title, a missing action or picture, two pictures and an unknown layout throw", () => {
  assert.throws(() => hero({ layout: "plain", title: [] }), /title/);
  assert.throws(() => hero({ layout: "plain", title: ["", "x"] }), /title/);
  assert.throws(() => hero({ layout: "split", title: ["A"], screen: "forge-step-b" }), /needs its action/);
  assert.throws(() => hero({ layout: "split", title: ["A"], action: PRIMARY_ACTION }), /needs a film or a screen/);
  assert.throws(() => hero({ layout: "plain", title: ["A"], screen: "forge-step-b" }), /no picture/);
  assert.throws(() => hero({ layout: "split", title: ["A"], action: PRIMARY_ACTION, screen: "forge-step-b", film: "forge" }), /one picture/);
  assert.throws(() => hero({ layout: "split", title: ["A"], action: PRIMARY_ACTION, film: "kladivo" }), /Unknown film/);
  assert.throws(() => hero({ layout: "wide", title: ["A"] }), /Unknown hero layout/);
});
