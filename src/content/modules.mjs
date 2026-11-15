/**
 * Forge's five modules in the family's order: the line's order, the base last. `line` is the one sentence of a card;
 * `headline`, `statement` and `guarantees` tell the module's story in its section. Every sentence is one cognera.cz
 * uses for that module.
 */
export const MODULE_ORDER = ["bellows", "anvil", "temper", "rivet", "harness"];

export const MODULE_TAG = "Modul";

export const MODULES = [
  {
    slug: "bellows",
    name: "Bellows",
    role: "Průzkum",
    line: "Najde, co stojí za to postavit.",
    headline: "Ověří, co má smysl postavit.",
    statement: "Bellows hledá, co stojí za to postavit. Nápady podloží ověřenými zdroji, a když nic nenajde, řekne to na rovinu.",
    guarantees: ["Každé tvrzení má zdroj.", "Nula příležitostí je platný výsledek.", "O nápadu vždy rozhodne člověk."],
    screen: "bellows-step-c",
  },
  {
    slug: "anvil",
    name: "Anvil",
    role: "Zadání",
    line: "Ujasní zadání dřív, než vznikne kód.",
    headline: "Nejdřív otázky. Potom kód.",
    statement:
      "Anvil přečte zadání a porovná ho se skutečným kódem projektu. Kde něco chybí nebo si zadání odporuje, položí otázku a nabídne odpověď. Zadání upraví až s vaším souhlasem.",
    guarantees: ["Ke každé nejasnosti otázka.", "Anvil nepíše kód ani nespouští úlohy.", "Zadání změní jen s vaším souhlasem."],
    screen: "anvil-step-c",
  },
  {
    slug: "temper",
    name: "Temper",
    role: "Ověření",
    line: "Ověří, že aplikace funguje.",
    headline: "Co test viděl, uvidíte i vy.",
    statement:
      "Temper projde vaši aplikaci jako člověk, klik po kliku ve skutečném prohlížeči. Když se rozhraní změní, test se sám přizpůsobí. Na konci víte, jestli aplikace funguje.",
    guarantees: ["Snímek u každého kroku.", "Vizuální změny schvaluje člověk.", "Přístupové údaje do scénáře nepatří."],
    screen: "temper-step-c",
  },
  {
    slug: "rivet",
    name: "Rivet",
    role: "Nasazení",
    line: "Nasazení pod kontrolou.",
    headline: "Poběží přesně to, co jste schválili.",
    statement: "Rivet nasadí jen to, co prošlo ověřením a co schválil člověk. Hotovo je teprve ve chvíli, kdy Rivet zkontroluje i živé prostředí.",
    guarantees: ["Produkce chce druhé potvrzení.", "Nejistý výsledek se nevydává za úspěch.", "Dvě nasazení do jednoho prostředí neběží souběžně."],
    screen: "rivet-step-d",
  },
  {
    slug: "harness",
    name: "Cognera Harness",
    role: "Základ",
    line: "Jeden jazyk pro všechny agenty.",
    headline: "Společný základ pro Forge i moduly.",
    statement: "Cognera Harness je základ, na kterém stojí Forge i ostatní moduly. Pro každou úlohu doporučí vhodného agenta a kvalitu nesníží bez upozornění.",
    guarantees: ["Agenta můžete vždy určit sami.", "Každé rozhodnutí se dá zpětně vysvětlit."],
    screen: "harness-step-b",
  },
];

export const MODULES_PAGE = {
  meta: {
    title: "Moduly Forge: od průzkumu po nasazení",
    description: "Bellows, Anvil, Temper, Rivet a Cognera Harness: pět modulů, které k Forge přidávají průzkum, zadání, ověření, nasazení a společný základ.",
  },
  hero: {
    eyebrow: "Moduly",
    title: ["Jedno jádro.", "Pět modulů."],
    /** `{forge}` becomes a link to the Forge page. */
    lead: ["Moduly přidávají k ", { text: "Forge", page: "forge" }, " průzkum, zadání, ověření a nasazení. Všechny stojí na společném základu."],
  },
  indexLabel: "Moduly na této stránce",
  moreLabel: (name) => `Více o modulu ${name} na cognera.cz`,
  closing: { heading: "Celá továrna mluví jedním jazykem.", lead: "Ukázku domluvíte přes formulář na cognera.cz." },
};
