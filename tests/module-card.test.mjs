import assert from "node:assert/strict";
import { test } from "node:test";
import { inModuleOrder, moduleCard, moduleGrid } from "../src/components/module-card.mjs";
import { MODULES, MODULE_ORDER } from "../src/content/modules.mjs";

const hrefs = (html) => [...html.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
const plain = (html) => html.replace(/&nbsp;/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
const bySlug = Object.fromEntries(MODULES.map((m) => [m.slug, m]));

test("expected: the grid holds the five modules in the family's order", () => {
  const html = moduleGrid(MODULES);
  assert.deepEqual(hrefs(html), ["/moduly/#bellows", "/moduly/#anvil", "/moduly/#temper", "/moduly/#rivet", "/moduly/#harness"]);
  assert.deepEqual(hrefs(moduleGrid([...MODULES].reverse())), hrefs(html));
  assert.deepEqual(hrefs(moduleGrid(MODULES, { onPage: true })), MODULE_ORDER.map((slug) => `#${slug}`));
});

test("expected: a card is one link with the module's 3D object, the role, the name and one line", () => {
  const html = moduleCard(bySlug.bellows);
  assert.equal((html.match(/<a /g) ?? []).length, 1);
  assert.ok(html.includes('<a class="module-card" href="/moduly/#bellows">') && html.includes('src="/assets/media/3d/bellows.jpg"'));
  assert.ok(plain(html).includes("Průzkum Bellows Najde, co stojí za to postavit."));
});

test("edge: Harness keeps its full name and its role as the base; a card on the modules page jumps within it", () => {
  const harness = plain(moduleCard(bySlug.harness));
  assert.ok(harness.includes("Základ") && harness.includes("Cognera Harness"));
  assert.deepEqual(hrefs(moduleCard(bySlug.harness, { onPage: true })), ["#harness"]);
  assert.equal(moduleCard(bySlug.harness, { onPage: true }).includes("reveal"), false);
});

test("error: Forge, an unknown, a repeated or a missing module, and a card without a name throw", () => {
  assert.throws(() => moduleGrid([...MODULES, { slug: "forge", name: "Forge" }]), /Forge is the core, not a module/);
  assert.throws(() => moduleGrid([...MODULES, { slug: "kladivo", name: "Kladivo" }]), /Not a module of Forge: "kladivo"/);
  assert.throws(() => moduleGrid([...MODULES, bySlug.temper]), /Listed twice: Temper/);
  assert.throws(() => moduleGrid(MODULES.filter((m) => m.slug !== "anvil")), /Missing modules: anvil/);
  assert.throws(() => inModuleOrder("bellows"), /list of modules/);
  assert.throws(() => moduleCard({ slug: "rivet" }), /A module's name is required/);
});
