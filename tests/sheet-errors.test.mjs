import test from "node:test";
import assert from "node:assert/strict";
import { SheetRequestError } from "../lib/server/sheet-errors.ts";
import { submit } from "../lib/server/submit.ts";

test("Sheets diagnostics distinguish API disabled, permission and quota without forwarding bodies", () => {
  for (const reason of [
    "SERVICE_DISABLED",
    "ACCESS_TOKEN_SCOPE_INSUFFICIENT",
    "rateLimitExceeded",
  ]) {
    const error = new SheetRequestError(
      {
        response: {
          status: 403,
          data: {
            error: { status: "PERMISSION_DENIED", details: [{ reason }] },
          },
        },
      },
      "metadata",
    );

    assert.equal(error.status, 403);
    assert.equal(error.googleReason, reason);
    assert.equal(error.stage, "metadata");
  }
  const permission = new SheetRequestError(
    {
      response: {
        status: 403,
        data: { error: { errors: [{ reason: "forbidden" }] } },
      },
    },
    "append",
  );
  assert.equal(permission.googleReason, "forbidden");
  assert.equal(permission.stage, "append");
  const secret = "fake-sensitive-marker";
  const raw = {
    message: secret,
    response: {
      status: 403,
      data: {
        error: {
          message: secret,
          errors: [{ reason: secret }],
          details: [{ reason: secret }],
        },
      },
    },
    config: { headers: { Authorization: secret } },
  };
  const safe = new SheetRequestError(raw, "metadata");
  assert.equal(safe.googleReason, "unclassified");
  assert.ok(!JSON.stringify(safe).includes(secret));
  assert.ok(!safe.message.includes(secret));
});

test("waitlist logs safe diagnostics and never returns upstream details", async (t) => {
  const log = t.mock.method(console, "error", () => {});
  const request = new Request("http://localhost/api/waitlist", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Test",
      contact: "@test",
      consent: true,
      consentVersion: "2026-10-27",
    }),
  });
  const response = await submit(
    request,
    "waitlist",
    async () => {
      throw new SheetRequestError(
        {
          response: {
            status: 403,
            data: {
              error: {
                message: "private-marker",
                details: [{ reason: "SERVICE_DISABLED" }],
              },
            },
          },
        },
        "metadata",
      );
    },
    {
      rateLimit: async () => ({ allowed: true, retryAfter: 0 }),
      readContent: async () => {
        throw new Error("unexpected catalog read");
      },
    },
  );
  assert.equal(response.status, 500);
  const result = await response.json();
  assert.equal(result.ok, false);
  const details = log.mock.calls[0].arguments[1];
  assert.equal(details.status, 403);
  assert.equal(details.googleReason, "SERVICE_DISABLED");
  assert.equal(details.stage, "metadata");
  assert.ok(!JSON.stringify(log.mock.calls).includes("private-marker"));
  assert.ok(!JSON.stringify(result).includes("SERVICE_DISABLED"));
});
