/**
 * The site's 3D pictures: the films (the factory's loop and each product's own film) and each product's object as a
 * still. They are the same renders cognera.cz shows; the descriptions are the pictures' alternative text.
 */
export const FILM_DIR = "/assets/media/film";
export const OBJECT_DIR = "/assets/media/3d";

const LARGE = { width: 1920, height: 1080 };
const SMALL = { width: 1080, height: 1350 };
export const OBJECT_SIZE = { width: 1200, height: 800 };

/** `loop` films run on; the others play once and hold their last frame, which is also their still. */
export const FILMS = {
  factory: {
    loop: true,
    alt: "Pět předmětů z kovárny stojí v řadě na skleněné desce složené z pěti dílů: měchy Bellows, kovadlina Anvil, znak Forge, znak Temper a nýt Rivet.",
  },
  forge: { alt: "Kleště podrží tyč v řeřavém uhlí, kov se rozžhaví a z jeho žáru se nad výhní složí znak Forge." },
  bellows: { alt: "Měchy vdechnou vzduch do uhlíků, které se rozžhaví." },
  anvil: { alt: "Kladivo dopadne na studenou ocelovou tyč na kovadlině a nad ní se srovná znak Anvil." },
  temper: { alt: "Kleště ponoří rozžhavený kov do vody, kov zchladne a nad hladinou se složí znak Temper." },
  rivet: { alt: "Nýty zapadnou jeden po druhém do ocelových plátů a poslední usadí jediný úder kladiva." },
  harness: { alt: "Tři skleněné desky se srovnají do přesné vrstvy a po hraně se rozsvítí linka." },
};

/** Each product's 3D object alone on the plate. */
export const OBJECTS = {
  forge: "Výheň s řeřavým uhlím, nad ní kleště s rozžhavenou tyčí a znak Forge.",
  temper: "Nádoba s vodou a nad ní znak Temper.",
  rivet: "Ocelové pláty spojené řadou nýtů.",
  bellows: "Kovářské měchy s mosaznou tryskou.",
  anvil: "Kovadlina se studenou ocelovou tyčí a nad ní znak Anvil.",
  harness: "Tři skleněné desky srovnané do vrstvy.",
};

/** A film of the manifest with its files; throws for a name the manifest does not list. */
export function film(name) {
  if (!Object.prototype.hasOwnProperty.call(FILMS, name)) throw new Error(`Unknown film: ${JSON.stringify(name)}`);
  const { loop = false, alt } = FILMS[name];
  const cut = (size, key) => ({
    video: `${FILM_DIR}/${name}-${key}.mp4`,
    start: `${FILM_DIR}/${name}-${key}-start.jpg`,
    // A loop ends where it starts, so its still is its first frame.
    still: loop ? `${FILM_DIR}/${name}-${key}-start.jpg` : `${FILM_DIR}/${name}-${key}-end.jpg`,
    ...size,
  });
  return { name, loop, alt, large: cut(LARGE, "large"), small: cut(SMALL, "small") };
}

/** A product's 3D object; throws for a product the manifest does not list. */
export function object3d(slug) {
  if (!Object.prototype.hasOwnProperty.call(OBJECTS, slug)) throw new Error(`Unknown 3D object: ${JSON.stringify(slug)}`);
  return { src: `${OBJECT_DIR}/${slug}.jpg`, alt: OBJECTS[slug], ...OBJECT_SIZE };
}

/** Every file the manifests name (relative to the site root), for the build's check that each one is on disk. */
export function media3dFiles() {
  const films = Object.keys(FILMS).flatMap((name) => {
    const f = film(name);
    return [f.large.video, f.large.start, f.large.still, f.small.video, f.small.start, f.small.still];
  });
  return [...new Set([...films, ...Object.keys(OBJECTS).map((slug) => object3d(slug).src)])].sort();
}
