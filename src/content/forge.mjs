/**
 * The Forge page: what the core does, its six steps from a brief to a merge, and how it works. Every sentence is one
 * cognera.cz uses for Forge.
 */
export const FORGE = {
  meta: {
    title: "Forge: od zadání k prověřenému kódu",
    description: "Forge je jádro AI továrny na software. Podle zadání připraví plán, napíše kód i testy a sám si práci zkontroluje. Změny slučuje vždy člověk.",
  },
  hero: {
    mark: "forge",
    eyebrow: "Forge",
    tag: "Jádro",
    title: ["Od zadání k hotovému,", "prověřenému kódu."],
    lead: "Napíšete zadání. Forge podle něj připraví plán, napíše kód i testy a sám si práci zkontroluje. Kde je potřeba rozhodnout, počká na vás.",
    proof: "Změny slučuje vždy člověk.",
    film: "forge",
  },
  steps: {
    eyebrow: "Postup",
    heading: "Od zadání po sloučení.",
    items: [
      { title: "Zadání.", body: "Úloha přijde jako požadavek nebo návrh změny v repozitáři, případně už ujasněná v Anvilu.", screen: "forge-step-a" },
      { title: "Plán ke schválení.", body: "Forge rozepíše postup a počká, až ho schválíte.", screen: "forge-plan" },
      { title: "Kód a testy.", body: "Podle plánu napíše kód i testy, a než změny uloží, sám si práci zkontroluje.", screen: "forge-step-c" },
      { title: "Kontrola kódu.", body: "Připomínky z kontroly zapracuje a opravy znovu ověří.", screen: "forge-review" },
      { title: "Ověření v prohlížeči.", body: "Hotovou změnu proklikne Temper.", screen: "forge-step-e" },
      { title: "Sloučení.", body: "Změny sloučí až člověk tlačítkem „Merge“.", screen: "forge-merge" },
    ],
  },
  work: {
    eyebrow: "Práce",
    heading: "Jak Forge pracuje.",
    items: [
      { title: "Schválíte i z telefonu.", body: "Úloha čeká na schválení a plán vidíte rozepsaný do kroků i v telefonu." },
      { title: "Od opravy po celý backlog.", body: "Navazující úlohy běží jako dávka nebo řetězec." },
      { title: "Dokumentace drží krok.", body: "Dokumentace se aktualizuje spolu s kódem." },
      { title: "Slučuje vždy člověk.", body: "Bez schválení se nic nesloučí." },
    ],
  },
  closing: { heading: "Ukažte nám svůj backlog.", lead: "Ukázku domluvíte přes formulář na cognera.cz." },
};
