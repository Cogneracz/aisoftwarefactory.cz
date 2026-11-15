/** An ordered walk-through: two to nine numbered steps, each with a title, a sentence and the real screen of the step. */
import { need, t } from "../lib/html.mjs";
import { sectionHead } from "./rich.mjs";
import { screenFrame } from "./screen-frame.mjs";

export const STEP_RANGE = [2, 9];

export function stepSequence({ id, eyebrow, heading, lead, steps }) {
  need(id, "A step sequence's id");
  const [min, max] = STEP_RANGE;
  if (!Array.isArray(steps) || steps.length < min || steps.length > max) throw new Error(`A step sequence takes ${min} to ${max} steps, got ${Array.isArray(steps) ? steps.length : 0}`);
  const items = steps
    .map((s, i) => {
      const number = String(i + 1).padStart(2, "0");
      need(s?.title, `The title of step ${number}`);
      need(s?.body, `The body of step ${number} (${s.title})`);
      need(s?.screen, `The screen of step ${number} (${s.title})`);
      return `<li class="step reveal">
<div class="step__copy"><span class="step__number" aria-hidden="true">${number}</span><h3 class="step__title">${t(s.title)}</h3><p class="step__body">${t(s.body)}</p></div>
<div class="step__media">${screenFrame(s.screen)}</div>
</li>`;
    })
    .join("\n");
  return `<section class="section" id="${id}" aria-labelledby="${id}-title">
<div class="container">
${sectionHead({ eyebrow, heading, lead, id: `${id}-title` })}
<ol class="steps">
${items}
</ol>
</div>
</section>`;
}
