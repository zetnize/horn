import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import { submit } from "../lib/server/submit.ts";
import { sendScriptOrder } from "../lib/server/google-script.ts";
import { CONSENT_VERSION } from "../data/legal.ts";

test("actual Apps Script accepts website waitlist and legacy order contracts", async (t) => {
  const rows = { Заявки: [], "Лист ожидания": [] };
  const context = {
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: () => "fixture-secret" }),
    },
    SpreadsheetApp: {
      getActiveSpreadsheet: () => ({
        getSheetByName: (name) =>
          rows[name] ? { appendRow: (row) => rows[name].push(row) } : null,
      }),
    },
    ContentService: {
      MimeType: { JSON: "json" },
      createTextOutput: (value) => ({ setMimeType: () => value }),
    },
    console: { error: () => {} },
  };
  vm.createContext(context);
  vm.runInContext(
    await readFile(
      new URL("../scripts/google-apps-script.gs", import.meta.url),
      "utf8",
    ),
    context,
  );
  const info = JSON.parse(context.doGet());
  assert.equal(info.supportsWaitlist, true);
  assert.equal(info.version, "northia-2026-10-28-waitlist-v1");
  const previous = [
    process.env.GOOGLE_SCRIPT_URL,
    process.env.GOOGLE_SCRIPT_SECRET,
  ];
  t.after(() => {
    for (const [i, key] of [
      "GOOGLE_SCRIPT_URL",
      "GOOGLE_SCRIPT_SECRET",
    ].entries()) {
      if (previous[i] === undefined) delete process.env[key];
      else process.env[key] = previous[i];
    }
  });
  process.env.GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/fixture/exec";
  process.env.GOOGLE_SCRIPT_SECRET = "fixture-secret";
  t.mock.method(
    globalThis,
    "fetch",
    async (_url, options) =>
      new Response(context.doPost({ postData: { contents: options.body } }), {
        headers: { "Content-Type": "application/json" },
      }),
  );
  const request = new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Тест",
      contact: "@test",
      consent: true,
      consentVersion: CONSENT_VERSION,
    }),
  });
  const response = await submit(request, "waitlist", undefined, {
    rateLimit: async () => ({ allowed: true, retryAfter: 0 }),
    readContent: async () => {
      throw new Error("waitlist must not read catalog");
    },
  });
  assert.equal(response.status, 200);
  assert.equal(rows["Лист ожидания"].length, 1);
  assert.equal(rows["Лист ожидания"][0].length, 4);
  assert.equal(rows["Лист ожидания"][0][1], "Тест");
  assert.equal(rows["Лист ожидания"][0][2], "'@test");
  assert.ok(rows["Лист ожидания"][0][3].includes(CONSENT_VERSION));
  assert.equal(rows["Заявки"].length, 0);
  await sendScriptOrder({
    fullName: "Тест",
    phone: "+79991234567",
    contact: "@test",
    city: "Тест",
    pickupAddress: "Тест",
    comment: "",
  });
  assert.equal(rows["Заявки"].length, 1);
  assert.equal(rows["Заявки"][0].length, 8);
  const invalid = JSON.parse(
    context.doPost({
      postData: {
        contents: JSON.stringify({
          secret: "fixture-secret",
          type: "waitlist",
          name: "Test",
        }),
      },
    }),
  );
  assert.equal(invalid.error, "Invalid fields");
  assert.equal(rows["Лист ожидания"].length, 1);
});
