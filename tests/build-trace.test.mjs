import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("preorder production function contains no googleapis dependency", async () => {
  const trace = JSON.parse(await readFile(
    new URL("../.next/server/app/api/preorder/route.js.nft.json", import.meta.url),
    "utf8",
  ));
  assert.ok(trace.files.length > 0);
  assert.deepEqual(trace.files.filter((file) => file.replaceAll("\\", "/").includes("/googleapis/")), []);
});

test("waitlist includes only Sheets API, without global Google API index", async () => {
  const trace = JSON.parse(await readFile(
    new URL("../.next/server/app/api/waitlist/route.js.nft.json", import.meta.url),
    "utf8",
  ));
  const files = trace.files.map((file) => file.replaceAll("\\", "/"));
  assert.ok(files.some((file) => file.endsWith("/googleapis/build/src/apis/sheets/index.js")));
  assert.ok(!files.some((file) => file.endsWith("/googleapis/build/src/apis/index.js") || file.includes("firebasestorage")));
});
