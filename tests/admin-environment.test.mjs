import test from "node:test";
import assert from "node:assert/strict";
import {
  environmentAdmin,
  matchesEnvironmentAdmin,
  adminSessionHash,
} from "../lib/server/admin-environment.ts";

test("environment credentials override, fail closed, and invalidate sessions on change", (t) => {
  const saved = {
    ADMIN_LOGIN: process.env.ADMIN_LOGIN,
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  };
  t.after(() => {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
  delete process.env.ADMIN_LOGIN;
  delete process.env.ADMIN_PASSWORD;
  assert.equal(environmentAdmin(), null);
  assert.equal(matchesEnvironmentAdmin("test", "test"), null);
  const token = "a".repeat(64);
  const original = adminSessionHash(token);
  process.env.ADMIN_LOGIN = "Vikt_246";
  assert.throws(
    () => matchesEnvironmentAdmin("Vikt_246", "test"),
    /ADMIN_ENV_INVALID/,
  );
  process.env.ADMIN_PASSWORD = "test-only-long-password";
  assert.equal(
    matchesEnvironmentAdmin("Vikt_246", "test-only-long-password"),
    true,
  );
  assert.equal(
    matchesEnvironmentAdmin("other", "test-only-long-password"),
    false,
  );
  assert.equal(matchesEnvironmentAdmin("Vikt_246", "wrong"), false);
  const first = adminSessionHash(token);
  assert.notEqual(first, original);
  process.env.ADMIN_PASSWORD = "test-only-new-password";
  assert.notEqual(adminSessionHash(token), first);
  const second = adminSessionHash(token);
  process.env.ADMIN_LOGIN = "changed";
  assert.notEqual(adminSessionHash(token), second);
  process.env.ADMIN_PASSWORD = "short";
  assert.throws(() => adminSessionHash(token), /ADMIN_ENV_INVALID/);
});
