#!/usr/bin/env node
/**
 * A local preview server that behaves like GitHub Pages where it matters: the right content types (AVIF, WebP, MP4,
 * WOFF2), byte ranges (video in Safari needs them), `index.html` for folders and `404.html` for unknown paths.
 * No dependencies. Usage: node serve.mjs [port]
 */
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { dirname, extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.argv[2] ?? 4173);

export const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".mp4": "video/mp4",
  ".woff2": "font/woff2",
};

/** The file a request path stands for, inside the root; null for a path that tries to leave it. */
export function resolvePath(root, urlPath) {
  let decoded;
  try {
    decoded = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  } catch {
    return null;
  }
  const safe = normalize(decoded).replace(/^(\.\.[/\\])+/, "");
  const full = join(root, safe);
  return full === root || full.startsWith(`${root}/`) ? full : null;
}

/** A byte range of a file of `size` bytes from a Range header, or null when there is none or it is not satisfiable. */
export function byteRange(header, size) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(header ?? "");
  if (!m || (m[1] === "" && m[2] === "")) return null;
  const start = m[1] === "" ? Math.max(size - Number(m[2]), 0) : Number(m[1]);
  const end = m[1] === "" || m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  return start <= end && start < size ? { start, end } : null;
}

async function fileFor(path) {
  if (!path) return null;
  try {
    const info = await stat(path);
    if (info.isDirectory()) return fileFor(join(path, "index.html"));
    return { path, size: info.size };
  } catch {
    return null;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  createServer(async (req, res) => {
    const found = await fileFor(resolvePath(ROOT, req.url ?? "/"));
    const file = found ?? (await fileFor(join(ROOT, "404.html")));
    if (!file) {
      res.writeHead(404).end("Not found");
      return;
    }
    const headers = { "Content-Type": TYPES[extname(file.path)] ?? "application/octet-stream", "Accept-Ranges": "bytes", "Cache-Control": "no-cache" };
    const range = found ? byteRange(req.headers.range, file.size) : null;
    if (range) {
      res.writeHead(206, { ...headers, "Content-Range": `bytes ${range.start}-${range.end}/${file.size}`, "Content-Length": range.end - range.start + 1 });
      createReadStream(file.path, range).pipe(res);
      return;
    }
    res.writeHead(found ? 200 : 404, { ...headers, "Content-Length": file.size });
    if (req.method === "HEAD") res.end();
    else createReadStream(file.path).pipe(res);
  }).listen(PORT, "127.0.0.1", () => console.log(`http://localhost:${PORT}/`));
}
