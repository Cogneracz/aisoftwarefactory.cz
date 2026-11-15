import assert from "node:assert/strict";
import { test } from "node:test";
import { HANDOVER, chapterLocal, crossOffset, crossPresence, handover, presence, storyPosition } from "../assets/js/story-math.js";

test("expected: the story splits into equal chapters of three steps", () => {
  assert.deepEqual(storyPosition(0, 5), { chapter: 0, beat: 0, local: 0 });
  assert.equal(storyPosition(0.1, 5).beat, 1);
  assert.equal(storyPosition(0.5, 5).chapter, 2);
  assert.ok(Math.abs(storyPosition(0.5, 5).local - 0.5) < 1e-9);
});

test("edge: ends and invalid progress are clamped; chapters hand over at their ends, never at the story's own", () => {
  assert.deepEqual(storyPosition(1.3, 5), { chapter: 4, beat: 2, local: 1 });
  assert.deepEqual(storyPosition(Number.NaN, 5), storyPosition(0, 5));
  assert.equal(presence(0.5, false, false), 1);
  assert.equal(presence(0, false, false), 0);
  assert.ok(Math.abs(presence(HANDOVER / 2, false, false) - 0.5) < 1e-9);
  assert.equal(presence(0, true, false), 1);
  assert.equal(handover(0, false, false), 1);
  assert.equal(handover(1, false, false), -1);
  assert.equal(handover(0.5, false, false), 0);
  assert.equal(handover(1, false, true), 0);
});

test("error: chapter and step counts that make no sense throw", () => {
  assert.throws(() => storyPosition(0.5, 0), /Invalid chapter count: 0/);
  assert.throws(() => storyPosition(0.5, 5, 1.5), /Invalid step count: 1.5/);
});

test("edge: a story of two steps per chapter (the line's on the home page) changes step in the middle of a chapter", () => {
  // Five chapters of two steps: a tenth of the story per step.
  assert.deepEqual([0.01, 0.09, 0.11, 0.19, 0.21].map((p) => storyPosition(p, 5, 2).beat), [0, 0, 1, 1, 0]);
  assert.deepEqual([0.21, 0.55, 0.99].map((p) => storyPosition(p, 5, 2).chapter), [1, 2, 4]);
  assert.deepEqual(storyPosition(1, 5, 2), { chapter: 4, beat: 1, local: 1 });
  assert.throws(() => storyPosition(0.5, 5, 0), /Invalid step count/);
});

test("expected: neighbouring chapters cross-dissolve, so at a boundary both stand at one half and the stage is never empty", () => {
  // Six chapters; the boundary between chapter 2 and 3 is at position 3.
  assert.ok(Math.abs(crossPresence(3, 2, 6) - 0.5) < 1e-9);
  assert.ok(Math.abs(crossPresence(3, 3, 6) - 0.5) < 1e-9);
  assert.equal(crossPresence(2.5, 2, 6), 1);
  for (const g of [2.8, 2.9, 3, 3.1, 3.2]) {
    const sum = crossPresence(g, 2, 6) + crossPresence(g, 3, 6);
    assert.ok(Math.abs(sum - 1) < 1e-9, `the two add up to one at ${g}`);
  }
  // The incoming chapter comes from the right, the outgoing leaves to the left.
  assert.ok(crossOffset(2.9, 3, 6) > 0);
  assert.ok(crossOffset(3.1, 2, 6) < 0);
  assert.equal(crossOffset(2.5, 2, 6), 0);
  assert.equal(chapterLocal(3.25, 3), 0.25);
});

test("edge: the story's first chapter starts and its last ends in full; outside the window a chapter is absent", () => {
  assert.equal(crossPresence(0, 0, 6), 1);
  assert.equal(crossPresence(6, 5, 6), 1);
  assert.equal(crossPresence(1.5, 3, 6), 0);
  assert.equal(crossPresence(4.5, 3, 6), 0);
  assert.equal(crossPresence(3 - HANDOVER, 3, 6), 0);
  assert.equal(crossPresence(3 + HANDOVER, 2, 6), 0);
  assert.equal(chapterLocal(1, 3), 0);
  assert.equal(chapterLocal(9, 3), 1);
});

test("error: a chapter the story does not have is absent; an impossible story throws; a position that is no number counts as the start", () => {
  assert.equal(crossPresence(3, 7, 6), 0);
  assert.equal(crossPresence(3, -1, 6), 0);
  assert.equal(crossPresence(3, 1.5, 6), 0);
  assert.throws(() => crossPresence(1, 0, 0), /Invalid chapter count/);
  assert.equal(crossPresence(Number.NaN, 0, 6), 1);
  assert.equal(crossPresence(Number.NaN, 1, 6), 0);
  assert.equal(crossOffset(Number.NaN, 1, 6), 0);
});

test("expected: on touch screens the story's spring follows twice as fast as for a wheel", async () => {
  const { readFile } = await import("node:fs/promises");
  const script = await readFile(new URL("../assets/js/story.js", import.meta.url), "utf8");
  assert.match(script, /const OMEGA = 15;/);
  assert.match(script, /const OMEGA_TOUCH = 30;/);
  assert.match(script, /matchMedia\("\(pointer: coarse\)"\)/);
  assert.match(script, /touch\.matches \? OMEGA_TOUCH : OMEGA/);
});
