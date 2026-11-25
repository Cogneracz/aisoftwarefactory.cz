/**
 * The footer: what the site is, the way to its pages and module sections, the way to Cognera, and the imprint a
 * company's website must carry.
 */
import { t } from "../lib/html.mjs";
import { content } from "../content/index.mjs";
import { CLARITY_PROJECT_ID, COMPANY, SITE, isValidIco } from "../content/site.mjs";
import { pathOf } from "../i18n/index.mjs";
import { icon } from "./icons.mjs";
import { productMark } from "./product-mark.mjs";
import { arrowLabel } from "./rich.mjs";

const column = (heading, items) =>
  `<div class="site-footer__col"><h2 class="site-footer__heading">${t(heading)}</h2><ul>${items
    .map((item) => `<li><a class="site-footer__link" href="${t(item.href)}">${item.external ? arrowLabel(item.label, icon("arrow-up-right", { size: 12 })) : t(item.label)}</a></li>`)
    .join("")}</ul></div>`;

export function siteFooter({ company = COMPANY, measurement = Boolean(CLARITY_PROJECT_ID) } = {}) {
  if (!isValidIco(company.ico)) throw new Error(`Malformed IČO: ${JSON.stringify(company.ico)}`);
  const c = content();
  const modulesPath = pathOf("modules");
  return `<footer class="site-footer">
<div class="container">
<div class="site-footer__top">
<a class="site-footer__brand" href="${pathOf("home")}">${productMark("forge")}<span>${t(c.site.name)}</span></a>
<p class="site-footer__statement">${t(c.site.statement)}</p>
</div>
<nav class="site-footer__nav" aria-label="${t(c.ui.footerLabel)}">
${column(c.ui.footerSite, [{ href: pathOf("home"), label: c.ui.home }, ...c.nav.map((link) => ({ href: pathOf(link.page), label: link.label }))])}
${column(c.ui.footerModules, c.modules.map((m) => ({ href: `${modulesPath}#${m.slug}`, label: m.name })))}
${column(c.ui.footerCognera, [
  { href: c.cognera.home, label: c.ui.cogneraHome, external: true },
  { href: c.cognera.references, label: c.ui.references, external: true },
  { href: c.cognera.privacy, label: c.ui.privacy, external: true },
])}
</nav>
<div class="site-footer__legal">
<p class="site-footer__imprint">${t(c.imprint)}</p>
<p class="site-footer__meta"><a class="site-footer__link" href="${pathOf("operator")}">${t(c.ui.operator)}</a>${measurement ? `<button type="button" class="site-footer__link" aria-controls="measurement-choice" aria-expanded="false" data-measurement-settings hidden>${t(c.ui.consent.settings)}</button>` : ""}<span>© ${SITE.year} ${t(company.legalName)}</span></p>
</div>
</div>
</footer>`;
}
