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
