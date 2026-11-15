/**
 * The arithmetic of the scroll scene, without any DOM: how far a pinned stage has travelled, which frames a film time
 * falls between, the spring the film follows the scroll with, which frames to fetch and decode first, and where the
 * film comes to rest. Every function is covered by tests.
 */

/**
 * Progress (0 to 1) of a sticky stage through its section: how far the stage has travelled down the section over the
 * most it can travel. `from` is where the stage stands in the section before it pins (the height of the heading above
 * it), so 0 is the moment the stage pins. A section no taller than its stage, or invalid input, gives 0.
 */
export function pinnedProgress(sectionTop, sectionHeight, stageTop, stageHeight, from = 0) {
  if (![sectionTop, sectionHeight, stageTop, stageHeight, from].every(Number.isFinite)) return 0;
  const offset = Math.max(from, 0);
  const span = sectionHeight - stageHeight - offset;
  if (span <= 0) return 0;
  return Math.min(Math.max((stageTop - sectionTop - offset) / span, 0), 1);
}

/** Index of the caption whose start (0 to 1) was passed last, or -1 before the first one. */
export function captionAt(progress, starts) {
  if (!Number.isFinite(progress)) return -1;
  let active = -1;
  starts.forEach((start, i) => {
    if (progress >= start) active = i;
  });
  return active;
}

/** How full (0 to 1) the rail segment of chapter `index` is: from its own start to the next chapter's (the last to 1). */
export function segmentFill(progress, starts, index) {
  if (!Number.isFinite(progress) || !Number.isInteger(index) || index < 0 || index >= starts.length) return 0;
  const start = starts[index];
  const end = starts[index + 1] ?? 1;
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 0;
  if (end <= start) return progress >= start ? 1 : 0;
  return Math.min(Math.max((progress - start) / (end - start), 0), 1);
}

/**
 * Coarse-to-fine order in which to fetch frames: the current one, the last one, then one pass per stride, each pass
 * nearest first. After the first few frames the whole film can be scrubbed at a lower frame rate instead of freezing.
 * Without a final stride of 1 the order leaves frames out on purpose (a slow link). Invalid counts give [].
 */
export function progressiveLoadOrder(count, from = 0, strides = [8, 4, 2, 1]) {
  if (!Number.isFinite(count) || count < 1) return [];
  const n = Math.floor(count);
  const start = Number.isFinite(from) ? Math.min(Math.max(Math.round(from), 0), n - 1) : 0;
  const seen = new Set();
  const order = [];
  const take = (i) => {
    if (seen.has(i)) return;
    seen.add(i);
    order.push(i);
  };
  take(start);
  take(n - 1);
  for (const stride of strides) {
    if (!Number.isInteger(stride) || stride < 1) continue;
    const pass = [];
    for (let i = 0; i < n; i += stride) if (!seen.has(i)) pass.push(i);
    pass.sort((a, b) => Math.abs(a - start) - Math.abs(b - start) || a - b);
    pass.forEach(take);
  }
  return order;
}

/** Film frames two kept keyframes may be apart and still be crossfaded when a set carries no `blend` mask. */
export const MAX_BLEND_GAP = 2;

/**
 * The blend drawn between keyframes a and a + 1: `w` itself where the pair may be crossfaded, else a hard step to the
 * nearer keyframe (so a moving picture never shows twice). Out-of-range indices and non-finite weights give 0.
 */
export function pairBlend(set, a, w) {
  if (!Number.isFinite(w) || !Number.isInteger(a) || a < 0 || a >= set.frames.length - 1) return 0;
  const weight = Math.min(Math.max(w, 0), 1);
  const soft = set.blend ? set.blend[a] === "1" : set.frames[a + 1] - set.frames[a] <= MAX_BLEND_GAP;
  return soft ? weight : weight > 0.5 ? 1 : 0;
}

/** A stage no wider than 1.1 times its height gets the 4:5 cut; the styles switch on the same query. */
export const PORTRAIT_STAGE_QUERY = "(max-aspect-ratio: 11/10)";

/** Narrowest portrait stage (CSS px) that gets the 1080-wide set instead of the 720-wide one. */
export const TABLET_MIN_WIDTH = 600;

/** The frame set for a stage: "large" for landscape; for portrait "tablet" when wide and dense enough, else "small". */
export function pickScrubSet(portrait, stageWidth, dpr) {
  if (!portrait) return "large";
  if (!Number.isFinite(stageWidth) || stageWidth <= 0) return "small";
  const ratio = Number.isFinite(dpr) && dpr > 0 ? Math.min(dpr, 3) : 1;
  return stageWidth >= TABLET_MIN_WIDTH && stageWidth * ratio > 900 ? "tablet" : "small";
}

/** Film frame (0 to span) for a scroll progress (0 to 1); invalid input gives 0. */
export function filmTime(progress, span) {
  if (!Number.isFinite(progress) || !Number.isFinite(span) || span <= 0) return 0;
  return Math.min(Math.max(progress, 0), 1) * span;
}

/** Scroll progress (0 to 1) at which film frame `frame` shows, to three decimals. */
export function frameProgress(frame, span) {
  if (!Number.isFinite(frame) || !Number.isFinite(span) || span <= 0) return 0;
  return Math.round(Math.min(Math.max(frame / span, 0), 1) * 1000) / 1000;
}

/**
 * Where film time `t` falls among the kept keyframes: the indices a and b of its neighbours and the blend w from a to
 * b. Outside the film both are that end. An empty list gives -1; a non-finite t counts as the first keyframe.
 */
export function keyframeAt(frames, t) {
  const n = frames.length;
  if (n === 0) return { a: -1, b: -1, w: 0 };
  const time = Number.isFinite(t) ? t : frames[0];
  if (time <= frames[0]) return { a: 0, b: 0, w: 0 };
  if (time >= frames[n - 1]) return { a: n - 1, b: n - 1, w: 0 };
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (frames[mid] <= time) lo = mid;
    else hi = mid;
  }
  const span = frames[hi] - frames[lo];
  return { a: lo, b: hi, w: span > 0 ? (time - frames[lo]) / span : 0 };
}

/** Index of the kept keyframe closest to film time `t` (the earlier one on a tie), -1 when there is none. */
export function nearestKeyframe(frames, t) {
  if (frames.length === 0) return -1;
  const { a, b, w } = keyframeAt(frames, t);
  return w > 0.5 ? b : a;
}

/** A blend weight snapped to `steps` levels, so the canvas is redrawn only when the mix visibly changes. */
export function blendLevel(w, steps = 16) {
  if (!Number.isFinite(w) || !Number.isFinite(steps) || steps < 1) return 0;
  return Math.round(Math.min(Math.max(w, 0), 1) * steps) / steps;
}

/**
 * One step of a critically damped spring towards `target` after `dtMs` milliseconds (the exact solution, so 60 Hz and
 * 120 Hz screens move alike; longer gaps count as 100 ms). It starts from rest without a jump and never overshoots.
 * Once closer than `rest` and slow enough it lands exactly on the target. Invalid input lands on the target.
 */
export function springStep(state, target, dtMs, omega = 10, rest = 0.02) {
  if (!Number.isFinite(target)) return { x: 0, v: 0 };
  const { x, v } = state;
  if (![x, v, dtMs, omega, rest].every(Number.isFinite) || omega <= 0) return { x: target, v: 0 };
  const dt = Math.min(Math.max(dtMs, 0), 100) / 1000;
  const delta = x - target;
  const decay = Math.exp(-omega * dt);
  const nextDelta = (delta + (v + omega * delta) * dt) * decay;
  const nextV = (v - omega * (v + omega * delta) * dt) * decay;
  if (Math.abs(nextDelta) < rest && Math.abs(nextV) < rest * omega) return { x: target, v: 0 };
  return { x: target + nextDelta, v: nextV };
}

/**
 * Keyframe indices to have decoded around index `at` of `count`, nearest first: `ahead` in the direction of travel
 * and `behind` the other way, interleaved. Indices outside the film are dropped; invalid input gives [].
 */
export function decodeWindow(at, count, dir, ahead = 6, behind = 2) {
  if (![at, count, ahead, behind].every(Number.isFinite) || count < 1) return [];
  const n = Math.floor(count);
  const i = Math.min(Math.max(Math.round(at), 0), n - 1);
  const step = dir < 0 ? -1 : 1;
  const out = [i];
  for (let d = 1; d <= Math.max(ahead, behind); d++) {
    if (d <= ahead && i + step * d >= 0 && i + step * d < n) out.push(i + step * d);
    if (d <= behind && i - step * d >= 0 && i - step * d < n) out.push(i - step * d);
  }
  return out;
}

/** Address of keyframe `frame` of a set: "<base>/057.avif". */
export function keyframeUrl(base, frame, ext) {
  return `${base.replace(/\/$/, "")}/${String(Math.max(0, Math.floor(Number.isFinite(frame) ? frame : 0))).padStart(3, "0")}.${ext}`;
}

/** Share of a move the visitor must have scrolled through before letting go finishes it rather than undoes it. */
export const SETTLE_COMMIT = 0.2;

/**
 * Where the film should settle when the visitor stops scrolling at film time `t`: null when `t` is not inside a move
 * (it already rests on a stop), else the end of that move or its start. Scrolling on finishes the move once
 * SETTLE_COMMIT of it is behind; scrolling back finishes it backwards the same way; without a direction the nearer end
 * wins. Invalid input gives null (leave the scroll alone).
 */
export function settleFrame(t, dir, moves) {
  if (!Number.isFinite(t)) return null;
  const move = moves.find(([a, b]) => b > a && t > a && t < b);
  if (!move) return null;
  const [a, b] = move;
  const done = (t - a) / (b - a);
  const eps = 1e-9;
  if (dir > 0) return done >= SETTLE_COMMIT - eps ? b : a;
  if (dir < 0) return done <= 1 - SETTLE_COMMIT + eps ? a : b;
  return done < 0.5 ? a : b;
}

/** Whether a connection hint (navigator.connection) says to load less: save-data, or a 2G-class link. */
export function isSlowConnection(connection) {
  if (!connection || typeof connection !== "object") return false;
  return connection.saveData === true || /(^|-)2g$/.test(String(connection.effectiveType ?? ""));
}
