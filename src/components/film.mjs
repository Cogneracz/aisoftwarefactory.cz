/**
 * A 3D film. In the page it is a still picture (so it shows without scripts and for visitors who prefer no motion);
 * assets/js/film.js joins it with a muted video that plays while it is on screen. `cut` "auto" shows the 16:9 cut from
 * 768 px and the 4:5 one below; "small" keeps the 4:5 cut at every width (beside a column of text).
 */
import { attrs, cls, need } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { film as filmOf } from "../content/media3d.mjs";

const CUTS = ["auto", "small"];

export function film(name, { cut = "auto", eager = false, className } = {}) {
  if (!CUTS.includes(cut)) throw new Error(`Unknown film cut: ${JSON.stringify(cut)}`);
  const f = filmOf(name);
  const alt = need(content().films[name] ?? "", `The description of the film ${JSON.stringify(name)}`);
  const loading = { loading: eager ? false : "lazy", decoding: "async", fetchpriority: eager ? "high" : false };
  const picture = (kind, variant) => {
    const main = cut === "small" ? f.small : f.large;
    const source = cut === "auto" ? `<source${attrs({ media: "(max-width: 767px)", srcset: f.small[variant], width: f.small.width, height: f.small.height })}>` : "";
    return `<picture class="film__picture film__picture--${kind}">${source}<img${attrs({ src: main[variant], alt, width: main.width, height: main.height, ...loading })}></picture>`;
  };
  // A film that plays once starts from its first frame when it can play and shows its last frame when it cannot.
  const start = f.loop ? "" : picture("start", "start");
  return `<figure${attrs({
    class: cls("film", `film--${cut}`, f.loop && "film--loop", className),
    "data-film": true,
    "data-film-large": f.large.video,
    "data-film-small": f.small.video,
    "data-film-cut": cut === "small" ? "small" : false,
    "data-film-loop": f.loop,
  })}>${picture("still", "still")}${start}</figure>`;
}

/** The preload links of a hero film's first picture, for the page head. */
export function filmPreload(name, { cut = "auto" } = {}) {
  const f = filmOf(name);
  const link = (href, media) => `<link${attrs({ rel: "preload", as: "image", href, media, fetchpriority: "high" })}>`;
  return cut === "small" ? link(f.small.start, false) : link(f.small.start, "(max-width: 767px)") + link(f.large.start, "(min-width: 768px)");
}
