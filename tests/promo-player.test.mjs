import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { ROOT } from "../build.mjs";
import { promoPlayer } from "../src/components/promo-player.mjs";
import { PROMO } from "../src/content/promo.mjs";
import { built } from "./lib/pages.mjs";

test("all four product entry pages have one accessible native hero film and offer English captions", () => {
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
    const tracks = player.match(/<track\b[^>]*>/g) ?? [];
    assert.equal(tracks.length, 1);
    assert.match(tracks[0], /kind="captions" srclang="en" label="English"/);
    assert.ok(tracks[0].includes(`src="${PROMO.en}"`));
    assert.equal(tracks[0].includes(" default"), path.startsWith("/en/"));
    assert.doesNotMatch(opening, /data-film-large|button--secondary/);
  }
});

test("English captions retain all sixteen cues and the web print meets the decimal upload limit", async () => {
  const text = await readFile(join(ROOT, PROMO.en), "utf8");
  const [header, ...cues] = text.trim().split(/\r?\n\r?\n/);
  assert.equal(header, "WEBVTT");
  assert.equal(cues.length, 16);
  for (const cue of cues) assert.match(cue, /^\d\d:\d\d\.\d{3} --> \d\d:\d\d\.\d{3}\r?\n\S/);
  const { size } = await stat(join(ROOT, PROMO.video));
  assert.ok(size > 0 && size < 20_000_000, `Web film size: ${size}`);
});

test("a missing accessible heading or download label fails the render", () => {
  assert.throws(() => promoPlayer({ heading: "", download: "Download" }), /heading is required/);
  assert.throws(() => promoPlayer({ heading: "Forge", download: "" }), /download label is required/);
});
