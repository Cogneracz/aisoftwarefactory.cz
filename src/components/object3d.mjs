/** A product's 3D object as a picture. */
import { attrs, cls, need } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { object3d as objectOf } from "../content/media3d.mjs";

export function object3d(slug, { className, eager = false, decorative = false } = {}) {
  const o = objectOf(slug);
  return `<img${attrs({ class: cls("object3d", className), src: o.src, alt: decorative ? "" : need(content().objects[slug] ?? "", `The description of the 3D object ${JSON.stringify(slug)}`), "aria-hidden": decorative ? "true" : false, width: o.width, height: o.height, loading: eager ? false : "lazy", decoding: "async" })}>`;
}
