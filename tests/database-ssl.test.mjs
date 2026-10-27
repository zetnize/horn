import test from "node:test";
import assert from "node:assert/strict";
import { rootCertificates } from "node:tls";
import { Client } from "pg";
import { databaseConnectionConfig } from "../lib/server/database-ssl.ts";

test("CA accepts multiline PEM and literal newline escapes", () => {
  const pem = rootCertificates[0].trim();
  for (const value of [
    pem,
    pem.replace(/\n/g, "\\n"),
    pem.replace(/\n/g, "\r\n"),
  ]) {
    const config = databaseConnectionConfig(
      "postgresql://test:test@localhost:6543/postgres",
      value,
    );
    assert.equal(config.ssl.ca, pem);
    assert.equal(config.ssl.rejectUnauthorized, true);
  }
});
test("URI SSL flags cannot replace verified TLS configuration in pg", () => {
  const config = databaseConnectionConfig(
    "postgresql://test:test@localhost:6543/postgres?sslmode=no-verify&sslrootcert=missing&sslcert=missing&sslkey=missing&ssl=false&uselibpqcompat=true&application_name=northia",
    rootCertificates[0],
  );
  const client = new Client(config);
  assert.equal(client.connectionParameters.ssl.ca, rootCertificates[0].trim());
  assert.equal(client.connectionParameters.ssl.rejectUnauthorized, true);
  const url = new URL(config.connectionString);
  assert.equal(url.searchParams.get("application_name"), "northia");
  assert.equal(url.searchParams.has("sslmode"), false);
});
test("invalid CA fails before connection and missing CA keeps verification enabled", () => {
  assert.throws(
    () =>
      databaseConnectionConfig(
        "postgresql://localhost/postgres",
        "not a certificate",
      ),
    /DATABASE_SSL_CA_INVALID/,
  );
  assert.deepEqual(
    databaseConnectionConfig("postgresql://localhost/postgres").ssl,
    { rejectUnauthorized: true },
  );
});
