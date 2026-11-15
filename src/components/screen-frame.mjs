/**
 * A real product screen in a frame: the phone master below 768 px where one exists, explicit sizes so nothing moves
 * while it loads, lazy by default and eager for a page's hero picture.
 */
import { attrs, cls, need } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { SCREEN_DIR, screen } from "../content/screens.mjs";

export function screenFrame(name, { eager = false, className } = {}) {
  const s = screen(name);
  const alt = need(content().screens[name] ?? "", `The description of the screen ${JSON.stringify(name)}`);
  const source = s.mobile
    ? `<source${attrs({ media: "(max-width: 767px)", srcset: `${SCREEN_DIR}/${s.mobile.file}`, width: s.mobile.width, height: s.mobile.height, type: "image/webp" })}>`
    : "";
  const img = `<img${attrs({
    src: `${SCREEN_DIR}/${s.file}`,
    alt,
    width: s.width,
    height: s.height,
    loading: eager ? false : "lazy",
    decoding: "async",
    fetchpriority: eager ? "high" : false,
  })}>`;
  return `<figure class="${cls("screen", className)}"><picture>${source}${img}</picture></figure>`;
}

/** The preload links of a hero's picture, for the page head. */
export function screenPreload(name) {
  const s = screen(name);
  const link = (file, media) => `<link${attrs({ rel: "preload", as: "image", type: "image/webp", href: `${SCREEN_DIR}/${file}`, media, fetchpriority: "high" })}>`;
  return s.mobile ? link(s.mobile.file, "(max-width: 767px)") + link(s.file, "(min-width: 768px)") : link(s.file, false);
}
