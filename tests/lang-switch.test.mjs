import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { PLACE_SECTIONS, REFERENCE, UNDER_MENU, fragmentOf, initLang, positionAt } from "../assets/js/lang.js";
import { handover, presence, storyPosition } from "../assets/js/story-math.js";
import { END_ID, END_SCRIPT, HEAD_SCRIPT, STORY_ID, compact, decideStoryMotion, gateTransition, primeStages, restorePlace } from "../src/lib/lang-switch.mjs";
import { captionAt, pinnedProgress, segmentFill } from "../assets/js/scrub-math.js";
import { parseRules } from "./lib/css-contract.mjs";
import { scriptProblems } from "./lib/integrity.mjs";
import { built } from "./lib/pages.mjs";
import { PAGE_KEYS, pathOf } from "../src/i18n/index.mjs";

/** A stand-in element: classes, inline custom properties, attributes, a box and named descendants. */
function el({ id = "", cls = [], rect = { top: 0, height: 0 }, attrs = {}, parts = {}, offsetTop = 0, offsetHeight = 0 } = {}) {
  const classes = new Set(cls);
  const vars = new Map();
  const attributes = new Map(Object.entries(attrs));
  return {
    id,
    offsetTop,
    offsetHeight,
    vars,
    attributes,
    classList: { add: (c) => classes.add(c), remove: (c) => classes.delete(c), contains: (c) => classes.has(c), toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) },
    style: { setProperty: (k, v) => vars.set(k, v) },
    getAttribute: (k) => attributes.get(k) ?? null,
    setAttribute: (k, v) => attributes.set(k, String(v)),
    removeAttribute: (k) => attributes.delete(k),
    getBoundingClientRect: () => rect,
    querySelector: (sel) => (parts[sel] ?? [])[0] ?? null,
    querySelectorAll: (sel) => parts[sel] ?? [],
    has: (c) => classes.has(c),
  };
}

/** A stand-in window for the inline functions. */
function fakeWindow({ hash = "", pathname = "/en/modules/", referrer = "", alternates = [], places = [], selectors = {}, reducedMotion = false, saveData = false, webgl = true, scrollY = 0, innerHeight = 900 } = {}) {
  const listeners = {};
  const head = { children: [], appendChild: (n) => head.children.push(n) };
  const html = el({ cls: ["js"] });
  const win = {
    scrollY,
    innerHeight,
    scrolled: null,
    replaced: null,
    location: { hash, pathname, search: "" },
    history: { replaceState: (_s, _t, url) => { win.replaced = url; } },
    scrollTo: (o) => { win.scrolled = o; },
    navigator: { connection: { saveData } },
    matchMedia: () => ({ matches: reducedMotion }),
    addEventListener: (type, fn) => { listeners[type] = fn; },
    fire: (type, event) => listeners[type](event),
    document: {
      referrer,
      head,
      documentElement: html,
      querySelector: (sel) => (selectors[sel] ?? [])[0] ?? null,
      querySelectorAll: (sel) => (sel.startsWith("link[") ? alternates.map((href) => ({ href })) : sel === PLACE_SECTIONS ? places : selectors[sel] ?? []),
      createElement: (name) => (name === "canvas" ? { getContext: (kind) => (webgl && kind === "webgl2" ? {} : null) } : { attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } }),
    },
  };
  return win;
}

const ALTERNATES = ["https://aisoftwarefactory.cz/moduly/", "https://aisoftwarefactory.cz/en/modules/", "https://aisoftwarefactory.cz/moduly/"];
const transition = () => ({ skipped: false, skipTransition() { this.skipped = true; } });

test("expected: the place is the section under the reference line and the share of it above the line", () => {
  const sections = [{ top: -3000, height: 1000 }, { top: -2000, height: 4000 }, { top: 2000, height: 800 }];
  assert.deepEqual(positionAt(sections, 1000), { index: 1, share: 0.5875 });
  assert.equal(fragmentOf({ index: 2, share: 0.612 }), "#@2:0.612");
  assert.equal(REFERENCE, 0.35);
  // The other page puts the same share of its (differently tall) second section under the same line.
  const win = fakeWindow({ hash: "#@1:0.5875", places: [el(), el({ rect: { top: 3000, height: 5000 } })], scrollY: 0, innerHeight: 1000 });
  assert.equal(restorePlace(win), true);
  assert.deepEqual(win.scrolled, { top: 3000 + 5000 * 0.5875 - 350, behavior: "instant" });
  assert.equal(win.replaced, "/en/modules/");
});

test("edge: above the first section there is no place; shares stay within 0 and 1; a restore never scrolls above the top", () => {
  assert.equal(positionAt([{ top: 900, height: 4000 }], 1000), null);
  assert.equal(positionAt([{ top: -5000, height: 4000 }], 1000), null);
  assert.equal(positionAt([{ top: 0, height: 0 }, null, { top: Number.NaN, height: 10 }], 1000), null);
  assert.equal(positionAt([], 0), null);
  assert.equal(fragmentOf(null), "");
  assert.equal(fragmentOf({ index: 0, share: 0 }), "#@0:0");
  assert.equal(fragmentOf({ index: 3, share: 7 }), "#@3:1");
  assert.equal(fragmentOf({ index: 100, share: 0.5 }), "");
  const win = fakeWindow({ hash: "#@0:0", places: [el({ rect: { top: 100, height: 500 } })] });
  restorePlace(win);
  assert.equal(win.scrolled.top, 0);
});

test("error: a fragment that is no place, or names no section, is left alone; a list is required", () => {
  for (const hash of ["", "#linka", "#@0", "#@0:2", "#@0:0.123456", "#@:0.5", "#@x:0.5", "#@0:0.5:x", "#@123:0.5"]) {
    const win = fakeWindow({ hash, places: [el({ rect: { top: 100, height: 500 } })] });
    assert.equal(restorePlace(win), false, hash);
    assert.equal(win.scrolled, null, hash);
    assert.equal(win.replaced, null, hash);
  }
  assert.equal(restorePlace(fakeWindow({ hash: "#@4:0.5", places: [el()] })), false, "the page has no fifth section");
  assert.throws(() => positionAt(null, 900), /a list of sections is required/);
});

test("expected: a transition runs only for a language switch, and a switch holds the first paint until the page's end", () => {
  const win = fakeWindow({ hash: "#@1:0.61", referrer: "http://localhost:4173/moduly/", alternates: ALTERNATES });
  assert.equal(gateTransition(win), true);
  const hold = win.document.head.children[0];
  assert.deepEqual([hold.rel, hold.href, hold.attrs.blocking], ["expect", `#${END_ID}`, "render"]);
  // Arriving from the other language: the new page keeps the transition.
  const arriving = transition();
  win.fire("pagereveal", { viewTransition: arriving });
  assert.equal(arriving.skipped, false);
  // Leaving by the language link: kept once, then the flag is spent.
  win.__lang = true;
  const leaving = transition();
  win.fire("pageswap", { viewTransition: leaving });
  assert.equal(leaving.skipped, false);
  const next = transition();
  win.fire("pageswap", { viewTransition: next });
  assert.equal(next.skipped, true, "a page back from the back-forward cache does not animate its next navigation");
});

test("edge: another page, the same page, no referrer and a switch without a place do not hold the paint; browsers without transitions are left alone", () => {
  for (const referrer of ["http://localhost:4173/forge/", "http://localhost:4173/en/modules/", "", "not a url"]) {
    const win = fakeWindow({ hash: "#@1:0.61", referrer, alternates: ALTERNATES });
    assert.equal(gateTransition(win), false, referrer);
    assert.equal(win.document.head.children.length, 0, referrer);
    const t = transition();
    win.fire("pagereveal", { viewTransition: t });
    assert.equal(t.skipped, true, referrer);
  }
  const top = fakeWindow({ hash: "", referrer: "http://localhost:4173/moduly/", alternates: ALTERNATES });
  assert.equal(gateTransition(top), true);
  assert.equal(top.document.head.children.length, 0, "nothing to restore, nothing to wait for");
  top.fire("pagereveal", { viewTransition: null });
  top.fire("pageswap", { viewTransition: null });
});

test("expected: the SVG story respects motion and data preferences without a graphics context", () => {
  const story = el();
  assert.equal(decideStoryMotion(fakeWindow(), story), true);
  assert.ok(story.has("is-motion"));
  const noGpu = fakeWindow({ webgl: false });
  noGpu.document.createElement = () => { throw new Error("The logo story must not probe a graphics context"); };
  assert.equal(decideStoryMotion(noGpu, el()), true);
  for (const options of [{ reducedMotion: true }, { saveData: true }]) {
    const still = el();
    assert.equal(decideStoryMotion(fakeWindow(options), still), false, JSON.stringify(options));
    assert.equal(still.has("is-motion"), false);
  }
  assert.equal(decideStoryMotion(fakeWindow(), null), false);
});

test("expected: at the end of the page the story and the scenes are set for the scroll position, by the scripts' own math", () => {
  const lib = { pinnedProgress, captionAt, segmentFill, presence, handover, storyPosition };
  const chapters = [0, 1, 2, 3, 4].map(() => {
    const steps = [0, 1, 2].map(() => el());
    const screens = [0, 1, 2].map(() => el());
    return Object.assign(el({ parts: { ".story__step": steps, ".story__screen": screens } }), { steps, screens });
  });
  // The stage has travelled 5,050 of 9,000 px: chapter 3 (index 2), 0.8056 through it, its third step.
  const story = el({ cls: ["story", "is-motion"], parts: { ".story__track": [el({ rect: { top: -5050, height: 9900 } })], ".story__stage": [el({ rect: { top: 0, height: 900 } })], ".story__chapter": chapters } });
  const captions = [0, 0.2, 0.5, 0.8].map((at) => el({ attrs: { "data-at": at } }));
  const segments = captions.map(() => el());
  const scene = el({ rect: { top: -1500, height: 4000 }, parts: { ".scene__stage": [el({ rect: { top: 0, height: 1000 } })], ".scene__caption": captions, ".scene__seg": segments } });
  const win = fakeWindow({ selectors: { ".story.is-motion": [story], ".scene:not(.is-static)": [scene] } });
  primeStages(win, lib);
  const pos = storyPosition(pinnedProgress(-5050, 9900, 0, 900), 5);
  assert.deepEqual([pos.chapter, pos.beat], [2, 2]);
  assert.deepEqual(chapters.map((c) => c.has("is-current")), [false, false, true, false, false]);
  assert.deepEqual(chapters[2].steps.map((s) => s.has("is-current")), [false, false, true]);
  assert.deepEqual(chapters[2].screens.map((s) => s.has("is-current")), [false, false, true]);
  assert.equal(chapters[2].vars.get("--l"), pos.local.toFixed(4));
  assert.equal(chapters[2].vars.get("--p"), presence(pos.local, false, false).toFixed(4));
  assert.equal(chapters[2].vars.get("--x"), handover(pos.local, false, false).toFixed(4));
  assert.equal(story.querySelector(".story__stage").vars.get("--story-progress"), pinnedProgress(-5050, 9900, 0, 900).toFixed(4));
  // The scene is half way: its third caption (0.5) is the active one.
  assert.deepEqual(captions.map((c) => [c.has("is-past"), c.has("is-active"), c.has("is-next")].indexOf(true)), [0, 0, 1, 2]);
  assert.equal(captions[2].getAttribute("aria-current"), "step");
  assert.equal(captions[0].getAttribute("aria-hidden"), "true");
  assert.deepEqual(segments.map((s) => s.has("is-active")), [false, false, true, false]);
  assert.equal(segments[1].vars.get("--f"), "1");
});

test("edge: without the site's script class, or on a page with no story and no scene, nothing is touched", () => {
  const story = el({ cls: ["story", "is-motion"] });
  const off = fakeWindow({ selectors: { ".story.is-motion": [story] } });
  off.document.documentElement.classList.remove("js");
  primeStages(off, {});
  primeStages(fakeWindow(), {});
  // The whole end script runs on a bare page.
  new Function("window", "document", END_SCRIPT.replace(/\(window\)/g, "(window)"))(fakeWindow(), {});
});

test("expected: every page carries the gate, the restore and its end mark; the two languages share their sections' ids", async () => {
  for (const key of PAGE_KEYS) {
    const cs = built(pathOf(key, "cs"));
    const en = built(pathOf(key, "en"));
    for (const html of [cs, en]) {
      assert.ok(html.includes(`<script>${HEAD_SCRIPT}</script>`), `${key}: the gate`);
      assert.ok(html.indexOf(`<script>${HEAD_SCRIPT}</script>`) < html.indexOf("</head>"));
      assert.ok(html.includes(`<script>${END_SCRIPT}</script>\n<span id="${END_ID}" hidden></span>\n</body>`), `${key}: the restore and the end mark`);
      // One transition name may be used once per page: at most one scroll scene and one story.
      assert.ok((html.match(/class="scene__canvas"/g) ?? []).length <= 1, `${key}: one scene`);
      assert.ok((html.match(/class="story"/g) ?? []).length <= 1, `${key}: one story`);
    }
    // A place is a section's number on the page, so both languages must have the same sections in the same order.
    const places = (html) => [...html.slice(html.indexOf("<main")).matchAll(/<section class="(?!story__chapter)([^"]*)" id="[^"]+"|<div class="(story)" id="[^"]+"/g)].map((m) => (m[1] ?? m[2]).split(" ")[0]);
    assert.ok(places(cs).length > 0, `${key}: has places`);
    assert.deepEqual(places(en), places(cs), `${key}: the same sections in both languages`);
  }
  assert.ok(built("/moduly/").includes(`<div class="story" id="${STORY_ID}"`));
  const css = await readFile(new URL("../src/styles/lang-transition.css", import.meta.url), "utf8");
  const code = css.replace(/\/\*[\s\S]*?\*\//g, "");
  // The opt-in exists once, and only inside the motion query: no transition with reduced motion.
  assert.equal((code.match(/@view-transition/g) ?? []).length, 1);
  assert.match(code, /@media \(prefers-reduced-motion: no-preference\) \{\s*@view-transition \{\s*navigation: auto;\s*\}\s*\}/);
  // The pictures drawn by scripts keep their old frame: named, and not animated.
  const named = parseRules(css).filter((r) => r.declarations.some((d) => d.prop === "view-transition-name"));
  const nameOf = (r) => r.declarations.find((d) => d.prop === "view-transition-name").value;
  assert.deepEqual(named.slice(0, 2).map((r) => [r.selector, nameOf(r)]), [[".scene__canvas", "scene-picture"], [".scene__captions", "scene-captions"]]);
  // Under the open phone menu none of them is a group of its own.
  assert.equal(named.length, 3);
  assert.equal(nameOf(named[2]), "none");
  assert.deepEqual(named[2].selector.split(", "), [".scene__canvas", ".scene__captions"].map((s) => `html.${UNDER_MENU} ${s}`));
  // What holds its old frame fades like the page when it has no counterpart on the other side.
  const hold = parseRules(css).filter((r) => r.selector.includes("(scene-picture)"));
  assert.deepEqual(hold.map((r) => r.declarations.find((d) => d.prop === "animation").value), ["none", "fade var(--dur-move) var(--ease) both", "fade var(--dur-move) var(--ease) reverse both"]);
  assert.ok(hold.slice(1).every((r) => r.selector.split(", ").every((s) => s.endsWith(":only-child"))));
});

test("error: compact refuses a function whose source it could damage", () => {
  assert.throws(() => compact("not a function"), /a function is required/);
  // eslint-disable-next-line no-new-func
  const risky = new Function('return "a//b";');
  assert.throws(() => compact(risky), /outside a comment/);
  assert.equal(compact(function (a) {
    // a comment
    return a; /* another */
  }), "function (a) {\nreturn a;\n}");
});

/** Runs `initLang` against a stand-in page with one language link and returns what a test needs to drive it. */
function langPage({ href = "/en/modules/", sections = [], menuOpen = false } = {}) {
  const handlers = {};
  const attrs = new Map([["href", href]]);
  const link = { getAttribute: (k) => attrs.get(k) ?? null, setAttribute: (k, v) => attrs.set(k, v), addEventListener: (type, fn) => { handlers[type] = fn; } };
  const root = el({ cls: menuOpen ? ["js", "is-menu-open"] : ["js"] });
  const timers = [];
  const shown = {};
  const before = { document: globalThis.document, window: globalThis.window, setTimeout: globalThis.setTimeout };
  globalThis.document = { documentElement: root, querySelectorAll: (sel) => (sel === "a.site-nav__lang" ? [link] : sel === PLACE_SECTIONS ? sections.map((rect) => el({ rect })) : []) };
  globalThis.window = { innerHeight: 1000, addEventListener: (type, fn) => { shown[type] = fn; } };
  // The timer stays a stand-in until the test restores the globals: the click handler sets one too.
  globalThis.setTimeout = (fn) => timers.push(fn);
  const restore = () => Object.assign(globalThis, before);
  try {
    initLang();
  } catch (error) {
    restore();
    throw error;
  }
  return { handlers, link, root, timers, shown, win: globalThis.window, restore };
}
const click = (extra = {}) => ({ button: 0, metaKey: false, ctrlKey: false, shiftKey: false, altKey: false, ...extra });

test("expected: a click on the language link appends the place and marks the navigation as the switch", () => {
  const page = langPage({ sections: [{ top: -3000, height: 1000 }, { top: -2000, height: 4000 }] });
  try {
    page.handlers.click(click());
    assert.equal(page.link.getAttribute("href"), "/en/modules/#@1:0.5875");
    assert.equal(page.win.__lang, true);
    assert.equal(page.root.has(UNDER_MENU), false);
    // The mark does not outlive the navigation it was set for.
    page.timers[0]();
    assert.equal(page.win.__lang, false);
    // A second click from another place replaces the first place, it does not add to it.
    page.handlers.click(click());
    assert.equal(page.link.getAttribute("href"), "/en/modules/#@1:0.5875");
  } finally {
    page.restore();
  }
});

test("edge: under the open phone menu the switch is remembered as covered; a click into a new tab keeps the place but marks nothing", () => {
  const phone = langPage({ menuOpen: true });
  try {
    phone.handlers.click(click());
    assert.equal(phone.link.getAttribute("href"), "/en/modules/", "above the first section there is no place to append");
    assert.equal(phone.root.has(UNDER_MENU), true);
    // Back from the back-forward cache the page starts clean; an ordinary show changes nothing.
    phone.win.__lang = true;
    phone.shown.pageshow({ persisted: false });
    assert.equal(phone.root.has(UNDER_MENU), true);
    phone.shown.pageshow({ persisted: true });
    assert.deepEqual([phone.root.has(UNDER_MENU), phone.win.__lang], [false, false]);
  } finally {
    phone.restore();
  }
  const tab = langPage({ sections: [{ top: 0, height: 1000 }], menuOpen: true });
  try {
    for (const extra of [{ metaKey: true }, { ctrlKey: true }, { shiftKey: true }, { button: 1 }]) tab.handlers.click(click(extra));
    tab.handlers.auxclick();
    tab.handlers.contextmenu();
    assert.equal(tab.link.getAttribute("href"), "/en/modules/#@0:0.35");
    assert.equal(tab.win.__lang, undefined);
    assert.equal(tab.root.has(UNDER_MENU), false);
  } finally {
    tab.restore();
  }
});

test("error: a language link without an address is left alone", () => {
  const page = langPage({ href: "" });
  try {
    assert.deepEqual(Object.keys(page.handlers), []);
  } finally {
    page.restore();
  }
});

test("expected: the scripts written into the pages keep the site's rules: nothing stored, nothing sent, no outside address", () => {
  const inline = (html) => [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  let checked = 0;
  for (const key of PAGE_KEYS) {
    for (const locale of ["cs", "en"]) {
      const scripts = inline(built(pathOf(key, locale)));
      assert.ok(scripts.includes(HEAD_SCRIPT) && scripts.includes(END_SCRIPT), `${key} ${locale}`);
      for (const js of scripts) {
        assert.deepEqual(scriptProblems(js, `${key} ${locale} inline`), []);
        // Each is a complete program: it parses on its own.
        assert.doesNotThrow(() => new Function(js));
        checked++;
      }
    }
  }
  assert.ok(checked >= PAGE_KEYS.length * 2 * 3);
  // The checker does see inline code: the same script with a stored value is refused.
  assert.match(scriptProblems(`${END_SCRIPT};sessionStorage.setItem("place","1")`, "inline").join(), /storage/);
});
