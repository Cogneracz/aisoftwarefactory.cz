import assert from "node:assert/strict";
import { test } from "node:test";
import { attrs, cls, esc, jsonForScript, need, t } from "../src/lib/html.mjs";
import { NBSP, typo } from "../src/lib/typo.mjs";

test("expected: text and attributes are escaped", () => {
  assert.equal(esc(`Tlačítko „Merge“ <b> & "x" 'y'`), "Tlačítko „Merge“ &lt;b&gt; &amp; &quot;x&quot; &#39;y&#39;");
  assert.equal(attrs({ class: "a b", href: "/x?a=1&b=2", hidden: true }), ' class="a b" href="/x?a=1&amp;b=2" hidden');
  assert.equal(cls("a", false, "", "b"), "a b");
});

test("edge: false, null and undefined attributes are left out; zero and empty text survive", () => {
  assert.equal(attrs({ a: false, b: null, c: undefined, d: 0, e: "" }), ' d="0" e=""');
  assert.equal(esc(0), "0");
  assert.equal(esc(""), "");
  assert.equal(jsonForScript({ a: "</script><script>alert(1)</script>" }).includes("</script>"), false);
  assert.deepEqual(JSON.parse(jsonForScript({ a: "<b>" })), { a: "<b>" });
});

test("error: missing values and invalid attribute names throw", () => {
  assert.throws(() => esc(null), /required/);
  assert.throws(() => esc(undefined), /required/);
  assert.throws(() => attrs(null), /object/);
  assert.throws(() => attrs({ 'on"click': "x" }), /invalid attribute name/);
  assert.throws(() => need("  ", "A title"), /A title is required/);
  assert.throws(() => typo(12), /string/);
});

test("expected: one-letter prepositions and conjunctions keep their next word", () => {
  assert.equal(typo("Forge vznikl v Cogneře a sami s ním pracujeme."), `Forge vznikl v${NBSP}Cogneře a${NBSP}sami s${NBSP}ním pracujeme.`);
  assert.equal(typo("Ověří kód i testy"), `Ověří kód i${NBSP}testy`);
  assert.equal(t("V každém z nich"), "V&nbsp;každém z&nbsp;nich");
});

test("edge: consecutive short words, identifiers and grouped numbers", () => {
  assert.equal(typo("a v továrně"), `a${NBSP}v${NBSP}továrně`);
  assert.equal(typo("IČO 23743514, DIČ CZ23743514"), `IČO${NBSP}23743514, DIČ${NBSP}CZ23743514`);
  assert.equal(typo("391 55 Chýnov"), `391${NBSP}55 Chýnov`);
  assert.equal(typo("Cognera s.r.o."), `Cognera${NBSP}s.r.o.`);
  assert.equal(typo("krok"), "krok");
  assert.equal(typo(""), "");
});
