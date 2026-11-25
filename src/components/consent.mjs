import { content } from "../content/index.mjs";
import { CLARITY_PROJECT_ID, SITE } from "../content/site.mjs";
import { pathOf } from "../i18n/index.mjs";
import { t } from "../lib/html.mjs";

export function consentPanel(projectId = CLARITY_PROJECT_ID) {
  if (!projectId) return "";
  if (!/^[a-z0-9]+$/.test(projectId)) throw new Error("Invalid Clarity project ID");
  const { consent } = content().ui;
  return `<aside class="consent-panel" id="measurement-choice" aria-labelledby="measurement-title" data-project="${projectId}" data-origin="${SITE.origin}" hidden>
<p id="measurement-title" class="consent-panel__title">${t(consent.title)}</p>
<p>${t(consent.message)} <a href="${pathOf("operator")}" class="link">${t(consent.details)}</a></p>
<div class="consent-panel__actions">
<button type="button" data-choice="denied">${t(consent.decline)}</button>
<button type="button" data-choice="granted">${t(consent.accept)}</button>
</div>
</aside>`;
}
