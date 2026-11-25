/** The public tag is inserted only after a positive choice for this origin. */
const STORAGE_KEY = "factory.measurement.v1";
const VALID_FOR = 180 * 24 * 60 * 60 * 1000;
const TAG_URL = "https://www.clarity.ms/tag/";

// Used only when browser storage refuses both updating and removing a previously saved grant.
const DENIAL_COOKIE = "factory_measurement_off";

function readChoice(win) {
  try {
    const saved = JSON.parse(win.localStorage.getItem(STORAGE_KEY));
    if (saved?.expires > Date.now() && saved.expires <= Date.now() + VALID_FOR && ["granted", "denied"].includes(saved.value)) return saved.value;
  } catch { /* Storage can be disabled or contain an old, invalid record. */ }
  return null;
}

function prefersDenied(doc) {
  try { return doc.cookie.split(";").some((entry) => entry.trim() === DENIAL_COOKIE + "=1"); }
  catch { return false; }
}

function writeCookie(doc, entry) {
  try { doc.cookie = entry; } catch { /* The browser may disable cookie access altogether. */ }
}

function clearRecorderCookies(doc, hostname) {
  for (const name of ["_clck", "_clsk"]) {
    const expired = name + "=; Max-Age=0; Path=/; Secure; SameSite=Lax";
    writeCookie(doc, expired);
    writeCookie(doc, expired + "; Domain=" + hostname);
  }
}

export function initMeasurement(doc = document, win = window) {
  const panel = doc.getElementById("measurement-choice");
  const settings = doc.querySelector("[data-measurement-settings]");
  if (!panel || !settings || !panel.dataset.origin || win.location.origin !== panel.dataset.origin || panel.dataset.ready) return;
  const project = panel.dataset.project;
  if (typeof project !== "string" || !/^[a-z0-9]+$/.test(project)) return;
  panel.dataset.ready = "true";
  let requested = false;
  let openedFromSettings = false;
  let volatileChoice = null;
  const choice = () => prefersDenied(doc) ? "denied" : (volatileChoice ?? readChoice(win));
  const signal = (value) => win.clarity("consentv2", { ad_Storage: "denied", analytics_Storage: value });

  function sync() {
    const state = choice();
    if (state === "granted" && !requested) {
      requested = true;
      win.clarity ??= function () { (win.clarity.q ??= []).push(arguments); };
      signal("granted");
      const script = doc.createElement("script");
      script.async = true;
      script.src = TAG_URL + project;
      script.referrerPolicy = "strict-origin-when-cross-origin";
      doc.head.append(script);
    } else if (state !== "granted" && requested) {
      signal("denied");
      clearRecorderCookies(doc, win.location.hostname);
      // Denial alone puts Clarity into cookieless tracking. Discard the loaded recorder.
      win.location.reload();
      return;
    }
    panel.hidden = Boolean(state) && !openedFromSettings;
    settings.setAttribute("aria-expanded", String(!panel.hidden));
  }
  settings.hidden = false;
  settings.addEventListener("click", () => {
    openedFromSettings = true;
    sync();
    panel.querySelector("[data-choice]").focus();
  });
  for (const btn of panel.querySelectorAll("[data-choice]")) {
    btn.addEventListener("click", () => {
      const value = btn.dataset.choice;
      try {
        win.localStorage.setItem(STORAGE_KEY, JSON.stringify({ value, expires: Date.now() + VALID_FOR }));
        volatileChoice = null;
      } catch {
        volatileChoice = value;
        if (value === "denied") {
          try { win.localStorage.removeItem(STORAGE_KEY); } catch { /* Try the deny-only fallback below. */ }
          if (readChoice(win) === "granted") writeCookie(doc, DENIAL_COOKIE + "=1; Max-Age=15552000; Path=/; Secure; SameSite=Lax");
        }
      }
      if (value === "granted" && prefersDenied(doc)) writeCookie(doc, DENIAL_COOKIE + "=; Max-Age=0; Path=/; Secure; SameSite=Lax");
      const restoreFocus = openedFromSettings;
      openedFromSettings = false;
      sync();
      if (restoreFocus) settings.focus();
    });
  }
  win.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== STORAGE_KEY) return;
    volatileChoice = null;
    openedFromSettings = false;
    sync();
  });
  win.addEventListener("pageshow", sync);
  doc.addEventListener("visibilitychange", () => { if (!doc.hidden) sync(); });
  sync();
}
