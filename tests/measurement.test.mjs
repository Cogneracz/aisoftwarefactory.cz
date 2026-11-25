import assert from "node:assert/strict";
import { test } from "node:test";
import { initMeasurement } from "../assets/js/measurement.js";
import { consentPanel } from "../src/components/consent.mjs";
import { withLocale } from "../src/i18n/index.mjs";
import { scriptProblems } from "./lib/integrity.mjs";

class Control extends EventTarget {
  hidden = true;
  focused = false;
  attributes = {};
  constructor(dataset = {}) { super(); this.dataset = dataset; }
  setAttribute(k, value) { this.attributes[k] = value; }
  focus() { this.focused = true; }
  click() { this.dispatchEvent(new Event("click")); }
}

function setup({ saved, project = "testid", blocked = false, failWrite = false, failRemove = false, cookie = "", origin = "https://aisoftwarefactory.cz" } = {}) {
  const panel = new Control({ project, origin: "https://aisoftwarefactory.cz" });
  const opener = new Control();
  const allow = new Control({ choice: "granted" });
  const decline = new Control({ choice: "denied" });
  const scripts = [];
  const cookieWrites = [];
  const doc = new EventTarget();
  const win = new EventTarget();
  Object.defineProperty(doc, "cookie", {
    get: () => cookie,
    set: (entry) => {
      cookieWrites.push(entry);
      if (entry.startsWith("factory_measurement_off=")) cookie = entry.includes("Max-Age=0") ? "" : "factory_measurement_off=1";
    },
  });
  let reloads = 0;
  let record = saved;
  Object.assign(doc, {
    getElementById: () => panel, querySelector: () => opener, createElement: () => ({}),
    head: { append: (script) => scripts.push(script) },
  });
  Object.assign(panel, { querySelector: () => decline, querySelectorAll: () => [decline, allow] });
  Object.assign(win, {
    location: { origin, hostname: new URL(origin).hostname, reload: () => { reloads++; } },
    localStorage: {
      getItem(key) { assert.equal(key, "factory.measurement.v1"); if (blocked) throw new Error("blocked"); return record; },
      setItem(key, value) { assert.equal(key, "factory.measurement.v1"); if (blocked || failWrite) throw new Error("blocked"); record = value; },
      removeItem(key) { assert.equal(key, "factory.measurement.v1"); if (blocked || failRemove) throw new Error("blocked"); record = null; },
    },
  });
  initMeasurement(doc, win);
  return { doc, win, opener, panel, allow, decline, scripts, cookieWrites, reloads: () => reloads, saved: () => record };
}
const snapshot = (value, expires = Date.now() + 100000) => JSON.stringify({ value, expires });

test("the notice and footer offer consent again after refusal; nothing loads until acceptance", () => {
  const ctx = setup();
  assert.equal(ctx.panel.hidden, false);
  assert.equal(ctx.win.clarity, undefined);
  ctx.decline.click();
  assert.equal(ctx.panel.hidden, true);
  assert.deepEqual(ctx.scripts, []);
  assert.equal(JSON.parse(ctx.saved()).value, "denied");
  ctx.opener.click();
  assert.equal(ctx.decline.focused, true);
  ctx.allow.click();
  initMeasurement(ctx.doc, ctx.win);
  ctx.win.dispatchEvent(new Event("pageshow"));
  assert.equal(ctx.scripts.length, 1);
  assert.equal(ctx.scripts[0].src, "https://www.clarity.ms/tag/testid");
  assert.deepEqual(Array.from(ctx.win.clarity.q[0]), ["consentv2", { ad_Storage: "denied", analytics_Storage: "granted" }]);
});

test("withdrawing consent tells Clarity to clear its cookies, discards the recorder and keeps the next page quiet", () => {
  const ctx = setup({ saved: snapshot("granted") });
  assert.equal(ctx.scripts.length, 1);
  ctx.opener.click();
  ctx.decline.click();
  assert.deepEqual(Array.from(ctx.win.clarity.q.at(-1)), ["consentv2", { ad_Storage: "denied", analytics_Storage: "denied" }]);
  assert.equal(ctx.reloads(), 1);
  const next = setup({ saved: ctx.saved() });
  assert.deepEqual(next.scripts, []);
  assert.equal(next.panel.hidden, true);
});

test("expired, corrupt, missing, and unsupported choices never start tracking", () => {
  for (const saved of [null, "garbage", snapshot("granted", 0), snapshot("maybe"), JSON.stringify({ value: "granted" })]) {
    const ctx = setup({ saved });
    assert.equal(ctx.panel.hidden, false);
    assert.deepEqual(ctx.scripts, []);
  }
  const blocked = setup({ blocked: true });
  assert.deepEqual(blocked.scripts, []);
  blocked.decline.click();
  assert.equal(blocked.panel.hidden, true);
  assert.deepEqual(blocked.scripts, []);
  for (const project of ["", null, "../tracker.js", "https://example.org"]) {
    const ctx = setup({ project, saved: snapshot("granted") });
    assert.deepEqual(ctx.scripts, []);
    assert.equal(ctx.opener.hidden, true);
  }
});

test("revocation clears first-party recorder cookies with both host-only and domain scope, including before tag load", () => {
  const ctx = setup({ saved: snapshot("granted") });
  ctx.decline.click();
  assert.equal(ctx.cookieWrites.length, 4);
  for (const name of ["_clsk", "_clck"]) {
    const expired = ctx.cookieWrites.filter(v => v.startsWith(name + "=; Max-Age=0;"));
    assert.equal(expired.length, 2);
    assert.ok(expired.some(v => !v.includes("Domain=")));
    assert.ok(expired.some(v => v.endsWith("Domain=aisoftwarefactory.cz")));
  }
});

test("withdrawal with a full store removes a still-readable old grant before the page reloads", () => {
  const ctx = setup({ saved: snapshot("granted"), failWrite: true });
  ctx.decline.click();
  assert.equal(ctx.saved(), null);
  assert.equal(ctx.reloads(), 1);
  assert.deepEqual(setup({ saved: ctx.saved() }).scripts, []);
});

test("a deny-only cookie overrides a stuck grant when both changing it and removing it fail", () => {
  const ctx = setup({ saved: snapshot("granted"), failWrite: true, failRemove: true });
  ctx.decline.click();
  assert.equal(JSON.parse(ctx.saved()).value, "granted");
  assert.equal(ctx.doc.cookie, "factory_measurement_off=1");
  assert.deepEqual(setup({ saved: ctx.saved(), cookie: ctx.doc.cookie }).scripts, []);
});

test("local and preview mirrors never record or prompt even with an existing opt-in", () => {
  for (const origin of ["http://localhost:4173", "https://cogneracz.github.io", "https://cognera.cz"]) {
    const ctx = setup({ origin, saved: snapshot("granted") });
    assert.deepEqual(ctx.scripts, []);
    assert.equal(ctx.opener.hidden, true);
    assert.equal(ctx.panel.hidden, true);
  }
});

test("a decision made in another tab is respected, including clearing storage", () => {
  const ctx = setup({ saved: snapshot("granted") });
  ctx.win.localStorage.setItem("factory.measurement.v1", snapshot("denied"));
  ctx.win.dispatchEvent(Object.assign(new Event("storage"), { key: "factory.measurement.v1" }));
  assert.equal(ctx.reloads(), 1);
  const cleared = setup({ saved: snapshot("granted") });
  cleared.win.localStorage.setItem("factory.measurement.v1", "null");
  cleared.win.dispatchEvent(Object.assign(new Event("storage"), { key: null }));
  assert.equal(cleared.reloads(), 1);
});

test("both languages render the matching privacy destination and choices only for a valid configuration", () => {
  const cs = withLocale("cs", () => consentPanel("project123"));
  const en = withLocale("en", () => consentPanel("project123"));
  assert.match(cs, /Odmítnout/);
  assert.match(cs, /href="\/provozovatel\/"/);
  assert.match(en, /Decline/);
  assert.match(en, /href="\/en\/operator\/"/);
  for (const panel of [cs, en]) {
    assert.match(panel, /<details>\s*<summary id="measurement-title">Cookies<\/summary>\s*<p>[^<]*Microsoft Clarity[^<]*<a /);
    assert.match(panel, /<\/details>\s*<div class="consent-panel__actions">\s*<button [^>]*data-choice="denied"[^>]*>[^<]+<\/button>\s*<button [^>]*data-choice="granted"/);
  }
  assert.doesNotMatch(cs, /<script|src=|<iframe/);
  assert.equal(consentPanel(""), "");
  assert.throws(() => consentPanel("/other.js"), /Invalid Clarity/);
});

test("the consent controller's integrity exception never permits other trackers, providers or browser storage", () => {
  const file = "/assets/js/measurement.js";
  for (const code of ['"https://example.org/tag/"', "win.localStorage.getItem('other')", "document.cookie", "window.gtag()", "fetch(url)"]) {
    assert.ok(scriptProblems(code, file).length > 0, code);
  }
});
