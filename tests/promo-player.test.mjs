import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { ROOT } from "../build.mjs";
import { promoPlayer } from "../src/components/promo-player.mjs";
import { PROMO } from "../src/content/promo.mjs";
import { built } from "./lib/pages.mjs";

test("all four product entry pages have one accessible native hero film and localized captions", () => {
  for (const path of ["/", "/en/", "/forge/", "/en/forge/"]) {
    const html = built(path);
    const opening = html.match(/<section class="hero [^"]*">([\s\S]*?)<\/section>/)[1];
    assert.equal((html.match(/data-hero-promo/g) ?? []).length, 1);
    const player = opening.match(/<video[^>]*data-hero-promo[\s\S]+?<\/video>/)[0];
    assert.ok(player.includes('id="film"'));
    assert.match(player, / controls playsinline preload="none"/);
    assert.doesNotMatch(player, /\b(autoplay|loop|muted)\b/);
    assert.ok(player.includes(`src="${PROMO.video}" type="video/mp4"`));
    assert.ok(player.includes(`poster="${PROMO.poster}"`));
    assert.match(player, /aria-label="[^"]+"/);
    const selected = [...player.matchAll(/<track[^>]*srclang="([^"]+)"[^>]* default>/g)].map((m) => m[1]);
    assert.deepEqual(selected, [path.startsWith("/en/") ? "en" : "cs"]);
    assert.doesNotMatch(opening, /data-film-large|button--secondary/);
  }
});

test("subtitles share every timed cue and the web print meets the decimal upload limit", async () => {
  const cues = async (path) => {
    const text = await readFile(join(ROOT, path), "utf8");
    assert.ok(text.startsWith("WEBVTT\n"));
    return [...text.matchAll(/^[\d:.]+ --> [\d:.]+$/gm)].map(([time]) => time);
  };
  const english = await cues(PROMO.en);
  assert.equal(english.length, 16);
  assert.deepEqual(await cues(PROMO.cs), english);
  const { size } = await stat(join(ROOT, PROMO.video));
  assert.ok(size > 0 && size < 20_000_000, `Web film size: ${size}`);
});

test("a missing accessible heading or download label fails the render", () => {
  assert.throws(() => promoPlayer({ heading: "", download: "Download" }), /heading is required/);
  assert.throws(() => promoPlayer({ heading: "Forge", download: "" }), /download label is required/);
});
