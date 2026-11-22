/**
 * The modules' story on the modules page: short captions for each published product screen. The 3D object
 * of each chapter is the module's film scene, drawn live by assets/js/story-canvas.js; its files are listed here so the
 * build checks they are on disk.
 */
export const STORY_ORDER = ["bellows", "anvil", "temper", "rivet", "harness"];

/** Where the story canvas finds the scenes' models and textures. */
export const STORY_MEDIA_BASE = "/assets/media/story/";

export const STORY_MEDIA = [
  "models/anvil.glb",
  "models/coals.glb",
  "models/hammer.glb",
  "models/tongs.glb",
  ...["brushed/grain", "brushed/normal", "brushed/rough", "leather/color", "leather/normal", "leather/rough", "scratched/normal", "scratched/rough", "walnut/color", "walnut/normal", "walnut/rough"].map((f) => `promo/tex/${f}.jpg`),
].map((file) => `${STORY_MEDIA_BASE}${file}`);

/** The story's own script and the canvas it loads when the section is a screen away. */
export const STORY_SCRIPTS = ["/assets/js/story.js", "/assets/js/story-math.js", "/assets/js/story-canvas.js"];

export const STORY = {
  steps: {
    bellows: [
      { title: "Směry průzkumu", screen: "bellows-step-b" },
      { title: "Ověřené zdroje", screen: "bellows-step-c" },
      { title: "Výběr nápadu", screen: "bellows-step-e" },
    ],
    anvil: [
      { title: "Otevřené otázky", screen: "anvil-step-c" },
      { title: "Návrh změn", screen: "anvil-step-d" },
      { title: "Zadání pro Forge", screen: "anvil-step-e" },
    ],
    forge: [
      { title: "Plán práce", screen: "forge-plan" },
      { title: "Kontrola kódu", screen: "forge-review" },
    ],
    temper: [
      { title: "Testovací scénář", screen: "temper-step-b" },
      { title: "Průběh testu", screen: "temper-step-c" },
      { title: "Porovnání snímků", screen: "temper-step-e" },
    ],
    rivet: [
      { title: "Plán nasazení", screen: "rivet-step-a" },
      { title: "Schválení verze", screen: "rivet-step-c" },
      { title: "Kontrola po nasazení", screen: "rivet-step-d" },
    ],
    harness: [
      { title: "Popis úlohy", screen: "harness-step-a" },
      { title: "Doporučený agent", screen: "harness-step-b" },
      { title: "Kontrola výsledku", screen: "harness-step-c" },
    ],
  },
};
