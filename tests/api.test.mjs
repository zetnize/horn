import test from "node:test";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL ?? "http://127.0.0.1:3000";
let sequence = 1;
const valid = {
  name: "Тестовый Покупатель",
  phone: "+7 (999) 123-45-67",
  contact: "@northia_test",
  city: "Тестовый город",
  address: "Тестовый адрес",
  comment: "Автотест, не заказ",
  website: "",
  items: [{ slug: "tee-iron-milk", size: "S", qty: 2 }],
};
async function post(route, body, ip = `198.51.100.${sequence++}`) {
  return fetch(base + "/api/" + route, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}
test("server rejects unknown product and unavailable size", async () => {
  for (const item of [
    { slug: "missing", size: "S", qty: 1 },
    { slug: "tee-iron-milk", size: "L", qty: 1 },
    { slug: "tee-iron-milk", size: "S", qty: 0 },
    { slug: "tee-iron-milk", size: "S", qty: 1.5 },
  ]) {
    const response = await post("preorder", { ...valid, items: [item] });
    assert.equal(response.status, 400);
    assert.ok((await response.json()).errors.items);
  }
});
test("empty and duplicate cart lines are rejected", async () => {
  for (const items of [[], [valid.items[0], valid.items[0]]])
    assert.equal((await post("preorder", { ...valid, items })).status, 400);
});
test("server trims whitespace and checks field/phone limits", async () => {
  for (const change of [
    { name: "   " },
    { phone: "abcdefg" },
    { contact: "a".repeat(151) },
    { comment: "a".repeat(2001) },
  ])
    assert.equal((await post("preorder", { ...valid, ...change })).status, 400);
});
test("malformed, oversized and non-JSON requests are rejected", async () => {
  for (const body of ["{", " ".repeat(33000)]) {
    const response = await fetch(base + "/api/preorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `198.51.100.${sequence++}`,
      },
      body,
    });
    assert.equal(response.status, 400);
  }
  assert.equal(
    (await fetch(base + "/api/waitlist", { method: "POST", body: "hello" }))
      .status,
    400,
  );
});
test("honeypot succeeds without credentials or valid customer data", async () => {
  for (const route of ["preorder", "waitlist"]) {
    const response = await post(route, { website: "bot" });
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
  }
});
test("valid requests succeed in dev; production without config fails closed", async () => {
  for (const [route, data] of [
    ["preorder", { ...valid, price: 1, total: 1, nameOverride: "Fake" }],
    ["waitlist", { name: "Тест", contact: "@northia_test" }],
  ]) {
    const response = await post(route, data);
    assert.equal(
      response.status,
      process.env.TEST_PRODUCTION === "1" ? 500 : 200,
    );
    assert.equal(
      (await response.json()).ok,
      process.env.TEST_PRODUCTION !== "1",
    );
  }
});
test("rate limiter returns 429 and Retry-After on eleventh attempt", async () => {
  const ip = "203.0.113." + Math.floor(Math.random() * 250 + 1);
  for (let i = 0; i < 10; i++)
    assert.equal((await post("waitlist", { website: "bot" }, ip)).status, 200);
  const response = await post("waitlist", { website: "bot" }, ip);
  assert.equal(response.status, 429);
  assert.ok(Number(response.headers.get("retry-after")) > 0);
});
