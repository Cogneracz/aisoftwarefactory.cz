/**
 * The factory's line: five steps from an idea to a deployment, the decision a person makes in each, and the base
 * under all of them. It is the content of the line scene, where the camera travels from step to step: `label`
 * describes the scene, `stills` each stop's picture. The sentences are the ones cognera.cz uses.
 */
export const LINE_ORDER = ["bellows", "anvil", "forge", "temper", "rivet"];

/**
 * The line's story on the home page (components/module-story.mjs): which two of each part's published steps a chapter
 * shows, by their position in the part's steps (the modules' in ./story.mjs, Forge's in ./forge.mjs). Each pair of the
 * five steps ends on the step where a person decides; the base, last, shows its recommendation and its check (its first
 * step's wording is still open with the owner).
 */
export const LINE_STORY_STEPS = {
  bellows: [1, 2],
  anvil: [0, 1],
  forge: [1, 3],
  temper: [1, 2],
  rivet: [1, 2],
  harness: [1, 2],
};

export const LINE = {
  eyebrow: "Linka",
  heading: "Pět kroků. Pět rozhodnutí.",
  lead: "Práce projde pěti kroky od nápadu po nasazení. V každém z nich rozhodujete vy.",
  label:
    "Kamera projíždí linkou Forge. U každého předmětu se za ním zvedne skutečná obrazovka: Bellows, Anvil, Forge, Temper a Rivet. Na konci stojí všech pět na společném základu Cognera Harness.",
  steps: [
    { slug: "bellows", name: "Bellows", role: "Průzkum", does: "Najde, co stojí za to postavit.", decides: "O nápadu vždy rozhodne člověk." },
    { slug: "anvil", name: "Anvil", role: "Zadání", does: "Ujasní zadání dřív, než vznikne kód.", decides: "Zadání změní jen s vaším souhlasem." },
    { slug: "forge", name: "Forge", role: "Vývoj", does: "Ze zadání udělá hotový, prověřený kód.", decides: "Bez schválení se nic nesloučí." },
    { slug: "temper", name: "Temper", role: "Ověření", does: "Ověří, že aplikace funguje.", decides: "Vizuální změny schvaluje člověk." },
    { slug: "rivet", name: "Rivet", role: "Nasazení", does: "Nasadí jen ověřenou a schválenou verzi.", decides: "Produkce chce druhé potvrzení." },
  ],
  base: { slug: "harness", name: "Cognera Harness", role: "Základ", does: "Pro každou úlohu doporučí vhodného agenta." },
  /** What each stop's still shows: the five steps in order, then the whole line. */
  stills: [
    "Měchy Bellows a za nimi obrazovka Důkazy z internetu se třemi ověřenými zdroji.",
    "Kovadlina Anvil a za ní obrazovka se dvěma zodpovězenými otázkami k exportu faktur.",
    "Dlaždice Forge na ocelové liště a za nimi plán s odškrtanými úkoly.",
    "Dlaždice Temper a za nimi scénář měsíčního exportu, který v prohlížeči prošel.",
    "Nýt Rivet na deskách a za ním obrazovka nasazení se stavem Ověřeno.",
    "Všech pět předmětů v řadě na společné skleněné desce Cognera Harness.",
  ],
};
