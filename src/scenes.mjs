/** The frame manifests of the site's scroll scenes by name; the browser loads the same files (assets/js/scenes). */
import assembly from "../assets/js/scenes/assembly.js";
import lineCs from "../assets/js/scenes/line-cs.js";
import lineEn from "../assets/js/scenes/line-en.js";

export const SCENE_MANIFESTS = { assembly, "line-cs": lineCs, "line-en": lineEn };

/** A scene's manifest; throws for a name without one. */
export function sceneManifest(name) {
  if (!Object.prototype.hasOwnProperty.call(SCENE_MANIFESTS, name)) throw new Error(`Unknown scene: ${JSON.stringify(name)}`);
  return SCENE_MANIFESTS[name];
}

/** The line scene's pictures hold words, so each language has its own frames. */
export const lineSceneOf = (locale) => `line-${locale}`;
