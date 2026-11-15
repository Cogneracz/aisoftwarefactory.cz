import assert from "node:assert/strict";
import { test } from "node:test";
import {
  blendLevel,
  captionAt,
  decodeWindow,
  filmTime,
  frameProgress,
  isSlowConnection,
  keyframeAt,
  keyframeUrl,
  nearestKeyframe,
  pairBlend,
  pickScrubSet,
  pinnedProgress,
  progressiveLoadOrder,
  segmentFill,
  settleFrame,
  springStep,
} from "../assets/js/scrub-math.js";
import { ScrubPlayer } from "../assets/js/scrub-player.js";
import { SCENE_MANIFESTS, lineSceneOf, sceneManifest } from "../src/scenes.mjs";

test("expected: the stage's travel through its section, counted from the moment it pins", () => {
  assert.equal(pinnedProgress(0, 5000, 300, 800, 300), 0);
  // Scrolled 1950 px into the section with the stage pinned at the top: (1950 - 300) of 3900 px of travel.
  assert.equal(Math.round(pinnedProgress(-1950, 5000, 0, 800, 300) * 1000) / 1000, 0.423);
  assert.equal(pinnedProgress(0, 5000, 2250, 800, 300), 0.5);
  assert.equal(pinnedProgress(0, 5000, 4200, 800, 300), 1);
  assert.equal(captionAt(0.5, [0, 0.126, 0.314, 0.501, 0.688, 0.876]), 2);
  assert.equal(segmentFill(0.22, [0, 0.126, 0.314], 1), 0.5);
  assert.equal(filmTime(0.5, 459), 229.5);
  assert.equal(frameProgress(58, 459), 0.126);
});

test("edge: before the pin, past the end, a stage as tall as its section, the last chapter", () => {
  assert.equal(pinnedProgress(0, 5000, 100, 800, 300), 0);
  assert.equal(pinnedProgress(0, 5000, 9000, 800, 300), 1);
  assert.equal(pinnedProgress(0, 800, 0, 800), 0);
  assert.equal(pinnedProgress(0, 5000, 2100, 800), 0.5);
  assert.equal(captionAt(-1, [0, 0.5]), -1);
  assert.equal(captionAt(1, [0, 0.5]), 1);
  assert.equal(segmentFill(0.9, [0, 0.8], 1), 0.5);
  assert.equal(segmentFill(0.5, [0, 0.8], 5), 0);
  assert.equal(filmTime(7, 459), 459);
  assert.equal(frameProgress(999, 459), 1);
});

test("error: values that are not numbers give the start, never NaN", () => {
  assert.equal(pinnedProgress(Number.NaN, 5000, 0, 800), 0);
  assert.equal(pinnedProgress(0, 5000, 0, 800, Number.POSITIVE_INFINITY), 0);
  assert.equal(captionAt(Number.NaN, [0, 0.5]), -1);
  assert.equal(segmentFill(Number.NaN, [0, 0.5], 0), 0);
  assert.equal(filmTime(0.5, 0), 0);
  assert.equal(filmTime(Number.NaN, 459), 0);
  assert.equal(frameProgress(10, -1), 0);
});

test("expected: a film time falls between two kept frames; a moving pair steps, a still pair blends", () => {
  const frames = [0, 2, 4, 5, 6, 10];
  assert.deepEqual(keyframeAt(frames, 3), { a: 1, b: 2, w: 0.5 });
  assert.deepEqual(keyframeAt(frames, 5), { a: 3, b: 4, w: 0 });
  assert.equal(nearestKeyframe(frames, 9), 5);
  assert.equal(nearestKeyframe(frames, 7), 4);
  assert.equal(pairBlend({ frames, blend: "10100" }, 0, 0.3), 0.3);
  assert.equal(pairBlend({ frames, blend: "10100" }, 1, 0.3), 0);
  assert.equal(pairBlend({ frames, blend: "10100" }, 1, 0.7), 1);
  assert.equal(pairBlend({ frames }, 4, 0.4), 0);
  assert.equal(blendLevel(0.52), 0.5);
  assert.equal(keyframeUrl("/assets/media/scene/large/", 57, "avif"), "/assets/media/scene/large/057.avif");
});

test("edge: outside the film, an empty list, the ends of the blend", () => {
  const frames = [4, 8, 12];
  assert.deepEqual(keyframeAt(frames, -3), { a: 0, b: 0, w: 0 });
  assert.deepEqual(keyframeAt(frames, 99), { a: 2, b: 2, w: 0 });
  assert.deepEqual(keyframeAt([], 5), { a: -1, b: -1, w: 0 });
  assert.deepEqual(keyframeAt(frames, Number.NaN), { a: 0, b: 0, w: 0 });
  assert.equal(nearestKeyframe([], 5), -1);
  assert.equal(pairBlend({ frames }, 2, 0.5), 0);
  assert.equal(pairBlend({ frames }, 0, Number.NaN), 0);
  assert.equal(blendLevel(0.01), 0);
  assert.equal(blendLevel(0.99), 1);
  assert.equal(blendLevel(Number.NaN), 0);
  assert.equal(keyframeUrl("/x", Number.NaN, "webp"), "/x/000.webp");
});

test("expected: the spring follows without a jump and lands exactly; frames load coarse to fine", () => {
  let state = { x: 0, v: 0 };
  const seen = [];
  for (let i = 0; i < 60; i++) {
    state = springStep(state, 100, 16.7, 24, 0.05);
    seen.push(state.x);
  }
  assert.ok(seen[0] > 0 && seen[0] < 10, "starts gently");
  assert.ok(seen.every((x, i) => i === 0 || x >= seen[i - 1]), "never turns back");
  assert.ok(seen.every((x) => x <= 100), "never overshoots");
  assert.equal(state.x, 100);
  assert.equal(state.v, 0);
  assert.deepEqual(progressiveLoadOrder(10, 3).slice(0, 4), [3, 9, 0, 8]);
  assert.equal(new Set(progressiveLoadOrder(10, 3)).size, 10);
  assert.deepEqual(decodeWindow(5, 20, 1, 3, 1), [5, 6, 4, 7, 8]);
  assert.deepEqual(decodeWindow(5, 20, -1, 3, 1), [5, 4, 6, 3, 2]);
});

test("edge: a slow link leaves frames out; windows stop at the film's ends; long gaps count as 100 ms", () => {
  assert.equal(progressiveLoadOrder(16, 0, [8, 4, 2]).length, 9);
  assert.deepEqual(progressiveLoadOrder(1), [0]);
  assert.deepEqual(decodeWindow(0, 3, 1, 6, 2), [0, 1, 2]);
  assert.deepEqual(decodeWindow(2, 3, -1, 6, 2), [2, 1, 0]);
  assert.deepEqual(springStep({ x: 0, v: 0 }, 50, 5000, 24), springStep({ x: 0, v: 0 }, 50, 100, 24));
  assert.deepEqual(springStep({ x: 49.99, v: 0 }, 50, 16, 24, 0.05), { x: 50, v: 0 });
});

test("error: invalid counts and states give nothing or the target", () => {
  assert.deepEqual(progressiveLoadOrder(0), []);
  assert.deepEqual(progressiveLoadOrder(Number.NaN), []);
  assert.deepEqual(decodeWindow(Number.NaN, 10, 1), []);
  assert.deepEqual(decodeWindow(1, 0, 1), []);
  assert.deepEqual(springStep({ x: Number.NaN, v: 0 }, 7, 16), { x: 7, v: 0 });
  assert.deepEqual(springStep({ x: 1, v: 0 }, Number.NaN, 16), { x: 0, v: 0 });
  assert.deepEqual(springStep({ x: 1, v: 0 }, 7, 16, 0), { x: 7, v: 0 });
});

test("expected: the film never rests inside a move", () => {
  const moves = [[30, 86], [116, 172]];
  assert.equal(settleFrame(60, 1, moves), 86);
  assert.equal(settleFrame(60, -1, moves), 30);
  assert.equal(settleFrame(100, 1, moves), null);
  assert.equal(settleFrame(35, 1, moves), 30);
  assert.equal(settleFrame(165, -1, moves), 172);
  assert.equal(settleFrame(50, 0, moves), 30);
  assert.equal(settleFrame(70, 0, moves), 86);
});

test("edge: the ends of a move are stops; exactly a fifth of a move counts as a fifth", () => {
  const moves = [[30, 86]];
  assert.equal(settleFrame(30, 1, moves), null);
  assert.equal(settleFrame(86, -1, moves), null);
  assert.equal(settleFrame(30 + 56 * 0.2, 1, moves), 86);
  assert.equal(settleFrame(Number.NaN, 1, moves), null);
  assert.equal(settleFrame(60, 1, []), null);
});

test("expected: which frame set a stage gets, and when to load less", () => {
  assert.equal(pickScrubSet(false, 1440, 1), "large");
  assert.equal(pickScrubSet(true, 390, 3), "small");
  assert.equal(pickScrubSet(true, 820, 2), "tablet");
  assert.equal(pickScrubSet(true, 620, 1), "small");
  assert.equal(pickScrubSet(true, Number.NaN, 2), "small");
  assert.equal(isSlowConnection({ saveData: true }), true);
  assert.equal(isSlowConnection({ effectiveType: "2g" }), true);
  assert.equal(isSlowConnection({ effectiveType: "slow-2g" }), true);
  assert.equal(isSlowConnection({ effectiveType: "4g" }), false);
  assert.equal(isSlowConnection(undefined), false);
});

test("expected: every scene's manifest is consistent with itself", () => {
  assert.deepEqual(Object.keys(SCENE_MANIFESTS), ["assembly", "line-cs", "line-en"]);
  assert.equal(lineSceneOf("en"), "line-en");
  assert.throws(() => sceneManifest("line-de"), /Unknown scene: "line-de"/);
  for (const [scene, m] of Object.entries(SCENE_MANIFESTS)) {
    assert.match(m.revision, /^[a-z0-9-]+$/, scene);
    assert.equal(m.stills, `/assets/media/scenes/${scene}/steps`, scene);
    assert.equal(m.captionFrames.length, 6, scene);
    assert.equal(m.stepStills.length, 6, scene);
    assert.equal(m.moves.length, 5, scene);
    for (const [name, set] of Object.entries(m.sets)) {
      const where = `${scene} ${name}`;
      assert.equal(set.base, `/assets/media/scenes/${scene}/${name}`, where);
      assert.equal(set.frames[0], 0, where);
      assert.equal(set.frames.at(-1), m.span, where);
      assert.ok(set.frames.every((f, i) => i === 0 || f > set.frames[i - 1]), `${where} ascends`);
      assert.equal(set.blend.length, set.frames.length - 1, where);
      // A kept frame stands at, or within two frames of, both ends of every move, so the film comes to rest on a stop.
      for (const frame of m.moves.flat()) assert.ok(set.frames.some((f) => Math.abs(f - frame) <= 2), `${where} keeps a frame at ${frame}`);
    }
    // Captions change inside the moves, never while a stop is at rest.
    m.captionFrames.slice(1).forEach((frame, i) => assert.ok(frame > m.moves[i][0] && frame < m.moves[i][1], `${scene} caption ${i + 2}`));
    // Each still shows its own stop: after the move into it and before the move out of it.
    m.stepStills.forEach((frame, i) => assert.ok((i === 0 || frame >= m.moves[i - 1][1]) && (i === m.stepStills.length - 1 || frame <= m.moves[i][0]), `${scene} still ${i + 1}`));
  }
  // The two languages of the line scene are the same film: same timing, different pictures.
  const [cs, en] = [sceneManifest("line-cs"), sceneManifest("line-en")];
  assert.deepEqual([en.span, en.captionFrames, en.moves, en.stepStills], [cs.span, cs.captionFrames, cs.moves, cs.stepStills]);
  assert.notEqual(en.revision, cs.revision);
});

test("error: the player refuses frames from another site and a missing revision", () => {
  const canvas = { getContext: () => null };
  const set = { base: "/assets/media/scene/large", width: 16, height: 9, frames: [0, 1] };
  assert.throws(() => new ScrubPlayer(canvas, { ...set, base: "https://cdn.example.com/frames" }, { revision: "r1", cache: 8, onFrame() {} }), /must come from this site/);
  assert.throws(() => new ScrubPlayer(canvas, { ...set, base: "//cdn.example.com/frames" }, { revision: "r1", cache: 8, onFrame() {} }), /must come from this site/);
  assert.throws(() => new ScrubPlayer(canvas, set, { revision: " ", cache: 8, onFrame() {} }), /no frame revision/);
  const player = new ScrubPlayer(canvas, set, { ext: "avif", revision: "r 1", cache: 8, onFrame() {} });
  assert.equal(player.url(1), "/assets/media/scene/large/001.avif?v=r%201");
  assert.deepEqual([canvas.width, canvas.height], [16, 9]);
  player.destroy();
});
