/**
 * The modules' story on the modules page: three of each module's published steps
 * (cognera.cz, the module's own page, word for word), in the line's order, each with its own real screen. The 3D object
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
    { title: "Výzkum v několika směrech.", body: "Úlohy běží souběžně a dají se pozastavit i nasměrovat.", screen: "bellows-step-b" },
    { title: "Citace ověřené u zdroje.", body: "Každé tvrzení vede ke zdroji, ze kterého vychází.", screen: "bellows-step-c" },
    { title: "Rozhodnutí s důvodem.", body: "Přijmout, sledovat, nebo zamítnout. Přijatý nápad se exportuje jako zadání pro Anvil.", screen: "bellows-step-e" },
  ],
  anvil: [
    { title: "Otázky s doporučením.", body: "Vyberete doporučenou nebo jinou odpověď, napíšete vlastní, nebo nejasnost s Anvilem proberete.", screen: "anvil-step-c" },
    { title: "Úprava se souhlasem.", body: "Nové znění uvidíte předem a Anvil ho zapíše až po vašem potvrzení.", screen: "anvil-step-d" },
    { title: "Připraveno pro Forge.", body: "Po novém rozboru dostane jasné zadání štítek a Forge může začít.", screen: "anvil-step-e" },
  ],
  temper: [
    { title: "Opakovatelný scénář.", body: "Z nahrávky vznikne scénář s přesnými kroky. Hesla se do něj neuloží.", screen: "temper-step-b" },
    { title: "Snímek u každého kroku.", body: "Běh končí jasným verdiktem.", screen: "temper-step-c" },
    { title: "Vizuální snímky schválí člověk.", body: "Nový vzhled stránky platí, až ho někdo potvrdí.", screen: "temper-step-e" },
  ],
  rivet: [
    { title: "Přesný plán.", body: "Plán určí verzi, prostředí a postup a po schválení se už nemění.", screen: "rivet-step-a" },
    { title: "Schválení.", body: "Produkce chce druhé potvrzení.", screen: "rivet-step-c" },
    { title: "Nasazení a ověření.", body: "Výsledek se zapíše až po kontrole skutečného prostředí.", screen: "rivet-step-d" },
  ],
  harness: [
    { title: "Popis úlohy.", body: "Forge i moduly popíšou práci stejným slovníkem.", screen: "harness-step-a" },
    { title: "Doporučení s důvodem.", body: "Harness vybere agenta a úroveň kvality a řekne proč.", screen: "harness-step-b" },
    { title: "Kontrola výsledku.", body: "Výsledek se ověří dřív, než práce pokračuje.", screen: "harness-step-c" },
  ],
  },
};
