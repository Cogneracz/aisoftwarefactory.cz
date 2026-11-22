import { PROMO } from "../content/promo.mjs";
import { currentLocale } from "../i18n/index.mjs";
import { attrs, need, t } from "../lib/html.mjs";

export function promoPosterPreload() {
  return `<link rel="preload" as="image" href="${PROMO.poster}" fetchpriority="high">`;
}

export function promoPlayer({ heading, download }) {
  const language = currentLocale();
  const track = (code, kind, label) => `<track${attrs({ kind, srclang: code, label, src: PROMO[code], default: code === language })}>`;
  return `<video${attrs({ id: "film", class: "promo__player", "data-hero-promo": true,
    controls: true, playsinline: true, preload: "none", width: 1920, height: 1080, poster: PROMO.poster,
    "aria-label": need(heading, "The film's heading") })}>
<source src="${PROMO.video}" type="video/mp4">
${track("cs", "subtitles", "Čeština")}
${track("en", "captions", "English")}
<a href="${PROMO.video}" download>${t(need(download, "The film's download label"))}</a>
</video>`;
}
