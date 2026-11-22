import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

const DIR = new URL("../assets/js/", import.meta.url);
// The generated canvas bundle needs a browser; the hand-written modules only touch the page when they are called.
const own = (await readdir(DIR)).filter((f) => f.endsWith(".js") && f !== "story-canvas.js");

test("expected: every hand-written script of the site parses, and every one but the entry loads (one syntax error stops all of them)", async () => {
  assert.ok(own.includes("site.js") && own.includes("story.js"));
  // Parse each as a module, the entry included (it runs the page's scripts at once, so it is not executed here).
  for (const file of own) execFileSync(process.execPath, ["--check", fileURLToPath(new URL(file, DIR))], { stdio: "pipe" });
  for (const file of own.filter((f) => f !== "site.js")) await import(new URL(file, DIR));
});

test("edge: the site's entry imports only scripts that exist beside it", async () => {
  const site = await readFile(new URL("site.js", DIR), "utf8");
  const imported = [...site.matchAll(/from "\.\/([a-z-]+\.js)(?:\?v=\d+)?"/g)].map((m) => m[1]);
  assert.ok(imported.length >= 8);
  for (const file of imported) assert.ok(own.includes(file), file);
});

test("error: a module that declares a name twice is refused, as the browser refused story.js on 15. 11. 2026", async () => {
  const broken = "data:text/javascript," + encodeURIComponent("const near = 1; const near = 2;");
  await assert.rejects(() => import(broken), SyntaxError);
});
