/**
 * The inline scripts of the language switch (assets/js/lang.js appends the visitor's place to the language link). Each
 * runs at a moment a module script cannot guarantee, so the pages carry these functions' own source inline:
 *
 * - `gateTransition`, in the head: lets a view transition run only for a language switch, and on a switch holds the first
 *   paint until the whole page is parsed, so the transition's picture of the new page already shows the right place.
 * - `decideStoryMotion`, right after the modules' story: whether it moves, so its tall pinned layout is final at parse time.
 * - `restorePlace` and `primeStages`, at the end of the body: scroll to the carried place, remove it from the address, and
 *   set the story's and the scroll scenes' chapter, step and caption for that scroll position, with the very functions
 *   the scripts use later (their source is inlined beside them).
 *
 * The functions are written in plain ES5 and reference nothing outside themselves and their arguments.
 */
import { captionAt, pinnedProgress, segmentFill } from "../../assets/js/scrub-math.js";
import { HANDOVER, handover, presence, storyPosition } from "../../assets/js/story-math.js";

/** The id of the body's last element (the render hold waits for it) and of the modules' story. */
export const END_ID = "konec";
export const STORY_ID = "pribeh";

export function gateTransition(win) {
  var doc = win.document;
  var from = "";
  try {
    from = new URL(doc.referrer).pathname;
  } catch (e) {
    from = "";
  }
  var paths = [];
  var links = doc.querySelectorAll('link[rel="alternate"][hreflang]');
  for (var i = 0; i < links.length; i++) {
    try {
      paths.push(new URL(links[i].href).pathname);
    } catch (e) {
      /* an unreadable alternate is no alternate */
    }
  }
  var switched = from !== "" && from !== win.location.pathname && paths.indexOf(from) >= 0;
  // A language switch lands on a page the visitor was already reading: nothing on it enters a second time.
  if (switched) doc.documentElement.classList.add("is-lang-arrival");
  if (switched && /^#@[0-9]{1,2}:[0-9.]+$/.test(win.location.hash) && doc.head) {
    var hold = doc.createElement("link");
    hold.rel = "expect";
    hold.href = "#konec";
    hold.setAttribute("blocking", "render");
    doc.head.appendChild(hold);
  }
  win.addEventListener("pageswap", function (event) {
    if (event.viewTransition && !win.__lang) event.viewTransition.skipTransition();
    win.__lang = false;
  });
  win.addEventListener("pagereveal", function (event) {
    if (event.viewTransition && !switched) event.viewTransition.skipTransition();
  });
  return switched;
}

export function decideStoryMotion(win, story) {
  if (!story || !story.classList) return false;
  var nav = win.navigator || {};
  if (win.matchMedia("(prefers-reduced-motion: reduce)").matches || (nav.connection && nav.connection.saveData === true)) return false;
  story.classList.add("is-motion");
  return true;
}

export function restorePlace(win) {
  var m = /^#@(\d{1,2}):(0|1|0\.\d{1,4})$/.exec(win.location.hash);
  if (!m) return false;
  var el = win.document.querySelectorAll("main section[id]:not(.story__chapter), main .story[id]")[Number(m[1])];
  if (!el) return false;
  var r = el.getBoundingClientRect();
  var top = r.top + win.scrollY + r.height * Number(m[2]) - win.innerHeight * 0.35;
  win.history.replaceState(null, "", win.location.pathname + win.location.search);
  win.scrollTo({ top: Math.max(0, top), behavior: "instant" });
  return true;
}

export function primeStages(win, lib) {
  var doc = win.document;
  if (!doc.documentElement.classList.contains("js")) return;
  var story = doc.querySelector(".story.is-motion");
  if (story) {
    var track = story.querySelector(".story__track");
    var stage = story.querySelector(".story__stage");
    var chapters = story.querySelectorAll(".story__chapter");
    if (track && stage && chapters.length) {
      var t = track.getBoundingClientRect();
      var g = stage.getBoundingClientRect();
      var n = chapters.length;
      var progress = lib.pinnedProgress(t.top, t.height, g.top, g.height);
      stage.style.setProperty("--story-progress", progress.toFixed(4));
      var pos = lib.storyPosition(progress, n, Number(story.getAttribute("data-story-steps")) || 3);
      var first = pos.chapter === 0;
      var last = pos.chapter === n - 1;
      var vars = [
        ["--p", lib.presence(pos.local, first, last).toFixed(4)],
        ["--l", pos.local.toFixed(4)],
        ["--x", lib.handover(pos.local, first, last).toFixed(4)],
      ];
      for (var i = 0; i < n; i++) chapters[i].classList.toggle("is-current", i === pos.chapter);
      var marks = story.querySelectorAll(".story__progress a");
      for (var w = 0; w < marks.length; w++) {
        marks[w].classList.toggle("is-done", w < pos.chapter);
        marks[w].classList.toggle("is-current", w === pos.chapter);
      }
      var chapter = chapters[pos.chapter];
      var steps = chapter.querySelectorAll(".story__step");
      var screens = chapter.querySelectorAll(".story__screen");
      for (var k = 0; k < steps.length; k++) steps[k].classList.toggle("is-current", k === pos.beat);
      for (var j = 0; j < screens.length; j++) {
        screens[j].classList.toggle("is-current", j === pos.beat);
        screens[j].classList.toggle("is-past", j < pos.beat);
      }
      for (var v = 0; v < vars.length; v++) {
        chapter.style.setProperty(vars[v][0], vars[v][1]);
      }
    }
  }
  if (doc.documentElement.classList.contains("is-lang-arrival")) {
    var reveals = doc.querySelectorAll(".reveal");
    for (var r = 0; r < reveals.length; r++) {
      if (reveals[r].getBoundingClientRect().top < win.innerHeight) reveals[r].classList.add("is-in", "is-instant");
    }
  }
  var scenes = doc.querySelectorAll(".scene:not(.is-static)");
  for (var s = 0; s < scenes.length; s++) {
    var section = scenes[s];
    var frame = section.querySelector(".scene__stage");
    var captions = section.querySelectorAll(".scene__caption");
    if (!frame || !captions.length) continue;
    var intro = section.querySelector(".scene__intro");
    var a = section.getBoundingClientRect();
    var b = frame.getBoundingClientRect();
    var p = lib.pinnedProgress(a.top, a.height, b.top, b.height, intro ? intro.offsetTop + intro.offsetHeight : 0);
    var starts = [];
    for (var q = 0; q < captions.length; q++) starts.push(Number(captions[q].getAttribute("data-at")));
    var active = Math.max(0, lib.captionAt(p, starts));
    for (var c = 0; c < captions.length; c++) {
      captions[c].classList.toggle("is-active", c === active);
      captions[c].classList.toggle("is-past", c < active);
      captions[c].classList.toggle("is-next", c > active);
      if (c === active) {
        captions[c].setAttribute("aria-current", "step");
        captions[c].removeAttribute("aria-hidden");
      } else {
        captions[c].removeAttribute("aria-current");
        captions[c].setAttribute("aria-hidden", "true");
      }
    }
    var segments = section.querySelectorAll(".scene__seg");
    for (var x = 0; x < segments.length; x++) {
      segments[x].classList.toggle("is-active", x === active);
      segments[x].style.setProperty("--f", String(Math.round(lib.segmentFill(p, starts, x) * 1000) / 1000));
    }
  }
}

/**
 * A function's source for a page: comments and indentation removed, one statement per line kept (so nothing depends on
 * where a line ends). The functions inlined here hold no comment-like text in strings or patterns; `compact` throws if
 * one ever does, rather than cut it.
 */
export function compact(fn) {
  if (typeof fn !== "function") throw new TypeError("compact: a function is required");
  const source = String(fn).replace(/\/\*[\s\S]*?\*\//g, "");
  const lines = source.split("\n").map((line) => line.trim());
  for (const line of lines) if (/[^:]\/\/|^\/\//.test(line) && !line.startsWith("//")) throw new Error(`compact: a line holds "//" outside a comment: ${line}`);
  return lines.filter((line) => line !== "" && !line.startsWith("//")).join("\n");
}

/** The head's script: the gate, called with the window. */
export const HEAD_SCRIPT = `(${compact(gateTransition)})(window)`;

/** The script right after the story's markup: its previous sibling is the story. */
export const STORY_SCRIPT = `(${compact(decideStoryMotion)})(window,document.currentScript.previousElementSibling)`;

/** The script at the end of the body: the scroll math's own functions, then the restore and the priming. */
const MATH = [pinnedProgress, captionAt, segmentFill, presence, handover, storyPosition];
export const END_SCRIPT = `(function(){var HANDOVER=${HANDOVER};\n${MATH.map(compact).join("\n")}\n(${compact(restorePlace)})(window);(${compact(primeStages)})(window,{${MATH.map((f) => `${f.name}:${f.name}`).join(",")}})})()`;
