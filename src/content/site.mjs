/**
 * Facts of the site itself that do not depend on language: its name and address, the Czech action and links (the
 * base every language starts from, see ./cs.mjs and ./en) and the company that runs it. Company facts are public
 * (ARES, the commercial register) and the same as on cognera.cz. Pages and their addresses are in ../i18n/index.mjs.
 */
export const SITE = {
  name: "AI Software Factory",
  origin: "https://aisoftwarefactory.cz",
  locale: "cs_CZ",
  /** The copyright year is content, not the build date, so a build on 1 January does not change every page. */
  year: 2026,
  statement: "Forge je AI továrna na software od Cognery.",
};

/** The site's one action. Hero, navigation and the closing band all read it, so it cannot differ between them. */
export const PRIMARY_ACTION = { label: "Domluvit ukázku", href: "https://cognera.cz/#contact-form" };

export const COGNERA = {
  home: "https://cognera.cz/",
  references: "https://cognera.cz/reference",
  privacy: "https://cognera.cz/ochrana-osobnich-udaju",
  product: (slug) => `https://cognera.cz/${slug}`,
  /** A system's case study. */
  reference: (slug) => `https://cognera.cz/reference/${slug}`,
};

export const GITHUB_PRIVACY = "https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement";

/** The only hosts a link may leave the site for. */
export const ALLOWED_EXTERNAL_HOSTS = ["cognera.cz", "docs.github.com"];

export const COMPANY = {
  legalName: "Cognera s.r.o.",
  address: { street: "Panská 571", postalCode: "391 55", city: "Chýnov" },
  ico: "23743514",
  dic: "CZ23743514",
  register: { court: "Krajským soudem v Českých Budějovicích", section: "C", insert: "35720" },
};

/**
 * Whether an IČO is well formed: eight digits whose last one is the mod-11 check digit of the first seven
 * (weights 8 to 2; remainder 0 gives 1, remainder 1 gives 0, otherwise 11 minus the remainder).
 */
export function isValidIco(ico) {
  if (typeof ico !== "string" || !/^\d{8}$/.test(ico)) return false;
  const digits = [...ico].map(Number);
  const sum = digits.slice(0, 7).reduce((total, digit, i) => total + digit * (8 - i), 0);
  const rest = sum % 11;
  const check = rest === 0 ? 1 : rest === 1 ? 0 : 11 - rest;
  return digits[7] === check;
}

/** "Panská 571, 391 55 Chýnov". */
export function formatAddress(address = COMPANY.address) {
  return `${address.street}, ${address.postalCode} ${address.city}`;
}

/** The imprint sentence a company's website must carry; throws when the IČO is malformed. */
export function imprintLine(company = COMPANY) {
  if (!isValidIco(company.ico)) throw new Error(`Malformed IČO: ${JSON.stringify(company.ico)}`);
  const { court, section, insert } = company.register;
  return `${company.legalName}, ${formatAddress(company.address)}, IČO ${company.ico}, DIČ ${company.dic}. Společnost je zapsána v obchodním rejstříku vedeném ${court}, oddíl ${section}, vložka ${insert}.`;
}
