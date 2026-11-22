/** Short captions for the real product screens in each logo chapter. */
export const STORY_ORDER = ["bellows", "anvil", "temper", "rivet", "harness"];

/** Source library for the archived 3D scenes, checked by the build. */
export const STORY_MEDIA_BASE = "/assets/media/story/";

export const STORY_MEDIA = [
  "models/anvil.glb",
  "models/coals.glb",
  "models/hammer.glb",
  "models/tongs.glb",
  ...["brushed/grain", "brushed/normal", "brushed/rough", "leather/color", "leather/normal", "leather/rough", "scratched/normal", "scratched/rough", "walnut/color", "walnut/normal", "walnut/rough"].map((f) => `promo/tex/${f}.jpg`),
].map((file) => `${STORY_MEDIA_BASE}${file}`);

/** Published story scripts, including the archived canvas bundle. */
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
