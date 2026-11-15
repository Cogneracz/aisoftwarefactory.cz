/**
 * A scroll scene: a 3D film drawn on a pinned canvas in step with the scroll (assets/js/scene.js), with one caption
 * per stop whose words rise one after another, and a chapter rail. The site has two: the assembly (Forge and its
 * modules) and the line (the camera travelling along the five steps). Without scripts, with reduced motion or
 * save-data the stops are shown as stills with their captions.
 */
import { attrs, cls, esc, need, t } from "../lib/html.mjs";
import { NBSP, typo } from "../lib/typo.mjs";
import { icon } from "./icons.mjs";
import { arrowLabel, hrefOf, rich } from "./rich.mjs";

/** A caption as rising units: the name, then each word of the sentence (a one-letter word stays with the next one). */
export function captionUnits(name, title) {
  return [`${name}.`, ...typo(title).split(" ").filter((word) => word.length > 0)];
}

const words = (name, title) =>
  captionUnits(name, title)
    .map((unit, k) => `<span class="${cls("scene__w", k === 0 && "is-lead")}" style="--k:${k}"><span>${esc(unit).replaceAll(NBSP, "&nbsp;")}</span></span>`)
    .join(" ");

/**
 * `scene` names the frame manifest the script loads (assets/js/scenes/<scene>.js); `manifest` is that manifest, passed
 * in so the markup and the player read the same numbers; `captions` are the stops in order ({ name, title, alt }).
 * With a `heading` the scene opens with its own heading block; without one (under a page's hero) it starts with the
 * stage and takes `name` as its accessible name.
 */
export function scrollScene({ id, scene, eyebrow, heading, lead, label, name, captions, manifest, link }) {
  if (typeof scene !== "string" || !/^[a-z]+(-[a-z]+)*$/.test(scene)) throw new Error(`Not a scene name: ${JSON.stringify(scene)}`);
  need(id, "The scene's id");
  need(label, "The scene's description");
  // Under a page's own heading the scene has none; it is then named for assistive technology by `name`.
  if (!heading) need(name, "The scene's heading or name");
  const { span, captionFrames, revision, sets, stills: stillDir } = manifest ?? {};
  if (!Array.isArray(captions) || !Array.isArray(captionFrames) || captions.length !== captionFrames.length) {
    throw new Error(`The scene needs one caption per stop: ${captionFrames?.length ?? 0} stops, ${Array.isArray(captions) ? captions.length : 0} captions`);
  }
  if (!Number.isFinite(span) || span <= 0 || !revision || !sets?.large || !stillDir) throw new Error("The scene needs its frame manifest");
  captions.forEach((c, k) => {
    for (const key of ["name", "title", "alt"]) need(c?.[key], `The ${key} of stop ${k + 1}`);
  });
  const at = (k) => Math.round((captionFrames[k] / span) * 1000) / 1000;
  const v = encodeURIComponent(revision);

  const live = captions
    .map(
      (c, k) =>
        `<li${attrs({ class: cls("scene__caption", k === 0 ? "is-active" : "is-next"), "data-at": at(k), "aria-current": k === 0 ? "step" : false, "aria-hidden": k === 0 ? false : "true" })}><p class="scene__line">${words(c.name, c.title)}</p></li>`,
    )
    .join("");
  const rail = captions.map((c, k) => `<span class="${cls("scene__seg", k === 0 && "is-active")}"><i></i><b>${t(c.name)}</b></span>`).join("");
  const stills = captions
    .map(
      (c, k) => `<li class="scene__step"><picture>
<source media="(max-width: 767px)" type="image/avif" srcset="${stillDir}/small-${k + 1}.avif?v=${v}" width="720" height="720">
<source media="(max-width: 767px)" type="image/webp" srcset="${stillDir}/small-${k + 1}.webp?v=${v}" width="720" height="720">
<source type="image/avif" srcset="${stillDir}/large-${k + 1}.avif?v=${v}" width="960" height="540">
<img${attrs({ src: `${stillDir}/large-${k + 1}.webp?v=${v}`, alt: c.alt, width: 960, height: 540, loading: "lazy", decoding: "async" })}>
</picture><p class="scene__step-text"><span>${t(c.name)}.</span> ${t(c.title)}</p></li>`,
    )
    .join("\n");

  const intro = heading
    ? `<div class="container scene__intro">
${eyebrow ? `<p class="eyebrow">${t(eyebrow)}</p>` : ""}
<h2 class="section__title" id="${id}-title">${t(heading)}</h2>
${lead ? `<p class="section__lead">${rich(lead)}</p>` : ""}
</div>
`
    : "";
  return `<section${attrs({ class: "scene", id, "aria-labelledby": heading ? `${id}-title` : false, "aria-label": heading ? false : name, "data-scene": scene })}>
${intro}
<div class="scene__sticky">
<div class="scene__stage">
<div class="scene__frame">
<canvas${attrs({ class: "scene__canvas", width: sets.large.width, height: sets.large.height, role: "img", "aria-label": label })}></canvas>
<ol class="scene__captions">${live}</ol>
</div>
<div class="scene__rail" aria-hidden="true">${rail}</div>
</div>
</div>
<ol class="container scene__steps">
${stills}
</ol>
</section>${link ? `\n<div class="scene-more"><p class="container"><a class="link link--more" href="${t(hrefOf(link))}">${arrowLabel(link.label, icon("arrow-right", { size: 14 }))}</a></p></div>` : ""}`;
}
