/**
 * The operator page: who runs the site and what happens to a visitor's data. Each privacy statement is either enforced
 * by the site's own tests (no cookies, no measuring, same-origin resources) or quoted from the host's documentation.
 * A paragraph is a list of plain strings and links.
 */
import { COGNERA, GITHUB_PRIVACY, PRIMARY_ACTION, imprintLine } from "./site.mjs";

export const LEGAL = {
  meta: {
    title: "Provozovatel a soukromí",
    description: "Kdo provozuje web aisoftwarefactory.cz a co se při návštěvě děje s vašimi údaji: žádné cookies, žádné měření a žádné zdroje třetích stran.",
  },
  heading: ["Provozovatel a soukromí"],
  lead: "Kdo tento web provozuje a co se při jeho návštěvě děje s vašimi údaji.",
  sections: [
    {
      id: "provozovatel",
      heading: "Provozovatel",
      paragraphs: [
        [`Web aisoftwarefactory.cz provozuje společnost ${imprintLine()}`],
        ["Napsat nám můžete ", { text: "přes formulář na cognera.cz", href: PRIMARY_ACTION.href }, "."],
      ],
    },
    {
      id: "soukromi",
      heading: "Soukromí",
      list: [
        ["Web neukládá do vašeho zařízení žádné cookies."],
        ["Neměří návštěvnost a nezobrazuje reklamu."],
        ["Písma, obrázky i skripty se načítají přímo z této domény."],
        [
          "Web běží na službě GitHub Pages. Ta při návštěvě zaznamenává IP adresu návštěvníka kvůli bezpečnosti. Podrobnosti uvádí GitHub ve svém ",
          { text: "prohlášení o ochraně soukromí", href: GITHUB_PRIVACY },
          ".",
        ],
        [
          "Formulář pro domluvení ukázky je na webu cognera.cz. Jak Cognera nakládá s údaji z formuláře, popisují její ",
          { text: "Zásady ochrany osobních údajů", href: COGNERA.privacy },
          ".",
        ],
      ],
    },
  ],
};

export const NOT_FOUND = {
  meta: { title: "Stránka nenalezena", description: "Tahle stránka na webu aisoftwarefactory.cz není. Zkuste to z úvodní stránky, ze stránky Forge nebo z přehledu modulů." },
  eyebrow: "Chyba 404",
  title: ["Tahle stránka tu není."],
  lead: ["Adresa se možná změnila, nebo v ní je překlep. Pokračovat můžete na stránku ", { text: "Forge", page: "forge" }, " nebo na ", { text: "Moduly", page: "modules" }, "."],
  action: { label: "Zpět na úvod", page: "home" },
  /** The same in the other language: GitHub Pages serves one 404 file for every address. */
  other: { lang: "en", text: ["This page is not here. Continue to the ", { text: "English home page", page: "home", locale: "en" }, "."] },
};
