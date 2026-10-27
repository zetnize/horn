import { databaseConnectionConfig } from "./database-ssl";
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
      ...databaseConnectionConfig(
        process.env.DATABASE_URL,
        process.env.DATABASE_SSL_CA,
      ),
      max: 1,
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
