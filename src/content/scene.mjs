/**
 * The site's two scroll scenes and their captions.
 *
 * - The assembly scene: Forge stands alone and its modules seat beside it one by one. One caption per stop: the
 *   product's name and its sentence from the line.
 * - The line scene: the camera travels along the line's five steps and ends on the whole line. One caption per stop:
 *   the step's role and the decision a person makes there; the last one is the base.
 *
 * Frames and timing come from each scene's manifest (assets/js/scenes); the captions take a content object, so they
 * come out in the language of the page.
 */
import { LINE_ORDER } from "./line.mjs";

/** The assembly's stops in the order the scene shows them: the inner pieces seat first, so no piece passes through another. */
export const ASSEMBLY_STOPS = ["forge", "anvil", "temper", "bellows", "rivet", "harness"];

export const ASSEMBLY = {
  eyebrow: "Moduly",
  heading: "Jedno jádro. Pět modulů.",
  lead: "Forge je jádro továrny. Moduly k němu přidávají průzkum, zadání, ověření a nasazení a všechny stojí na společném základu.",
  label:
    "Forge stojí sám na svém dílu skleněné desky. Při posouvání stránky k němu jeden po druhém dojedou Anvil, Temper, Bellows a Rivet, každý se svým dílem desky. Nakonec stojí celá linka na společném základu.",
  /** What each stop's still shows, for visitors who get the stills instead of the film. */
  stills: [
    "Znak Forge nad žhnoucí tyčí, sám na svém dílu skleněné desky.",
    "Vlevo od Forge už stojí kovadlina Anvil.",
    "Vpravo od Forge už stojí znak Temper.",
    "Na levém konci linky už stojí měchy Bellows.",
    "Na pravém konci linky už stojí nýt Rivet.",
    "Celá linka na společné skleněné desce: měchy, kovadlina, znak Forge, znak Temper a nýt.",
  ],
  link: { label: "Všechny moduly", page: "modules" },
};

/** The assembly's captions: each stop's product name and sentence. Throws when a stop has no sentence. */
export function assemblyCaptions({ line, modules, assembly }) {
  const base = modules.find((m) => m.slug === line.base.slug);
  return ASSEMBLY_STOPS.map((slug, k) => {
    const step = line.steps.find((s) => s.slug === slug);
    const name = step?.name ?? (slug === line.base.slug ? line.base.name : undefined);
    const title = step?.does ?? (slug === line.base.slug ? base?.headline : undefined);
    if (!name || !title) throw new Error(`The assembly has no caption for the stop ${JSON.stringify(slug)}`);
    return { slug, name, title, alt: assembly.stills[k] };
  });
}

/** The line's captions: each step's role and its decision, then the base. Throws when the line is not its five steps. */
export function lineCaptions({ line }) {
  const order = line.steps.map((s) => s.slug);
  if (order.join() !== LINE_ORDER.join()) throw new Error(`The line's steps must run ${LINE_ORDER.join(", ")}; got ${order.join(", ")}`);
  if (!line.base?.role || !line.base?.does) throw new Error("The line needs its base");
  if (!Array.isArray(line.stills) || line.stills.length !== order.length + 1) throw new Error("The line needs a description of each of its six stops");
  return [
    ...line.steps.map((s, k) => {
      if (!s.role || !s.decides) throw new Error(`The step ${s.slug} needs its role and its decision`);
      return { slug: s.slug, name: s.role, title: s.decides, alt: line.stills[k] };
    }),
    { slug: line.base.slug, name: line.base.role, title: line.base.does, alt: line.stills[order.length] },
  ];
}
