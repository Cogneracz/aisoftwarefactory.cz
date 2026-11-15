import assert from "node:assert/strict";
import { test } from "node:test";
import { TYPES, byteRange, resolvePath } from "../serve.mjs";

test("expected: the preview server knows the site's file types and maps paths into the root", () => {
  assert.equal(TYPES[".avif"], "image/avif");
  assert.equal(TYPES[".mp4"], "video/mp4");
  assert.equal(TYPES[".woff2"], "font/woff2");
  assert.equal(resolvePath("/site", "/forge/"), "/site/forge/");
  assert.equal(resolvePath("/site", "/assets/site.css?v=2#x"), "/site/assets/site.css");
  assert.deepEqual(byteRange("bytes=0-99", 1000), { start: 0, end: 99 });
});

test("edge: open ranges, a suffix range, a range past the end, encoded characters", () => {
  assert.deepEqual(byteRange("bytes=500-", 1000), { start: 500, end: 999 });
  assert.deepEqual(byteRange("bytes=-200", 1000), { start: 800, end: 999 });
  assert.deepEqual(byteRange("bytes=900-5000", 1000), { start: 900, end: 999 });
  assert.equal(byteRange(undefined, 1000), null);
  assert.equal(resolvePath("/site", "/a%20b.txt"), "/site/a b.txt");
  assert.equal(resolvePath("/site", "/"), "/site/");
});

test("error: a path that climbs out of the root, a broken encoding and an unsatisfiable range are refused", () => {
  for (const path of ["/../secret.txt", "/..%2f..%2fetc/passwd", "/a/../../b"]) {
    const resolved = resolvePath("/site", path);
    assert.ok(resolved === null || resolved === "/site" || resolved.startsWith("/site/"), `${path} -> ${resolved}`);
  }
  assert.equal(resolvePath("/site", "/%E0%A4%A"), null);
  assert.equal(byteRange("bytes=2000-3000", 1000), null);
  assert.equal(byteRange("bytes=-", 1000), null);
  assert.equal(byteRange("items=0-5", 1000), null);
});
