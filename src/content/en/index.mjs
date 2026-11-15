/** Everything the site says in English, in the shape of the Czech content (../cs.mjs). */
import { SITE } from "../site.mjs";
import { FILMS_EN, OBJECTS_EN, SCREENS_EN } from "./media.mjs";
import { REFERENCES_EN } from "./references.mjs";
import { STORY_EN } from "./story.mjs";
import { ACTION_EN, ASSEMBLY_EN, COGNERA_EN, FAQ_EN, FORGE_EN, HOME_EN, IMPRINT_EN, LEGAL_EN, LINE_EN, MODULES_EN, MODULES_PAGE_EN } from "./pages.mjs";

export const EN = {
  site: { name: SITE.name, statement: "Forge is the AI software factory from Cognera." },
  action: ACTION_EN,
  nav: [
    { page: "forge", label: "Forge" },
    { page: "modules", label: "Modules" },
  ],
  ui: {
    skip: "Skip to content",
    navLabel: "Main",
    menu: "Menu",
    footerLabel: "Footer",
    footerSite: "Site",
    footerModules: "Modules",
    footerCognera: "Cognera",
    home: "Factory",
    cogneraHome: "cognera.cz",
    references: "Case studies",
    privacy: "Privacy policy",
    operator: "Operator and privacy",
    tagModule: "Module",
    taglineLabel: "Principle",
    language: { short: "EN", name: "English", switchLabel: "View this page in English" },
  },
  cognera: COGNERA_EN,
  imprint: IMPRINT_EN,
  home: HOME_EN,
  line: LINE_EN,
  assembly: ASSEMBLY_EN,
  forge: FORGE_EN,
  modules: MODULES_EN,
  modulesPage: MODULES_PAGE_EN,
  story: STORY_EN,
  references: REFERENCES_EN,
  faq: FAQ_EN,
  legal: LEGAL_EN,
  screens: SCREENS_EN,
  films: FILMS_EN,
  objects: OBJECTS_EN,
};
