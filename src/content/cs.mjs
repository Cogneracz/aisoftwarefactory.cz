/** Everything the site says in Czech, in one object of the shape every language has (see ./index.mjs). */
import { FAQ } from "./faq.mjs";
import { FORGE } from "./forge.mjs";
import { HOME } from "./home.mjs";
import { LEGAL, NOT_FOUND } from "./legal.mjs";
import { LINE } from "./line.mjs";
import { FILMS, OBJECTS } from "./media3d.mjs";
import { MODULES, MODULES_PAGE, MODULE_TAG } from "./modules.mjs";
import { REFERENCES } from "./references.mjs";
import { STORY } from "./story.mjs";
import { ASSEMBLY } from "./scene.mjs";
import { SCREENS } from "./screens.mjs";
import { COGNERA, PRIMARY_ACTION, SITE, imprintLine } from "./site.mjs";

export const CS = {
  site: { name: SITE.name, statement: SITE.statement },
  action: PRIMARY_ACTION,
  nav: [
    { page: "forge", label: "Forge" },
    { page: "modules", label: "Moduly" },
  ],
  ui: {
    skip: "Přeskočit na obsah",
    navLabel: "Hlavní",
    menu: "Menu",
    footerLabel: "Patička",
    footerSite: "Web",
    footerModules: "Moduly",
    footerCognera: "Cognera",
    home: "Továrna",
    cogneraHome: "cognera.cz",
    references: "Reference",
    privacy: "Zásady ochrany osobních údajů",
    operator: "Provozovatel a soukromí",
    consent: {
      title: "Měření návštěvnosti",
      message: "Můžeme pomocí Microsoft Clarity sledovat kliknutí, posouvání stránek a přehrávat průběh návštěv? Měření používá cookies.",
      accept: "Povolit měření",
      decline: "Odmítnout",
      details: "Podrobnosti o soukromí",
      settings: "Nastavení měření",
    },
    tagModule: MODULE_TAG,
    taglineLabel: "Princip",
    /** The link to this language from a page in another one. */
    language: { short: "CS", name: "Česky", switchLabel: "Zobrazit tuto stránku česky" },
  },
  cognera: COGNERA,
  imprint: imprintLine(),
  home: HOME,
  line: LINE,
  assembly: ASSEMBLY,
  forge: FORGE,
  modules: MODULES,
  modulesPage: MODULES_PAGE,
  story: STORY,
  references: REFERENCES,
  faq: FAQ,
  legal: LEGAL,
  notFound: NOT_FOUND,
  screens: Object.fromEntries(Object.entries(SCREENS).map(([name, s]) => [name, s.alt])),
  films: Object.fromEntries(Object.entries(FILMS).map(([name, f]) => [name, f.alt])),
  objects: OBJECTS,
};
