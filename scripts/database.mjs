import { Pool } from "pg";
import { createSql } from "../lib/server/sql.ts";
import { readFile, readdir } from "node:fs/promises";
import { randomBytes, scryptSync } from "node:crypto";
try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error.code !== "ENOENT") throw new Error("ENV_FILE_INVALID");
}
const command = process.argv[2] ?? "check";
let sql;
let pool;
try {
  if (
    !process.env.DATABASE_URL ||
    process.env.DATABASE_URL.includes("[YOUR-PASSWORD]")
  )
    throw new Error("DATABASE_URL_REQUIRED");
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    ssl: {
      rejectUnauthorized: true,
      ...(process.env.DATABASE_SSL_CA
        ? { ca: process.env.DATABASE_SSL_CA.replace(/\\n/g, "\n") }
        : {}),
    },
    connectionTimeoutMillis: 10000,
    query_timeout: 30000,
  });
  pool.on("error", () => {});
  sql = createSql((text, values) => pool.query(text, values));
  const [version] =
    await sql`select current_setting('server_version_num')::int as version`;
  if (version.version < 170000 || version.version >= 180000)
    throw new Error("POSTGRES_17_REQUIRED");
  if (command === "check") console.log("PostgreSQL 17: подключение успешно.");
  else {
    if (!process.argv.includes("--apply"))
      throw new Error("EXPLICIT_APPLY_REQUIRED");
    if (command === "migrate") {
      const migration = await readFile(
        new URL("../db/001_initial.sql", import.meta.url),
        "utf8",
      );
      await sql.begin(async (tx) => {
        await tx.unsafe(migration);
      });
      console.log(
        "Схема northia и закрытый bucket northia-media подготовлены.",
      );
    } else if (command === "import") {
      const content = JSON.parse(
        await readFile("storage/content.json", "utf8"),
      );
      // Validate through the same application schema before any writes.
      const { contentSchema } = await import("../lib/content-schema.ts");
      const parsed = contentSchema.parse(content);
      let admin;
      try {
        const a = JSON.parse(await readFile("storage/admin.json", "utf8"));
        admin = { login: a.login, salt: a.salt, hash: a.hash };
      } catch (error) {
        if (error.code !== "ENOENT") throw new Error("ADMIN_FILE_INVALID");
      }
      await sql.begin(async (tx) => {
        await tx`select pg_advisory_xact_lock(778142001)`;
        const existing = await tx`select 1 from northia.site`;
        if (existing.length) throw new Error("DATABASE_ALREADY_INITIALIZED");
        await tx`insert into northia.site(id,revision,settings) values(true,${parsed.revision},${tx.json(parsed.settings)})`;
        for (const [position, p] of parsed.products.entries())
          await tx`insert into northia.products(slug,position,data) values(${p.slug},${position},${tx.json(p)})`;
        if (admin)
          await tx`insert into northia.admins(login,salt,hash) values(${admin.login},${admin.salt},${admin.hash}) on conflict do nothing`;
      });
      console.log(
        "Каталог и настройки импортированы. Исходные файлы сохранены. Старые сессии не переносятся.",
      );
    } else if (command === "media") {
      const base = process.env.SUPABASE_URL;
      const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!base || !key) throw new Error("STORAGE_ENV_REQUIRED");
      const url = new URL(base);
      if (
        url.protocol !== "https:" ||
        url.username ||
        url.password ||
        url.pathname !== "/"
      )
        throw new Error("INVALID_STORAGE_URL");
      let files = [];
      try {
        files = await readdir("storage/media");
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      for (const name of files) {
        if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(name)) continue;
        if ((await sql`select 1 from northia.media where name=${name}`).length)
          continue;
        const bytes = await readFile(`storage/media/${name}`);
        const mime = `image/${name.endsWith("jpg") ? "jpeg" : name.split(".").pop()}`;
        const res = await fetch(
          `${url.origin}/storage/v1/object/northia-media/${name}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${key}`,
              "Content-Type": mime,
              "x-upsert": "false",
            },
            body: bytes,
            signal: AbortSignal.timeout(15000),
          },
        );
        if (!res.ok) throw new Error("MEDIA_UPLOAD_FAILED");
        await sql`insert into northia.media(name,mime,bytes) values(${name},${mime},${bytes.length}) on conflict do nothing`;
      }
      console.log("Изображения импортированы; локальные оригиналы сохранены.");
    } else if (command === "admin") {
      const login = process.env.ADMIN_SETUP_LOGIN,
        password = process.env.ADMIN_SETUP_PASSWORD;
      if (
        !login ||
        login.length > 100 ||
        !password ||
        password.length < 8 ||
        password.length > 256
      )
        throw new Error("ADMIN_SETUP_ENV_REQUIRED");
      const salt = randomBytes(32).toString("hex"),
        hash = scryptSync(password, salt, 64).toString("hex");
      const rows =
        await sql`insert into northia.admins(login,salt,hash) values(${login},${salt},${hash}) on conflict do nothing returning login`;
      if (!rows.length) throw new Error("ADMIN_ALREADY_EXISTS");
      console.log("Администратор создан; пароль сохранён только в виде хеша.");
    } else throw new Error("UNKNOWN_COMMAND");
  }
} catch (error) {
  const known = [
    "DATABASE_URL_REQUIRED",
    "POSTGRES_17_REQUIRED",
    "EXPLICIT_APPLY_REQUIRED",
    "DATABASE_ALREADY_INITIALIZED",
    "STORAGE_ENV_REQUIRED",
    "INVALID_STORAGE_URL",
    "MEDIA_UPLOAD_FAILED",
    "ADMIN_SETUP_ENV_REQUIRED",
    "ADMIN_ALREADY_EXISTS",
    "UNKNOWN_COMMAND",
    "ADMIN_FILE_INVALID",
  ];
  console.error(
    known.includes(error.message)
      ? error.message
      : "DATABASE_OPERATION_FAILED (проверьте подключение, схему и входные файлы; секреты не выводятся)",
  );
  process.exitCode = 1;
} finally {
  if (pool) await pool.end();
}
