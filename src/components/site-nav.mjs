/**
 * The navigation bar: brand, the two page links, the way to the page's other language and the site's one action.
 * Below 768 px the links sit in a full-height panel opened by the menu button (assets/js/nav.js); without scripts
 * they stay visible in the bar.
 */
import { attrs, t } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { LOCALES, NOT_FOUND_PATH, currentLocale, pathOf, routeOf } from "../i18n/index.mjs";
import { productMark } from "./product-mark.mjs";
import { button } from "./rich.mjs";

/** The links to the same page in the other languages (to their home pages from a page without language versions). */
export function languageLinks(current) {
  const route = routeOf(current);
  const here = route?.locale ?? currentLocale();
  return LOCALES.filter((locale) => locale !== here).map((locale) => ({ locale, href: pathOf(route?.key ?? "home", locale), ...content(locale).ui.language }));
}

export function siteNav({ current }) {
  const route = routeOf(current);
  if (!route && current !== NOT_FOUND_PATH) throw new Error(`Unknown page path: ${JSON.stringify(current)}`);
  const c = content();
  const home = pathOf("home");
  const links = c.nav
    .map((link, i) => {
      const href = pathOf(link.page);
      return `<li style="--i:${i}"><a${attrs({ class: "site-nav__link", href, "aria-current": href === current ? "page" : false })}>${t(link.label)}</a></li>`;
    })
    .join("");
  const languages = languageLinks(current)
    .map((l, i) => `<li style="--i:${c.nav.length + i}"><a${attrs({ class: "site-nav__link site-nav__lang", href: l.href, hreflang: l.locale, lang: l.locale, "aria-label": l.switchLabel })}>${t(l.short)}</a></li>`)
    .join("");
  return `<header class="site-header">
<nav class="site-nav" aria-label="${t(c.ui.navLabel)}">
<a class="site-nav__brand" href="${home}"${current === home ? ' aria-current="page"' : ""}>${productMark("forge")}<span>${t(c.site.name)}</span></a>
<button class="site-nav__toggle" type="button" aria-expanded="false" aria-controls="site-menu" aria-label="${t(c.ui.menu)}"><span></span><span></span></button>
<div class="site-nav__menu" id="site-menu">
<ul class="site-nav__links">${links}${languages}</ul>
<div class="site-nav__action" style="--i:${c.nav.length + LOCALES.length - 1}">${button(c.action, { size: "sm", arrow: false })}</div>
</div>
</nav>
</header>`;
}
