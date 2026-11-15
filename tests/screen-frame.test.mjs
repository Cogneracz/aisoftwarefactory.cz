import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { test } from "node:test";
import { ROOT } from "../build.mjs";
import { screenFrame, screenPreload } from "../src/components/screen-frame.mjs";
import { CONTENT, content } from "../src/content/index.mjs";
import { SCREENS, SCREEN_DIR, screen, screenFiles } from "../src/content/screens.mjs";
import { withLocale } from "../src/i18n/index.mjs";

test("expected: a listed screen renders with its description, its size and its phone master", () => {
  const html = screenFrame("forge-step-b");
  assert.ok(html.startsWith('<figure class="screen"><picture>'));
  assert.ok(html.includes('src="/assets/media/screens/forge-step-b.webp"'));
  assert.ok(html.includes(`alt="${SCREENS["forge-step-b"].alt}"`));
  assert.ok(html.includes('width="1920" height="1200"'));
  assert.ok(html.includes('<source media="(max-width: 767px)" srcset="/assets/media/screens/forge-step-b-mobile.webp" width="1080" height="1350" type="image/webp">'));
  assert.ok(html.includes('loading="lazy" decoding="async"'));
});

test("edge: a screen without a phone master has no source; a hero picture loads eagerly", () => {
  SCREENS.__solo = { file: "forge-step-a.webp", width: 1920, height: 1200 };
  CONTENT.cs.screens.__solo = "A screen without a phone master, for this test only.";
  try {
    const solo = screenFrame("__solo", { eager: true });
    assert.equal(solo.includes("<source"), false);
    assert.ok(solo.includes('fetchpriority="high"'));
    assert.equal(solo.includes("loading="), false);
    assert.equal((screenPreload("__solo").match(/<link/g) ?? []).length, 1);
  } finally {
    delete SCREENS.__solo;
    delete CONTENT.cs.screens.__solo;
  }
  // The same picture is described in the language of the page it is on.
  const english = withLocale("en", () => screenFrame("forge-step-b"));
  assert.ok(english.includes(`alt="${content("en").screens["forge-step-b"]}"`) && english.includes("forge-step-b.webp"));
  assert.equal((screenPreload("forge-step-b").match(/<link/g) ?? []).length, 2);
});

test("error: an unknown screen and a screen without a description throw", () => {
  assert.throws(() => screenFrame("forge-step-z"), /Unknown screen: "forge-step-z"/);
  assert.throws(() => screen("constructor"), /Unknown screen/);
  SCREENS["__empty"] = { file: "x.webp", width: 1, height: 1 };
  try {
    assert.throws(() => screenFrame("__empty"), /description of the screen "__empty" is required/);
  } finally {
    delete SCREENS["__empty"];
  }
});

test("expected: every file the manifest names is on disk and every screen is described", async () => {
  for (const file of screenFiles()) await access(`${ROOT}${SCREEN_DIR}/${file}`);
  for (const [name, s] of Object.entries(SCREENS)) {
    for (const locale of ["cs", "en"]) assert.ok((content(locale).screens[name] ?? "").length > 30, `${name} needs a real description in ${locale}`);
    assert.ok(Number.isInteger(s.width) && Number.isInteger(s.height), name);
  }
});
