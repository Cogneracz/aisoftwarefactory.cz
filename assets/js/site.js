/** The site's script: progressive enhancement only. Every page reads and works without it. */
import { initFaq } from "./faq.js";
import { initFilms } from "./film.js";
import { initLang } from "./lang.js";
import { initNav } from "./nav.js";
import { initOpening } from "./opening.js";
import { initReveal } from "./reveal.js";
import { initScene } from "./scene.js";
import { initStack } from "./stack.js";
import { initStory } from "./story.js";
import { initTagline } from "./tagline.js";

// Tells the page's inline guard that the script arrived (see src/layout.mjs).
window.__siteReady = true;

initNav();
initReveal();
initTagline();
initOpening();
initFilms();
initFaq();
initScene();
initStory();
initStack();
initLang();
