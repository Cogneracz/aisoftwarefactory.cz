/**
 * The scroll math of the modules' story (assets/js/story.js), the same rules as cognera.cz's story: where the scroll is,
 * how present a chapter is at each end and which way its layers hand over.
 */

/** Share of a chapter at each end where its layers hand over to the neighbouring chapter. */
export const HANDOVER = 0.18;

/** Where `progress` (0 to 1 through the story) falls: chapter, step and the share of the chapter passed. */
export function storyPosition(progress, chapters, steps = 3) {
  if (!Number.isInteger(chapters) || chapters < 1) throw new RangeError(`Invalid chapter count: ${String(chapters)}`);
  if (!Number.isInteger(steps) || steps < 1) throw new RangeError(`Invalid step count: ${String(steps)}`);
  const p = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0;
  const scaled = p * chapters;
  const chapter = Math.min(Math.floor(scaled), chapters - 1);
  const local = scaled - chapter;
  return { chapter, beat: Math.min(Math.floor(local * steps), steps - 1), local };
}

/** How present a chapter's layers are at `local`: 1 in its middle, 0 at its ends, except at the story's own ends. */
export function presence(local, first, last) {
  const x = Number.isFinite(local) ? Math.min(Math.max(local, 0), 1) : 0;
  const enter = first ? 1 : Math.min(x / HANDOVER, 1);
  const leave = last ? 1 : Math.min((1 - x) / HANDOVER, 1);
  return Math.min(enter, leave);
}

/** A chapter's hand-over offset: +1 entering from the right, 0 on stage, -1 leaving to the left. */
export function handover(local, first, last) {
  const p = presence(local, first, last);
  if (local < 0.5) return first ? 0 : 1 - p;
  return last ? 0 : p - 1;
}

const clamp01 = (x) => Math.min(Math.max(x, 0), 1);

/**
 * Presence (0 to 1) of chapter `index` at `position` (chapters passed, 0 to `chapters`) when neighbouring chapters
 * cross-dissolve: across `span` of a chapter on each side of a boundary the outgoing chapter falls from 1 to 0 while the
 * incoming one rises from 0 to 1, so at a boundary both stand at one half and the stage is never empty. The story's
 * first chapter starts and its last ends at full presence. A chapter the story does not have is absent.
 */
export function crossPresence(position, index, chapters, span = HANDOVER) {
  if (!Number.isInteger(chapters) || chapters < 1) throw new RangeError(`Invalid chapter count: ${String(chapters)}`);
  if (!Number.isInteger(index) || index < 0 || index >= chapters) return 0;
  const g = Number.isFinite(position) ? Math.min(Math.max(position, 0), chapters) : 0;
  const rise = index === 0 ? 1 : clamp01((g - (index - span)) / (2 * span));
  const fall = index === chapters - 1 ? 1 : clamp01((index + 1 + span - g) / (2 * span));
  return Math.min(rise, fall);
}

/** Which way a dissolving chapter's layers are offset: +1 while it comes in from the right, -1 as it leaves left, 0 in full. */
export function crossOffset(position, index, chapters, span = HANDOVER) {
  const p = crossPresence(position, index, chapters, span);
  if (p >= 1 || p <= 0) return 0;
  return (Number.isFinite(position) ? position : 0) < index + 0.5 ? 1 - p : p - 1;
}

/** How far through chapter `index` the story is at `position`, 0 to 1. */
export function chapterLocal(position, index) {
  return clamp01((Number.isFinite(position) ? position : 0) - index);
}
