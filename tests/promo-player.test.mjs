import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import { ROOT } from "../build.mjs";
import { promoPlayer } from "../src/components/promo-player.mjs";
import { PROMO } from "../src/content/promo.mjs";
import { built } from "./lib/pages.mjs";

test("the full film plays on demand in both languages, linked from each Forge page", () => {
  for (const home of ["/", "/en/"]) {
    const html = built(home);
    assert.ok(html.includes('href="#film"'));
    assert.ok(built(home + "forge/").includes(`href="${home}#film"`));
    const player = html.match(/<video class="promo__player"[\s\S]+?<\/video>/g);
    assert.equal(player?.length, 1);
    assert.match(player[0], / controls playsinline preload="none"/);
    assert.doesNotMatch(player[0], /\b(autoplay|loop|muted)\b/);
    assert.ok(player[0].includes(`src="${PROMO.video}" type="video/mp4"`));
    assert.ok(player[0].includes(`poster="${PROMO.poster}"`));
    const czech = player[0].match(/<track[^>]*srclang="cs"[^>]*>/)[0];
    assert.equal(czech.includes(" default"), home === "/");
    assert.match(player[0], /<track kind="captions" srclang="en"/);
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
