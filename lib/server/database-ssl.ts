import { X509Certificate } from "node:crypto";

// URI SSL flags otherwise replace pg's explicit CA and verification settings.
export function databaseConnectionConfig(
  connectionString: string,
  certificate?: string,
) {
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol))
    throw new Error("DATABASE_URL_INVALID");
  for (const key of [
    "ssl",
    "sslmode",
    "sslcert",
    "sslkey",
    "sslrootcert",
    "uselibpqcompat",
  ])
    url.searchParams.delete(key);
  const ca = certificate?.trim().replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
  if (ca) {
    try {
      new X509Certificate(ca);
    } catch {
      throw new Error("DATABASE_SSL_CA_INVALID");
    }
  }
  return {
    connectionString: url.toString(),
    ssl: { rejectUnauthorized: true, ...(ca ? { ca } : {}) },
  };
}
