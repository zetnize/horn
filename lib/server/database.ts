import "server-only";
import { Pool } from "pg";
import { createSql, type Sql } from "./sql";

let client: Sql | undefined;
export function databaseEnabled() {
  return !!process.env.DATABASE_URL;
}
export function database() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_NOT_CONFIGURED");
  if (!client) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      ssl: {
        rejectUnauthorized: true,
        ...(process.env.DATABASE_SSL_CA
          ? { ca: process.env.DATABASE_SSL_CA.replace(/\\n/g, "\n") }
          : {}),
      },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 20000,
      query_timeout: 15000,
    });
    pool.on("error", () => {});
    client = createSql(
      (text, values) => pool.query(text, values),
      async (work) => {
        const connection = await pool.connect();
        try {
          return await createSql((text, values) =>
            connection.query(text, values),
          ).begin(work);
        } finally {
          connection.release();
        }
      },
    );
  }
  return client;
}
