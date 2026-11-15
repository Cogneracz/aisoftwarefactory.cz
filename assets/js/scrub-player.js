/**
 * The scroll scene's frame player: fetches a set's frames coarse to fine from this site, keeps them compressed,
 * decodes only the few around the one on screen (off the main thread) and draws the film time it is given on a canvas
 * of the frames' own size. Memory stays bounded: at most `cache` decoded frames, the rest as compressed blobs.
 */
import { blendLevel, decodeWindow, keyframeAt, keyframeUrl, pairBlend, progressiveLoadOrder } from "./scrub-math.js";

/** A 1 x 1 AVIF picture: decoding it tells whether this browser can decode the AVIF frames. */
const AVIF_PROBE =
  "AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADrbWV0YQAAAAAAAAAhaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAETAAAAFwAAAChpaW5mAAAAAAABAAAAGmluZmUCAAAAAAEAAGF2MDFDb2xvcgAAAABqaXBycAAAAEtpcGNvAAAAFGlzcGUAAAAAAAAAAQAAAAEAAAAQcGl4aQAAAAADCAgIAAAADGF2MUOBAAwAAAAAE2NvbHJuY2x4AAEADQAGgAAAABdpcG1hAAAAAAAAAAEAAQQBAoMEAAAAH21kYXQSAAoFGAAGBCAyDBcACCCCBAAAeUuxWA==";

let avifSupport = null;

/** Whether createImageBitmap decodes AVIF here (checked once per page). */
export function supportsAvif() {
  avifSupport ??= (async () => {
    if (typeof createImageBitmap !== "function" || typeof atob !== "function") return false;
    try {
      const bytes = Uint8Array.from(atob(AVIF_PROBE), (c) => c.charCodeAt(0));
      const bitmap = await createImageBitmap(new Blob([bytes], { type: "image/avif" }));
      const ok = bitmap.width === 1;
      bitmap.close();
      return ok;
    } catch {
      return false;
    }
  })();
  return avifSupport;
}

const release = (picture) => {
  if (picture && "close" in picture) picture.close();
};

export class ScrubPlayer {
  /**
   * `set` is a frame set of the manifest; `options`: `ext` ("avif" or "webp"), `revision` (the cache key of the
   * frames), `cache` (decoded frames kept at most), `strides` (for a slow link) and `onFrame` (called when a frame
   * arrives that may change what is on screen).
   */
  constructor(canvas, set, options) {
    if (typeof options.revision !== "string" || options.revision.trim() === "") throw new Error(`ScrubPlayer: no frame revision for ${set.base}`);
    if (!/^\/(?!\/)/.test(set.base)) throw new Error(`ScrubPlayer: frames must come from this site, got ${set.base}`);
    this.canvas = canvas;
    this.set = set;
    this.options = options;
    canvas.width = set.width;
    canvas.height = set.height;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.blobs = new Map();
    /** Decoded frames by index; Map order is the least-recently-used order. */
    this.decoded = new Map();
    this.decoding = new Set();
    this.queue = [];
    this.fetching = 0;
    this.started = false;
    this.destroyed = false;
    this.drawnA = -1;
    this.drawnB = -1;
    this.drawnW = 0;
    this.at = -1;
    this.dir = 1;
  }

  /** Starts fetching (once), the frame nearest film time `t` first. */
  load(t) {
    if (this.started || this.destroyed) return;
    this.started = true;
    const { a } = keyframeAt(this.set.frames, t);
    this.queue = progressiveLoadOrder(this.set.frames.length, Math.max(a, 0), this.options.strides);
    this.fetchNext();
  }

  /** Draws film time `t` (moving in direction `dir`) and decodes the frames around it. */
  show(t, dir) {
    if (this.destroyed) return;
    const { a, b, w } = keyframeAt(this.set.frames, t);
    if (a < 0) return;
    const turn = dir === 0 ? this.dir : dir < 0 ? -1 : 1;
    const moved = a !== this.at || turn !== this.dir;
    this.dir = turn;
    this.at = a;
    this.draw(a, b, blendLevel(pairBlend(this.set, a, w)), t);
    if (moved) this.pump();
  }

  destroy() {
    this.destroyed = true;
    this.queue = [];
    this.decoded.forEach(release);
    this.decoded.clear();
    this.blobs.clear();
  }

  draw(a, b, w, t) {
    const ctx = this.ctx;
    if (!ctx) return;
    const hasA = this.decoded.has(a);
    const hasB = this.decoded.has(b);
    let x = -1;
    let y = -1;
    let k = 0;
    if (hasA && (w === 0 || a === b)) x = a;
    else if (hasB && w === 1) x = b;
    else if (hasA && hasB) [x, y, k] = [a, b, w];
    else x = this.nearestDecoded(t);
    if (x < 0 || (x === this.drawnA && y === this.drawnB && k === this.drawnW)) return;
    [this.drawnA, this.drawnB, this.drawnW] = [x, y, k];
    ctx.globalAlpha = 1;
    ctx.drawImage(this.use(x), 0, 0);
    if (y >= 0) {
      ctx.globalAlpha = k;
      ctx.drawImage(this.use(y), 0, 0);
      ctx.globalAlpha = 1;
    }
  }

  /** Forgets what the canvas shows, so the next show() draws again (a better frame may have arrived). */
  invalidate() {
    this.drawnA = -1;
    this.drawnB = -1;
  }

  /** The decoded frame closest to film time t, or -1 when none is decoded. */
  nearestDecoded(t) {
    let best = -1;
    let gap = Infinity;
    this.decoded.forEach((_, k) => {
      const d = Math.abs(this.set.frames[k] - t);
      if (d < gap || (d === gap && k < best)) {
        gap = d;
        best = k;
      }
    });
    return best;
  }

  /** A decoded frame, moved to the recent end of the order. */
  use(k) {
    const picture = this.decoded.get(k);
    if (!picture) return undefined;
    this.decoded.delete(k);
    this.decoded.set(k, picture);
    return picture;
  }

  url(k) {
    return `${keyframeUrl(this.set.base, this.set.frames[k], this.options.ext)}?v=${encodeURIComponent(this.options.revision)}`;
  }

  fetchNext() {
    while (!this.destroyed && this.fetching < 6 && this.queue.length) {
      const k = this.queue.shift();
      this.fetching += 1;
      fetch(this.url(k), { priority: "low" })
        .then((response) => (response.ok ? response.blob() : null))
        .catch(() => null)
        .then((blob) => {
          this.fetching -= 1;
          if (this.destroyed) return;
          if (blob) this.blobs.set(k, blob);
          this.pump();
          this.fetchNext();
        });
    }
  }

  /** Decodes the wanted window around the current frame (three at a time) and evicts what falls out of the cache. */
  pump() {
    if (this.destroyed) return;
    const want = decodeWindow(this.at, this.set.frames.length, this.dir, this.options.cache - 4, 3);
    for (const k of want) {
      if (this.decoding.size >= 3) break;
      if (this.decoded.has(k) || this.decoding.has(k) || !this.blobs.has(k)) continue;
      this.decode(k, want);
    }
  }

  decode(k, want) {
    this.decoding.add(k);
    const blob = this.blobs.get(k);
    // The server's content type is not trusted: the decoder gets the type the file name promises.
    const typed = blob.type === `image/${this.options.ext}` ? blob : new Blob([blob], { type: `image/${this.options.ext}` });
    const job =
      typeof createImageBitmap === "function"
        ? createImageBitmap(typed)
        : new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = this.url(k);
          });
    job
      .then((picture) => {
        this.decoding.delete(k);
        if (this.destroyed) return release(picture);
        this.decoded.set(k, picture);
        this.evict(want);
        this.invalidate();
        this.options.onFrame();
        this.pump();
      })
      .catch(() => {
        this.decoding.delete(k);
        this.blobs.delete(k);
        this.pump();
      });
  }

  /** Drops the least recently used frames outside the wanted window until the cache fits. */
  evict(want) {
    for (const k of [...this.decoded.keys()]) {
      if (this.decoded.size <= this.options.cache) break;
      if (want.includes(k)) continue;
      release(this.decoded.get(k));
      this.decoded.delete(k);
    }
  }
}
