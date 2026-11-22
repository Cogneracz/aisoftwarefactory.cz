/**
 * The site's pages in English, in the shape of their Czech counterparts (../home.mjs, ../line.mjs, ../scene.mjs,
 * ../forge.mjs, ../modules.mjs, ../faq.mjs, ../legal.mjs). Slugs, screens and films are the same as in Czech.
 * The sentences are the English ones cognera.cz uses for the same Czech sentences.
 */
import { GITHUB_PRIVACY } from "../site.mjs";

export const ACTION_EN = { label: "Book a demo", href: "https://cognera.cz/en#contact-form" };

export const COGNERA_EN = {
  home: "https://cognera.cz/en",
  references: "https://cognera.cz/en/references",
  privacy: "https://cognera.cz/en/privacy",
  product: (slug) => `https://cognera.cz/en/products/${slug}`,
  reference: (slug) => `https://cognera.cz/en/references/${slug}`,
};

export const IMPRINT_EN =
  "Cognera s.r.o., Panská 571, 391 55 Chýnov, company ID (IČO) 23743514, VAT ID (DIČ) CZ23743514. The company is registered in the commercial register kept by the Regional Court in České Budějovice, section C, insert 35720.";

export const HOME_EN = {
  meta: {
    title: "AI software factory | Forge by Cognera",
    description: "Forge is the AI software factory from Cognera. It takes a spec to finished, verified code, and modules add research, verification, and deployment. You decide.",
  },
  hero: {
    title: ["The AI software factory", "where you decide."],
    lead: "Forge takes a spec to finished, verified code. Its modules add research, specs, verification, and deployment.",
    proof: "Forge was made at Cognera, and we use it in our own work.",
    film: "factory",
  },
  promo: { heading: "Forge in one minute.", watch: "Watch the film", download: "Download the film" },
  tagline: ["Agents handle the routine work.", "Senior engineers watch over the architecture.", "Where a decision is needed, the factory waits for a person."],
  proof: {
    eyebrow: "At Cognera",
    heading: "A factory we work in ourselves.",
    body: "Forge was made in our workshop, and we use it for our own work. Agents write the code, and senior engineers decide on the architecture.",
    link: { label: "Cognera case studies", cognera: "references" },
  },
  faqHeading: "Common questions",
  closing: { heading: "Show us your backlog.", lead: "You can book a demo through the form on cognera.cz." },
};

export const LINE_EN = {
  eyebrow: "Line",
  heading: "Five steps. Five decisions.",
  lead: "Work passes through five steps from idea to deployment. In each of them, you decide.",
  label:
    "The camera moves along the Forge line. Behind each object, the real screen rises: Bellows, Anvil, Forge, Temper, and Rivet. At the end, all five stand on the shared foundation of Cognera Harness.",
  steps: [
    { slug: "bellows", name: "Bellows", role: "Research", does: "Finds what’s worth building.", decides: "A person always decides on an idea." },
    { slug: "anvil", name: "Anvil", role: "Spec", does: "Clarifies the spec before any code is written.", decides: "It changes a spec only with your consent." },
    { slug: "forge", name: "Forge", role: "Build", does: "Turns a spec into finished, verified code.", decides: "Nothing is merged without approval." },
    { slug: "temper", name: "Temper", role: "Verify", does: "Verifies that your app works.", decides: "People approve visual changes." },
    { slug: "rivet", name: "Rivet", role: "Deploy", does: "Deploys only a verified, approved version.", decides: "Production needs a second confirmation." },
  ],
  base: { slug: "harness", name: "Cognera Harness", role: "Foundation", does: "Recommends the right agent for each task." },
  stills: [
    "The bellows, and behind them a screen of evidence from the web with three verified sources.",
    "The anvil, and behind it a screen with two answered questions about an invoice export.",
    "Forge tiles on a steel rail, and behind them a plan with its tasks checked off.",
    "Temper tiles, and behind them a monthly export scenario that passed in the browser.",
    "The rivet on the plates, and behind it a deployment screen with the status Verified.",
    "All five objects in a row on the shared glass pane of Cognera Harness.",
  ],
};

export const ASSEMBLY_EN = {
  eyebrow: "Modules",
  heading: "One core. Five modules.",
  lead: "Forge is the core of the factory. Its modules add research, specs, verification, and deployment, and they all stand on a shared foundation.",
  label:
    "Forge stands alone on its piece of a glass bench. As the page scrolls, Anvil, Temper, Bellows, and Rivet arrive one by one, each with its piece of the bench. At the end, the whole line stands on its shared foundation.",
  stills: [
    "The Forge mark above a glowing bar, alone on its piece of the glass bench.",
    "The anvil for Anvil now stands to the left of Forge.",
    "The Temper mark now stands to the right of Forge.",
    "The bellows for Bellows now stand at the left end of the line.",
    "The rivet for Rivet now stands at the right end of the line.",
    "The whole line on its shared glass bench: the bellows, the anvil, the Forge mark, the Temper mark, and the rivet.",
  ],
  link: { label: "All modules", page: "modules" },
};

export const FORGE_EN = {
  meta: {
    title: "Forge: from spec to verified code",
    description: "Forge is the core of the AI software factory. It turns a spec into a plan, writes the code and the tests, and checks its own work. A person always merges.",
  },
  hero: {
    mark: "forge",
    eyebrow: "Forge",
    tag: "Core",
    title: ["From spec to finished,", "verified code."],
    lead: "You write the spec. Forge turns it into a plan, writes the code and the tests, and checks its own work. Where a decision is needed, it waits for you.",
    proof: "A person always merges.",
    film: "forge",
  },
  steps: {
    eyebrow: "Process",
    heading: "From spec to merge.",
    items: [
      { title: "The spec.", body: "A task arrives as a request or a proposed change in the repository, possibly already clarified in Anvil.", screen: "forge-step-a" },
      { title: "A plan for approval.", body: "Forge breaks down the approach and waits for your approval.", screen: "forge-plan" },
      { title: "Code and tests.", body: "It writes the code and the tests from the plan, and checks its own work before saving the changes.", screen: "forge-step-c" },
      { title: "Code review.", body: "It addresses the review comments and verifies the fixes again.", screen: "forge-review" },
      { title: "Browser verification.", body: "Temper clicks through the finished change.", screen: "forge-step-e" },
      { title: "Merge.", body: "Only a person merges the changes, with the “Merge” button.", screen: "forge-merge" },
    ],
  },
  work: {
    eyebrow: "Work",
    heading: "How Forge works.",
    items: [
      { title: "Approve on a phone too.", body: "A task waits for approval, and you see its plan broken down into steps on a phone as well." },
      { title: "A fix or a whole backlog.", body: "Linked tasks run as a batch or a chain." },
      { title: "Documentation keeps pace.", body: "Documentation is updated along with the code." },
      { title: "A person always merges.", body: "Nothing is merged without approval." },
    ],
  },
  closing: { heading: "Show us your backlog.", lead: "You can book a demo through the form on cognera.cz." },
};

export const MODULES_EN = [
  {
    slug: "bellows",
    name: "Bellows",
    role: "Research",
    line: "Finds what’s worth building.",
    headline: "Checks what makes sense to build.",
    statement: "Bellows looks for what’s worth building. It backs ideas with verified sources, and when it finds nothing, it says so plainly.",
    guarantees: ["Every claim has a source.", "Zero opportunities is a valid result.", "A person always decides on an idea."],
    screen: "bellows-step-c",
  },
  {
    slug: "anvil",
    name: "Anvil",
    role: "Spec",
    line: "Clarifies the spec before any code is written.",
    headline: "Questions first. Then code.",
    statement:
      "Anvil reads the spec and compares it with the actual code of the project. Where something is missing or the spec contradicts itself, it asks a question and offers an answer. It changes the spec only with your consent.",
    guarantees: ["A question for every unclear point.", "Anvil doesn’t write code or start tasks.", "It changes a spec only with your consent."],
    screen: "anvil-step-c",
  },
  {
    slug: "temper",
    name: "Temper",
    role: "Verify",
    line: "Verifies that your app works.",
    headline: "What the test saw, you see too.",
    statement: "Temper goes through your app like a person, click by click in a real browser. When the interface changes, the test adapts on its own. At the end, you know whether the app works.",
    guarantees: ["A screenshot per step.", "People approve visual changes.", "Credentials don’t belong in a scenario."],
    screen: "temper-step-c",
  },
  {
    slug: "rivet",
    name: "Rivet",
    role: "Deploy",
    line: "Deployment under control.",
    headline: "Exactly what you approved will run.",
    statement: "Rivet deploys only what passed verification and what a person approved. A deployment is done only once Rivet has also checked the live environment.",
    guarantees: ["Production needs a second confirmation.", "An uncertain result is not passed off as a success.", "Two deployments to the same environment never run at once."],
    screen: "rivet-step-d",
  },
  {
    slug: "harness",
    name: "Cognera Harness",
    role: "Foundation",
    line: "One language for every agent.",
    headline: "A shared foundation for Forge and its modules.",
    statement: "Cognera Harness is the foundation Forge and the other modules stand on. It recommends the right agent for each task and never lowers quality without telling you.",
    guarantees: ["You can always pick the agent yourself.", "Every decision can be explained afterward."],
    screen: "harness-step-b",
  },
];

export const MODULES_PAGE_EN = {
  meta: {
    title: "Forge modules: from research to deployment",
    description: "Bellows, Anvil, Temper, Rivet, and Cognera Harness: five modules that add research, specs, verification, deployment, and a shared foundation to Forge.",
  },
  hero: {
    eyebrow: "Modules",
    title: ["One core.", "Five modules."],
    lead: ["The modules add research, specs, verification, and deployment to ", { text: "Forge", page: "forge" }, ". They all stand on a shared foundation."],
  },
  indexLabel: "Modules on this page",
  moreLabel: (name) => `More about the ${name} module on cognera.cz`,
  closing: { heading: "The whole factory speaks one language.", lead: "You can book a demo through the form on cognera.cz." },
};

export const FAQ_EN = [
  {
    mark: "factory",
    q: "What is an AI software factory?",
    a: "Forge is the AI software factory from Cognera. It takes a spec to finished, verified code. Its modules add research, specs, verification, and deployment.",
  },
  {
    mark: "rivet",
    q: "Who decides what gets merged and deployed?",
    a: "Always a person. Nothing is merged without approval, and a person merges the changes. A production deployment needs a second confirmation.",
  },
  {
    mark: "forge",
    q: "What does Forge do on its own, and where does it wait for me?",
    a: "It turns the spec into a plan, writes the code and the tests, and checks its own work. Where a decision is needed, it waits for you.",
  },
  {
    mark: "anvil",
    q: "What if the spec is unclear?",
    a: "Anvil reads the spec and compares it with the actual code of the project. Where something is missing or the spec contradicts itself, it asks a question and offers an answer. It changes the spec only with your consent.",
  },
  {
    mark: "temper",
    q: "How do we know the finished app works?",
    a: "Temper goes through it like a person, click by click in a real browser, and takes a screenshot at every step. People approve visual changes.",
  },
  {
    mark: "rivet",
    q: "How does deployment work?",
    a: "Rivet deploys only what passed verification and what a person approved. A deployment is done only once Rivet has also checked the live environment. An uncertain result is not passed off as a success.",
  },
  {
    mark: "bellows",
    q: "How do you tell what is worth building?",
    a: "Bellows looks for what’s worth building and backs ideas with verified sources. When it finds nothing, it says so plainly. A person always decides on an idea.",
  },
  {
    mark: "factory",
    q: "Who is behind Forge?",
    a: "Cognera. Forge was made in our workshop, and we use it for our own work.",
  },
  {
    mark: "factory",
    q: "How do I start?",
    a: "Book a demo through the form on cognera.cz.",
  },
];

export const LEGAL_EN = {
  meta: {
    title: "Operator and privacy",
    description: "Who operates aisoftwarefactory.cz and what happens to your data when you visit: no cookies, no measuring, and nothing loaded from other sites.",
  },
  heading: ["Operator and privacy"],
  lead: "Who runs this site and what happens to your data when you visit.",
  sections: [
    {
      id: "operator",
      heading: "Operator",
      paragraphs: [[`The website aisoftwarefactory.cz is operated by ${IMPRINT_EN}`], ["You can write to us ", { text: "through the form on cognera.cz", href: ACTION_EN.href }, "."]],
    },
    {
      id: "privacy",
      heading: "Privacy",
      list: [
        ["The site stores no cookies on your device."],
        ["It does not measure visits and shows no advertising."],
        ["Fonts, pictures, and scripts load directly from this domain."],
        ["The site runs on GitHub Pages. On each visit, it logs the visitor’s IP address for security purposes. GitHub gives the details in its ", { text: "privacy statement", href: GITHUB_PRIVACY }, "."],
        ["The form for booking a demo is on cognera.cz. How Cognera handles the data from the form is described in its ", { text: "Privacy policy", href: COGNERA_EN.privacy }, "."],
      ],
    },
  ],
};
