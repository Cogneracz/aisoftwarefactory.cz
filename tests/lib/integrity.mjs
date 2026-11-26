/**
 * Checks of a built page and of the site's scripts. They enforce what the operator page promises (first-party resources apart from Cloudflare's cookieless beacon until the visitor opts into Clarity) and what every page owes its reader (one heading, working links,
 * described pictures). Each function returns one line per problem.
 */

/** The one outside script a page may load: Cloudflare's cookieless beacon, exactly as Cloudflare gives it. */
export const BEACON_TAG = /^<script type="module" src="https:\/\/static\.cloudflareinsights\.com\/beacon\.min\.js" data-cf-beacon='\{"token": "[a-f0-9]{32}"\}'>$/;

export const attr = (tag, name) => new RegExp(`\\s${name}="([^"]*)"`).exec(tag)?.[1];

export const tags = (html, name) => html.match(new RegExp(`<${name}(\\s[^>]*)?>`, "g")) ?? [];

export const ids = (html) => new Set([...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));

/** Addresses the browser fetches by itself: styles, preloads, icons, scripts, pictures. */
export function resourceUrls(html) {
  const out = [];
  // A canonical address and a language version are addresses of pages, not files the browser loads.
  for (const tag of tags(html, "link")) if (!["canonical", "alternate"].includes(attr(tag, "rel"))) out.push(attr(tag, "href"));
  for (const tag of tags(html, "script")) if (attr(tag, "src") !== undefined && !BEACON_TAG.test(tag)) out.push(attr(tag, "src"));
  for (const tag of tags(html, "img")) out.push(attr(tag, "src"));
  for (const tag of tags(html, "video")) out.push(attr(tag, "src"), attr(tag, "poster"));
  for (const tag of tags(html, "track")) out.push(attr(tag, "src") ?? "");
  for (const tag of tags(html, "source")) {
    const srcset = attr(tag, "srcset");
    if (srcset !== undefined) for (const part of srcset.split(",")) out.push(part.trim().split(/\s+/)[0]);
    const src = attr(tag, "src");
    if (src !== undefined || srcset === undefined) out.push(src ?? "");
  }
  for (const tag of tags(html, "figure")) for (const name of ["data-film-large", "data-film-small"]) out.push(attr(tag, name));
  return out.filter((url) => url !== undefined);
}

const text = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ");

/**
 * Problems of one built page. `path` is its address, `lang` its language, `origin` the site's origin, `files` the set of files on disk
 * ("/assets/site.css"), `idsOf` the ids of every page by path, `allowedHosts` where links may leave the site for.
 */
export function pageProblems(html, { path, origin, files, idsOf, allowedHosts, noindex = false, lang = "cs" }) {
  const found = [];
  const say = (line) => found.push(`${path}: ${line}`);

  if (!html.includes(`<html lang="${lang}">`)) say(`the document must declare lang="${lang}"`);
  const h1 = (html.match(/<h1[\s>]/g) ?? []).length;
  if (h1 !== 1) say(`expected one h1, found ${h1}`);
  if (!/<title>[^<]+<\/title>/.test(html)) say("the title is missing");
  const description = /<meta name="description" content="([^"]*)">/.exec(html)?.[1] ?? "";
  if (description.length < 70 || description.length > 160) say(`the description has ${description.length} characters (70 to 160)`);
  const canonical = /<link rel="canonical" href="([^"]*)">/.exec(html)?.[1];
  if (noindex) {
    if (canonical !== undefined) say("a noindex page has no canonical address");
    if (!/<meta name="robots" content="noindex">/.test(html)) say("the noindex tag is missing");
  } else if (canonical !== `${origin}${path}`) say(`the canonical address is ${canonical}, expected ${origin}${path}`);
  if (!/<a class="skip-link" href="#obsah">/.test(html) || !ids(html).has("obsah")) say("the skip link or its target is missing");

  for (const url of resourceUrls(html)) {
    if (!/^\/(?!\/)/.test(url)) say(`a resource is not root-relative: ${url}`);
    else if (!files.has(url.split(/[?#]/)[0])) say(`a resource is missing on disk: ${url}`);
  }

  for (const tag of tags(html, "a")) {
    const href = attr(tag, "href");
    if (href === undefined || href === "" || href === "#") say(`a dead link: ${tag}`);
    else if (href.startsWith("#")) {
      if (!ids(html).has(href.slice(1))) say(`an anchor without a target: ${href}`);
    } else if (/^\/(?!\/)/.test(href)) {
      const [target, hash] = href.split("#");
      if (/\sdownload(?:\s|=|>)/.test(tag)) {
        if (!files.has(target)) say(`a download is missing on disk: ${target}`);
      } else if (!idsOf.has(target)) say(`a link to a page that does not exist: ${href}`);
      else if (hash !== undefined && !idsOf.get(target).has(hash)) say(`a link to an anchor that does not exist: ${href}`);
    } else if (href.startsWith("https://")) {
      if (!allowedHosts.includes(new URL(href).hostname)) say(`a link to a host that is not allowed: ${href}`);
    } else say(`a link that is neither root-relative nor https: ${href}`);
    if (attr(tag, "target") !== undefined) say(`a link opens a new window: ${href}`);
  }

  for (const tag of tags(html, "img")) {
    const alt = attr(tag, "alt");
    if (alt === undefined || (!alt.trim() && attr(tag, "aria-hidden") !== "true")) say(`a picture without a description: ${attr(tag, "src")}`);
    if (!attr(tag, "width") || !attr(tag, "height")) say(`a picture without its size: ${attr(tag, "src")}`);
  }

  if (/\son[a-z]+="/.test(html)) say("an inline event handler");
  if (/<(iframe|form|object|embed)[\s>]/.test(html)) say("an iframe, form or embedded object");
  for (const m of html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    const [, attributes, body] = m;
    if (BEACON_TAG.test(`<script${attributes}>`) && body === "") continue;
    if (/type="application\/ld\+json"/.test(attributes)) {
      try {
        JSON.parse(body);
      } catch {
        say("structured data that is not valid JSON");
      }
    } else if (/\ssrc=/.test(attributes)) {
      if (!/type="module" src="\/assets\/js\/site\.js(?:\?v=\d+)?"/.test(attributes)) say(`an unexpected script: ${attributes.trim()}`);
    } else found.push(...scriptProblems(body, `${path} (inline script)`));
  }

  const words = text(html);
  if (/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(words)) say("an e-mail address in plain text");
  if (/\+420|\b\d{3} \d{3} \d{3}\b/.test(words)) say("a phone number in plain text");

  const primary = [...html.matchAll(/<a class="button button--primary[^"]*" href="([^"]+)"><span>([^<]+)<\/span>/g)].map((m) => `${m[2]} -> ${m[1]}`);
  if (new Set(primary).size > 1) say(`primary buttons differ: ${[...new Set(primary)].join("; ")}`);

  return found;
}

const SCRIPT_BANS = [
  [/document\.cookie/, "reads or writes cookies"],
  [/\b(localStorage|sessionStorage|indexedDB)\b/, "uses browser storage"],
  [/\bfetch\(|XMLHttpRequest|sendBeacon|WebSocket|EventSource/, "sends a request"],
  [/gtag|dataLayer|googletagmanager|analytics|clarity|hotjar|plausible|matomo/i, "holds measuring code"],
  // XML namespace names (React DOM's SVG and MathML) are identifiers, never requested; any other address is a problem.
  [/https?:\/\/(?!www\.w3\.org\/(?:2000\/svg|1998\/Math\/MathML|1999\/xlink|XML\/1998\/namespace|1999\/xhtml)["'`])/, "names an outside address"],
];

/**
 * Problems of a script: anything that stores data on the visitor's device, talks to a server or measures.
 * `mayLoad` is for the one script that fetches the scene's frames: it may send requests, but only to this site, which
 * it must check itself before it fetches.
 */
export function scriptProblems(js, file, { mayLoad = false } = {}) {
  let code = js.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
  if (file === "/assets/js/measurement.js") {
    // Only this consent controller can store its preference or load the exact Clarity tag.
    code = code.replaceAll('"https://www.clarity.ms/tag/"', '""')
      .replaceAll("win.localStorage.removeItem(STORAGE_KEY)", "").replaceAll("win.localStorage.getItem(STORAGE_KEY)", "").replaceAll("win.localStorage.setItem(STORAGE_KEY,", "(")
      .replaceAll("win.clarity", "win.recorder").replaceAll("analytics_Storage", "permission");
  }
  const found = SCRIPT_BANS.filter(([pattern, what]) => pattern.test(code) && !(mayLoad && what === "sends a request")).map(([, what]) => `${file}: the script ${what}`);
  if (mayLoad && !/must come from this site/.test(code)) found.push(`${file}: a script that loads must refuse addresses outside this site`);
  return found;
}
