import test from "node:test";
import assert from "node:assert/strict";
import { sendScriptOrder } from "../lib/server/google-script.ts";
import { submit } from "../lib/server/submit.ts";
import { readContent } from "../lib/server/content.ts";
import { formatPrice } from "../data/products.ts";

const order = {
  fullName: "Тестовый Покупатель",
  phone: "+79991234567",
  contact: "@test",
  city: "Тестовый город",
  pickupAddress: "Тестовый ПВЗ",
  comment: "Тест, не заказ",
};

test("Apps Script transport and real preorder handler (network fully mocked)", async (t) => {
  const keys = ["GOOGLE_SCRIPT_URL", "GOOGLE_SCRIPT_SECRET"];
  const previous = keys.map((key) => process.env[key]);
  t.after(() =>
    keys.forEach((key, index) => {
      if (previous[index] === undefined) delete process.env[key];
      else process.env[key] = previous[index];
    }),
  );
  process.env.GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/test/exec";
  process.env.GOOGLE_SCRIPT_SECRET = "test-only-secret";
  const fetchMock = t.mock.method(globalThis, "fetch", async () =>
    Response.json({ ok: true }),
  );
  for (const confirmation of [
    { ok: true },
    { success: true },
    { status: "success" },
  ]) {
    fetchMock.mock.mockImplementation(async () => Response.json(confirmation));
    await sendScriptOrder(order);
  }
  const [url, options] = fetchMock.mock.calls[0].arguments;
  assert.equal(url.hostname, "script.google.com");
  assert.equal(options.method, "POST");
  assert.equal(options.redirect, "follow");
  assert.equal(options.cache, "no-store");
  assert.ok(options.signal instanceof AbortSignal);
  assert.deepEqual(JSON.parse(options.body), {
    ...order,
    secret: "test-only-secret",
  });
  for (const [error, reason] of [
    ["Unauthorized", "script-unauthorized"],
    ["Invalid fields", "script-invalid-fields"],
    ["Sheet not found", "script-sheet-not-found"],
    ["Server error", "script-server-error"],
  ]) {
    fetchMock.mock.mockImplementation(async () =>
      Response.json({ success: false, error }),
    );
    await assert.rejects(
      sendScriptOrder(order),
      (failure) => failure.reason === reason && failure.status === 200,
    );
  }

  for (const body of [
    null,
    [],
    {},
    { message: "saved" },
    { ok: "true" },
    { ok: false },
    { success: false },
    { status: "error" },
    { ok: true, error: "failed" },
    { ok: true, success: false },
    { success: true, status: "error" },
  ]) {
    fetchMock.mock.mockImplementation(async () => Response.json(body));
    await assert.rejects(sendScriptOrder(order), /invalid-response/);
  }
  for (const [reply, reason, status] of [
    [new Response("<html>Login</html>"), "invalid-json", 200],
    [new Response("failed", { status: 503 }), "http-error", 503],
  ]) {
    fetchMock.mock.mockImplementation(async () => reply);
    await assert.rejects(
      sendScriptOrder(order),
      (error) => error.reason === reason && error.status === status,
    );
  }
  for (const failure of [
    new TypeError("network"),
    new DOMException("timeout", "TimeoutError"),
  ]) {
    const before = fetchMock.mock.callCount();
    fetchMock.mock.mockImplementation(async () => {
      throw failure;
    });
    await assert.rejects(
      sendScriptOrder(order),
      failure.name === "TimeoutError" ? /timeout/ : /request-failed/,
    );
    assert.equal(fetchMock.mock.callCount(), before + 1, "no automatic retry");
  }
  for (const endpoint of [
    "",
    "broken",
    "http://script.google.com/macros/s/test/exec",
    "https://example.com/macros/s/test/exec",
    "https://script.google.com/macros/s/test/dev",
  ]) {
    process.env.GOOGLE_SCRIPT_URL = endpoint;
    const before = fetchMock.mock.callCount();
    await assert.rejects(sendScriptOrder(order), /missing-env|invalid-url/);
    assert.equal(fetchMock.mock.callCount(), before);
  }
  process.env.GOOGLE_SCRIPT_URL =
    "https://script.google.com/macros/s/test/exec";
  delete process.env.GOOGLE_SCRIPT_SECRET;
  await assert.rejects(sendScriptOrder(order), /missing-env/);
  process.env.GOOGLE_SCRIPT_SECRET = "test-only-secret";
  const { products } = await readContent();
  const product = products.find((p) => !p.hidden && p.sizes.length);
  assert.ok(product);
  const input = {
    consent: true,
    consentVersion: "2026-10-27",
    name: order.fullName,
    phone: order.phone,
    contact: order.contact,
    city: order.city,
    address: order.pickupAddress,
    comment: order.comment,
    items: [{ slug: product.slug, size: product.sizes[0], qty: 2 }],
    price: 1,
    total: 1,
  };
  let sequence = 0;
  function request(body = input) {
    return new Request("http://localhost/api/preorder", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-forwarded-for": `test-${sequence++}`,
      },
      body: JSON.stringify(body),
    });
  }
  fetchMock.mock.mockImplementation(async () =>
    Response.json({ success: true }),
  );
  const response = await submit(request(), "preorder");
  assert.equal(response.status, 200);
  const result = await response.json();
  assert.equal(result.ok, true);
  const sent = JSON.parse(fetchMock.mock.calls.at(-1).arguments[1].body);
  assert.deepEqual(
    Object.keys(sent).sort(),
    [...Object.keys(order), "orderItems", "secret"].sort(),
  );
  for (const key of ["fullName", "phone", "contact", "city", "pickupAddress"])
    assert.equal(sent[key], order[key]);
  assert.equal(sent.orderItems, `${product.name} / ${product.sizes[0]} / ${product.color} / 2 / ${formatPrice(product.price)}`);
  for (const text of [
    order.comment,
    result.id,
    product.name,
    product.sizes[0],
    product.color,
    " / 2 / ",
    formatPrice(product.price),
    `Итого: ${formatPrice(product.price * 2)}`,
  ])
    assert.ok(sent.comment.includes(text), `comment includes ${text}`);

  const log = t.mock.method(console, "error", () => {});
  fetchMock.mock.mockImplementation(async () =>
    Response.json({ ok: false, error: order.phone }),
  );
  assert.equal((await submit(request(), "preorder")).status, 500);
  assert.ok(!JSON.stringify(log.mock.calls).includes(order.phone));
  const before = fetchMock.mock.callCount();
  assert.equal(
    (await submit(request({ ...input, city: "x".repeat(101) }), "preorder"))
      .status,
    400,
  );
  const tooLong = await submit(
    request({ ...input, comment: "x".repeat(2000) }),
    "preorder",
  );
  assert.equal(tooLong.status, 400);
  assert.ok((await tooLong.json()).errors.comment);
  assert.equal(
    (await submit(request({ ...input, phone: "bad" }), "preorder")).status,
    400,
  );
  assert.equal(
    (await submit(request({ website: "bot" }), "preorder")).status,
    200,
  );
  assert.equal(fetchMock.mock.callCount(), before);
  for (const consent of [undefined, false, "true"]) {
    assert.equal(
      (await submit(request({ ...input, consent }), "preorder")).status,
      400,
    );
  }
  assert.equal(
    (await submit(request({ ...input, consentVersion: "old" }), "preorder"))
      .status,
    400,
  );
  assert.equal(fetchMock.mock.callCount(), before);
  assert.match(
    sent.comment,
    /Согласие: 2026-10-27; принято: .*; форма: preorder/,
  );
  // DATABASE_URL must not switch submissions away from Google Sheets.
  const catalog = await readContent();
  const previousDatabase = process.env.DATABASE_URL;
  t.after(() => {
    if (previousDatabase === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previousDatabase;
  });
  process.env.DATABASE_URL = "postgresql://test:test@127.0.0.1:1/not-used";
  const services = {
    rateLimit: async () => ({ allowed: true, retryAfter: 0 }),
    readContent: async () => catalog,
  };
  fetchMock.mock.mockImplementation(async () =>
    Response.json({ success: true }),
  );
  const callsBefore = fetchMock.mock.callCount();
  assert.equal(
    (await submit(request(), "preorder", undefined, services)).status,
    200,
  );
  assert.equal(fetchMock.mock.callCount(), callsBefore + 1);
  let waiting = 0;
  const waitlist = {
    name: "Тест",
    contact: "@test",
    consent: true,
    consentVersion: "2026-10-27",
  };
  assert.equal(
    (
      await submit(
        request(waitlist),
        "waitlist",
        async (data) => {
          assert.equal(data.contact, waitlist.contact);
          waiting++;
        },
        services,
      )
    ).status,
    200,
  );
  assert.equal(waiting, 1);
  assert.equal(fetchMock.mock.callCount(), callsBefore + 1);
  assert.equal(
    (await submit(request(waitlist), "waitlist", undefined, services)).status,
    200,
  );
  const waitingSent = JSON.parse(fetchMock.mock.calls.at(-1).arguments[1].body);
  assert.deepEqual(waitingSent, {
    type: "waitlist",
    name: waitlist.name,
    contact: waitlist.contact,
    consentVersion: waitlist.consentVersion,
    secret: "test-only-secret",
  });
  fetchMock.mock.mockImplementation(async () =>
    Response.json({ success: false, error: "Sheet not found" }),
  );
  assert.equal(
    (await submit(request(waitlist), "waitlist", undefined, services)).status,
    500,
  );
  fetchMock.mock.mockImplementation(async () =>
    Response.json({ success: false, error: "Invalid fields" }),
  );
  assert.equal(
    (await submit(request(waitlist), "waitlist", undefined, services)).status,
    500,
  );
  fetchMock.mock.mockImplementation(async () =>
    Response.json({ success: false }),
  );
  assert.equal(
    (await submit(request(), "preorder", undefined, services)).status,
    500,
  );
});
