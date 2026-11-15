import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { test } from "node:test";
import { filmCut, filmPlan, filmSource } from "../assets/js/film.js";
import { ROOT } from "../build.mjs";
import { film, filmPreload } from "../src/components/film.mjs";
import { object3d } from "../src/components/object3d.mjs";
import { FILMS, OBJECTS, film as filmOf, media3dFiles, object3d as objectOf } from "../src/content/media3d.mjs";

test("expected: the factory's film is a still picture with its two cuts and the loop mark", () => {
  const html = film("factory", { eager: true });
  assert.ok(html.startsWith('<figure class="film film--auto film--loop" data-film data-film-large="/assets/media/film/factory-large.mp4" data-film-small="/assets/media/film/factory-small.mp4" data-film-loop>'));
  assert.ok(html.includes('<source media="(max-width: 767px)" srcset="/assets/media/film/factory-small-start.jpg" width="1080" height="1350">'));
  assert.ok(html.includes(`src="/assets/media/film/factory-large-start.jpg" alt="${FILMS.factory.alt}" width="1920" height="1080"`));
  assert.ok(html.includes('fetchpriority="high"') && !html.includes("loading="));
  assert.equal((html.match(/<picture/g) ?? []).length, 1);
  assert.equal(html.includes("<video"), false);
});

test("expected: a film that plays once carries its last frame as the still and its first frame as the start", () => {
  const html = film("rivet");
  assert.equal(html.includes("data-film-loop"), false);
  assert.ok(html.includes('<picture class="film__picture film__picture--still">') && html.includes("/assets/media/film/rivet-large-end.jpg"));
  assert.ok(html.includes('<picture class="film__picture film__picture--start">') && html.includes("/assets/media/film/rivet-large-start.jpg"));
  assert.ok(html.indexOf("film__picture--still") < html.indexOf("film__picture--start"));
  assert.equal((html.match(/loading="lazy"/g) ?? []).length, 2);
});

test("edge: beside text a film keeps its 4:5 cut at every width; preloads follow the cut", () => {
  const html = film("forge", { cut: "small", eager: true });
  assert.ok(html.includes('class="film film--small"') && html.includes('data-film-cut="small"'));
  assert.equal(html.includes("<source"), false);
  assert.ok(html.includes('src="/assets/media/film/forge-small-end.jpg"') && html.includes('width="1080" height="1350"'));
  assert.equal((filmPreload("forge", { cut: "small" }).match(/<link/g) ?? []).length, 1);
  assert.equal((filmPreload("factory").match(/<link/g) ?? []).length, 2);
  assert.ok(filmPreload("forge", { cut: "small" }).includes("/assets/media/film/forge-small-start.jpg"));
});

test("error: an unknown film, cut or object throws", () => {
  assert.throws(() => film("kladivo"), /Unknown film: "kladivo"/);
  assert.throws(() => filmOf("constructor"), /Unknown film/);
  assert.throws(() => film("forge", { cut: "wide" }), /Unknown film cut/);
  assert.throws(() => object3d("kladivo"), /Unknown 3D object: "kladivo"/);
  assert.throws(() => objectOf("toString"), /Unknown 3D object/);
});

test("expected: every product has a described 3D object and film, and every file is on disk", async () => {
  assert.deepEqual(Object.keys(OBJECTS).sort(), ["anvil", "bellows", "forge", "harness", "rivet", "temper"]);
  assert.deepEqual(Object.keys(FILMS).sort(), ["anvil", "bellows", "factory", "forge", "harness", "rivet", "temper"]);
  for (const [name, f] of Object.entries(FILMS)) assert.ok(f.alt.length > 30, name);
  for (const file of media3dFiles()) await access(`${ROOT}${file}`);
  const img = object3d("temper");
  assert.ok(img.includes('src="/assets/media/3d/temper.jpg"') && img.includes(`alt="${OBJECTS.temper}"`) && img.includes('width="1200" height="800"'));
  const quiet = object3d("temper", { decorative: true, className: "line__object" });
  assert.ok(quiet.includes('class="object3d line__object"') && quiet.includes('alt="" aria-hidden="true"'));
});

test("expected: what a film does for a visitor, and which cut it shows", () => {
  assert.equal(filmPlan({ loop: true }), "loop");
  assert.equal(filmPlan({}), "once");
  assert.equal(filmPlan(), "once");
  assert.equal(filmCut({ narrow: true }), "small");
  assert.equal(filmCut({ narrow: false }), "large");
  assert.equal(filmSource({ dataset: { filmLarge: "/assets/media/film/forge-large.mp4", filmSmall: "/assets/media/film/forge-small.mp4" } }, "small"), "/assets/media/film/forge-small.mp4");
});

test("edge: reduced motion and save-data keep the still; a forced cut wins over the viewport", () => {
  assert.equal(filmPlan({ loop: true, reducedMotion: true }), "still");
  assert.equal(filmPlan({ saveData: true }), "still");
  assert.equal(filmCut({ forced: "small", narrow: false }), "small");
  assert.equal(filmCut({ forced: "large", narrow: true }), "large");
  assert.equal(filmCut({ forced: "tiny", narrow: true }), "small");
});

test("error: a film from another site, or without an address, is refused", () => {
  assert.throws(() => filmSource({ dataset: { filmLarge: "https://cdn.example.com/a.mp4" } }, "large"), /must come from this site/);
  assert.throws(() => filmSource({ dataset: { filmLarge: "//cdn.example.com/a.mp4" } }, "large"), /must come from this site/);
  assert.throws(() => filmSource({ dataset: {} }, "small"), /must come from this site/);
});
