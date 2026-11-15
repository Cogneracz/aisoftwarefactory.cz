/** The site's icons: Phosphor, regular weight (MIT, @phosphor-icons/core 2.1.1), inlined so they cost no request. */
import { attrs } from "../lib/html.mjs";

const PATHS = {
  "arrow-right": "M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z",
  "arrow-up-right": "M200,64V168a8,8,0,0,1-16,0V83.31L69.66,197.66a8,8,0,0,1-11.32-11.32L172.69,72H88a8,8,0,0,1,0-16H192A8,8,0,0,1,200,64Z",
  plus: "M224,128a8,8,0,0,1-8,8H136v80a8,8,0,0,1-16,0V136H40a8,8,0,0,1,0-16h80V40a8,8,0,0,1,16,0v80h80A8,8,0,0,1,224,128Z",
  check: "M229.66,77.66l-128,128a8,8,0,0,1-11.32,0l-56-56a8,8,0,0,1,11.32-11.32L96,188.69,218.34,66.34a8,8,0,0,1,11.32,11.32Z",
};

/** An icon by name, decorative (hidden from assistive technology); throws for a name the set does not hold. */
export function icon(name, { size = 16, className = "icon" } = {}) {
  if (!Object.prototype.hasOwnProperty.call(PATHS, name)) throw new Error(`Unknown icon: ${JSON.stringify(name)}`);
  return `<svg${attrs({ class: className, viewBox: "0 0 256 256", width: size, height: size, fill: "currentColor", "aria-hidden": "true", focusable: "false" })}><path d="${PATHS[name]}"/></svg>`;
}
