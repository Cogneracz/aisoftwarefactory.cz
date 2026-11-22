/**
 * The scroll position drives the active logo, copy and product screen. Motion is enabled at parse time,
 * so fragment links and language switches land in the right layout before the module initializes.
 */
import { pinnedProgress, springStep } from "./scrub-math.js";
import { HANDOVER, chapterLocal, crossOffset, crossPresence, presence, storyPosition } from "./story-math.js";

/**
 * Spring pace (rad/s) and the distance (share of the story) at which it lands on the scroll position. A finger's scroll
 * is already smooth (the browser glides it), so on touch screens the spring follows twice as fast and the stage does not
 * trail the finger; a wheel's notches need the slower glide.
 */
const OMEGA = 15;
const OMEGA_TOUCH = 30;
const REST = 0.00005;
/** The steps' glide when a sentence opens or closes: the site's --dur-fade and --ease (src/styles/tokens.css). */
const GLIDE_MS = 300;
const GLIDE_EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

export function initStory() {
  const root = document.querySelector(".story[data-story]");
  if (!root) return;
  // Whether the story moves was decided when it was parsed (the inline script after it): its layout is already final.
  if (!root.classList.contains("is-motion")) return;

  const slugs = root.dataset.story.split(",");
  const track = root.querySelector(".story__track");
  const stage = root.querySelector(".story__stage");
  const chapters = [...root.querySelectorAll(".story__chapter")];
  const rail = root.querySelector(".story__progress");
  const marks = rail ? [...rail.querySelectorAll("a")] : [];
  if (!track || !stage || chapters.length !== slugs.length) return;

  const n = chapters.length;
  // Steps per chapter: three unless the story names fewer (the line's story on the home page has two).
  const steps = Number(root.dataset.storySteps) || 3;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  const touch = window.matchMedia("(pointer: coarse)");
  let spring = { x: Number.NaN, v: 0 };
  let raf = 0;
  let last = 0;
  let shown = -1;
  let shownBeat = -1;
  // Neighbouring chapters dissolving in or out beside the one on stage.
  const nearby = new Set();

  // The inline script at the end of the page may have marked a chapter already (from the scroll position at parse time,
  // before a browser jumps to an address's #section); this script takes over from a clean state, presence included.
  for (const c of chapters) {
    c.classList.remove("is-current", "is-near");
    for (const name of ["--p", "--t", "--l", "--x"]) c.style.removeProperty(name);
  }

  const read = () => {
    const t = track.getBoundingClientRect();
    const g = stage.getBoundingClientRect();
    return pinnedProgress(t.top, t.height, g.top, g.height);
  };

  /** A chapter's steps and screens at step `beat`: the screens before it have slid away. */
  const markSteps = (chapter, beat) => {
    chapter.querySelectorAll(".story__step").forEach((s, k) => s.classList.toggle("is-current", k === beat));
    chapter.querySelectorAll(".story__screen").forEach((s, k) => {
      s.classList.toggle("is-current", k === beat);
      s.classList.toggle("is-past", k < beat);
    });
  };

  /** `g`: the story's position in chapters (0 to n). */
  const show = (pos, g) => {
    stage.style.setProperty("--story-progress", (g / n).toFixed(4));
    if (shown !== pos.chapter) {
      if (shown >= 0) {
        chapters[shown].classList.remove("is-current");
        chapters[shown].style.setProperty("--p", "0");
        chapters[shown].style.setProperty("--t", "0");
      }
      chapters[pos.chapter].classList.add("is-current");
      // The row of chapters under the stage: the ones passed, the one on stage.
      marks.forEach((mark, i) => {
        mark.classList.toggle("is-done", i < pos.chapter);
        mark.classList.toggle("is-current", i === pos.chapter);
        if (i === pos.chapter) mark.setAttribute("aria-current", "step");
        else mark.removeAttribute("aria-current");
      });
      shown = pos.chapter;
      shownBeat = -1;
    }
    const chapter = chapters[pos.chapter];
    if (shownBeat !== pos.beat) {
      // FLIP: the steps (and the copy above them) glide to their new places when a sentence opens or closes, instead
      // of jumping (emilkowalski/skills improve-animations AUDIT §8). Not on the first show and not under reduced motion.
      const copy = chapter.querySelector(".story__copy");
      const moving = [...(copy ? copy.children : [])].filter((el) => !el.classList.contains("story__steps")).concat([...chapter.querySelectorAll(".story__step")]);
      const glide = shownBeat >= 0 && !reduced.matches && typeof Element.prototype.animate === "function";
      const before = glide ? moving.map((el) => el.getBoundingClientRect().top) : [];
      markSteps(chapter, pos.beat);
      if (glide) {
        moving.forEach((el, k) => {
          const d = before[k] - el.getBoundingClientRect().top;
          if (Math.abs(d) > 0.5) el.animate([{ transform: `translateY(${d.toFixed(1)}px)` }, { transform: "none" }], { duration: GLIDE_MS, easing: GLIDE_EASE });
        });
      }
      shownBeat = pos.beat;
    }
    // The neighbours: the chapter before stays while it dissolves out, the one after shows while it dissolves in, each at
    // the step it ends or starts on. Every other chapter is off stage.
    const wanted = [pos.chapter - 1, pos.chapter + 1].filter((i) => i >= 0 && i < n && crossPresence(g, i, n) > 0.001);
    for (const i of nearby) {
      if (wanted.includes(i)) continue;
      nearby.delete(i);
      chapters[i].classList.remove("is-near");
      if (i !== pos.chapter) {
        chapters[i].style.setProperty("--p", "0");
        chapters[i].style.setProperty("--t", "0");
      }
    }
    for (const i of wanted) {
      const c = chapters[i];
      if (!nearby.has(i)) {
        nearby.add(i);
        c.classList.add("is-near");
        markSteps(c, i < pos.chapter ? steps - 1 : 0);
      }
      c.style.setProperty("--p", crossPresence(g, i, n).toFixed(4));
      // A neighbour's words stay out: two texts over each other cannot be read.
      c.style.setProperty("--t", "0");
      c.style.setProperty("--l", chapterLocal(g, i).toFixed(4));
      c.style.setProperty("--x", crossOffset(g, i, n).toFixed(4));
    }
    // Screens crossfade while each logo and its copy hand over together.
    const first = pos.chapter === 0;
    const lastChapter = pos.chapter === n - 1;
    const turn = presence(pos.local, first, lastChapter).toFixed(4);
    chapter.style.setProperty("--p", crossPresence(g, pos.chapter, n).toFixed(4));
    chapter.style.setProperty("--t", turn);
    chapter.style.setProperty("--l", pos.local.toFixed(4));
    chapter.style.setProperty("--x", crossOffset(g, pos.chapter, n).toFixed(4));
    rail?.style.setProperty("--l", pos.local.toFixed(4));
  };

  // A jump of more than a chapter (the index, a link) lands at once instead of playing the chapters between.
  const tick = (now) => {
    raf = 0;
    const target = read();
    spring = Math.abs(target - spring.x) > 1 / n || !Number.isFinite(spring.x) ? { x: target, v: 0 } : springStep(spring, target, now - last, touch.matches ? OMEGA_TOUCH : OMEGA, REST);
    last = now;
    const pos = storyPosition(spring.x, n, steps);
    show(pos, spring.x * n);
    if (spring.x !== target) raf = requestAnimationFrame(tick);
  };
  const request = () => {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(tick);
  };

  /** The scroll position of chapter `i`'s first step. */
  const chapterTop = (i) => {
    const top = track.getBoundingClientRect().top + window.scrollY - parseFloat(getComputedStyle(stage).top || "0");
    return top + (track.offsetHeight - stage.offsetHeight) * ((i + HANDOVER + 0.02) / n);
  };
  const onClick = (event) => {
    const link = event.target instanceof Element ? event.target.closest('a[href^="#"]') : null;
    const i = link ? slugs.indexOf(link.getAttribute("href").slice(1)) : -1;
    if (i < 0) return;
    event.preventDefault();
    window.scrollTo({ top: chapterTop(i) });
    history.replaceState(null, "", `#${slugs[i]}`);
  };

  window.addEventListener("scroll", request, { passive: true });
  window.addEventListener("resize", request);
  document.addEventListener("click", onClick);
  const hashed = slugs.indexOf(location.hash.slice(1));
  if (hashed >= 0) window.scrollTo({ top: chapterTop(hashed) });
  request();
}
