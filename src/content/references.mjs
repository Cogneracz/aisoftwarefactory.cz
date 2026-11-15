/**
 * The systems built in the factory, as cognera.cz publishes them: the four of its home page, in its order. Every name,
 * field and line is the case study's own on cognera.cz, the pictures are the files cognera.cz serves (real screens on
 * invented demo data), and the parts of the factory each was built with are the ones its case study lists.
 */
export const REFERENCE_DIR = "/assets/media/references";

/** The 4 : 3 card picture for phones and the 21 : 9 laptop and phone pair from 768 px; `widths` are the smaller copies. */
const CARD = { width: 1280, height: 960, widths: [640, 960] };
const PAIR = { width: 2520, height: 1080, widths: [1280, 1920] };

/** What is the same in every language: the order, the parts each system was built with and its pictures. */
export const REFERENCE_SYSTEMS = {
  centera: { marks: ["forge", "temper"], card: "centera-card", pair: "centera-hero" },
  helpdesk: { marks: ["forge", "temper", "rivet"], card: "helpdesk-card", pair: "helpdesk-hero" },
  "cognera-crm": { marks: ["forge", "temper"], card: "cognera-crm-card", pair: "cognera-crm-hero" },
  invoiceai: { marks: ["forge", "harness"], card: "invoiceai-card", pair: "invoiceai-hero" },
};

/** A picture's files from the largest down, each with its width, and its sizes. */
export function referencePicture(name, kind = "card") {
  const shape = kind === "pair" ? PAIR : kind === "card" ? CARD : null;
  if (!shape) throw new Error(`Unknown reference picture kind: ${JSON.stringify(kind)}`);
  if (typeof name !== "string" || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) throw new Error(`Invalid reference picture: ${JSON.stringify(name)}`);
  const files = [...shape.widths.map((w) => ({ file: `${name}-${w}.webp`, width: w })), { file: `${name}.webp`, width: shape.width }];
  return { file: `${name}.webp`, width: shape.width, height: shape.height, files };
}

/** Every file the systems name, for the build's check that each one is on disk. */
export function referenceFiles(systems = REFERENCE_SYSTEMS) {
  return Object.values(systems)
    .flatMap((s) => [...referencePicture(s.card).files, ...(s.pair ? referencePicture(s.pair, "pair").files : [])])
    .map((f) => `${REFERENCE_DIR}/${f.file}`)
    .sort();
}

export const REFERENCES = {
  builtWith: "Postaveno s",
  note: "Každý z těchto systémů jsme postavili s AI agenty pod dohledem seniorů. Obrazovky ukazují vymyšlená ukázková data, skutečné údaje klientů nikdy nezveřejňujeme.",
  items: [
    {
      slug: "centera",
      name: "Centera",
      field: "Proptech · ERP",
      line: "Provozní systém pro majitele a správce nákupních center. Nahradil letitou aplikaci a je nasazený naostro.",
      alt: "Centera: přehled obchodních center s obsazeností a stavem fakturace.",
    },
    { slug: "helpdesk", name: "Cognera Helpdesk", field: "Podpora", line: "Hlášení zákazníka rovnou u vývojáře.", alt: "Fronta tiketů v konzoli Cognera Helpdesk, u každého typ, stav a priorita." },
    { slug: "cognera-crm", name: "Cognera CRM", field: "Interní systém", line: "Stojí na něm naše výkazy práce i fakturace.", alt: "Schvalovací inbox v Cognera CRM: výkazy práce, které čekají na kontrolu majitelem." },
    { slug: "invoiceai", name: "InvoiceAI", field: "Účetnictví", line: "Přijaté faktury vytěží AI, poslední slovo má účetní.", alt: "Přehled faktur podle stavu, u každé přesnost vytěžení." },
  ],
};
