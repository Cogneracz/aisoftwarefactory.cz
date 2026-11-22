import { PROMO } from "../content/promo.mjs";
import { currentLocale } from "../i18n/index.mjs";
import { attrs, need, t } from "../lib/html.mjs";
import { sectionHead } from "./rich.mjs";

export function promoPlayer({ heading, download }) {
  return `<section class="section promo" id="film" aria-labelledby="film-title">
<div class="container">
${sectionHead({ heading, id: "film-title" })}
<video class="promo__player" controls playsinline preload="none" width="1920" height="1080" poster="${PROMO.poster}" aria-labelledby="film-title">
<source src="${PROMO.video}" type="video/mp4">
<track${attrs({ kind: "subtitles", srclang: "cs", label: "Čeština", src: PROMO.cs, default: currentLocale() === "cs" })}>
<track kind="captions" srclang="en" label="English" src="${PROMO.en}">
<a href="${PROMO.video}" download>${t(need(download, "The film's download label"))}</a>
</video>
</div>
</section>`;
}
