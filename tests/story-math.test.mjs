import assert from "node:assert/strict";
import { test } from "node:test";
import { HANDOVER, handover, presence, storyPosition } from "../assets/js/story-math.js";

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
