import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createSql } from "../lib/server/sql.ts";
import {
  readDatabaseContent,
  saveDatabaseContent,
} from "../lib/server/db-content.ts";
import { saveOrder, saveWaiting } from "../lib/server/db-requests.ts";
import { defaultContent } from "../data/content-defaults.ts";
import { rateLimit } from "../lib/server/rate-limit.ts";

test("migration, private tables, catalog constraints and order snapshots (isolated PostgreSQL engine)", async () => {
  const db = new PGlite();
  try {
    // Minimal Supabase platform fixtures, no remote connection or real user data.
    await db.exec(`create role anon; create role authenticated; create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
    const migration = await readFile(
      new URL("../db/001_initial.sql", import.meta.url),
      "utf8",
    );
    await db.exec(migration);
    await db.exec(migration);
    const tables = await db.query(
      `select relname,relrowsecurity from pg_class join pg_namespace n on n.oid=relnamespace where n.nspname='northia' and relkind='r'`,
    );
    assert.equal(tables.rows.length, 9);
    assert.ok(tables.rows.every((t) => t.relrowsecurity));
    const grants = await db.query(
      `select has_schema_privilege('anon','northia','usage') as allowed`,
    );
    assert.equal(grants.rows[0].allowed, false);
    assert.equal(
      (
        await db.query(
          `select public from storage.buckets where id='northia-media'`,
        )
      ).rows[0].public,
      false,
    );
    await db.query(
      `insert into northia.site(id,revision,settings) values(true,0,'{}')`,
    );
    await db.query(
      `insert into northia.products(slug,position,data) values('tee',0,$1)`,
      [JSON.stringify({ slug: "tee", price: 4980 })],
    );
    await assert.rejects(
      db.query(
        `insert into northia.products(slug,position,data) values('wrong',1,'{"slug":"other"}')`,
      ),
    );
    const snapshot = [{ slug: "tee", qty: 2, price: 4980 }];
    await db.query(
      `insert into northia.orders(id,customer,items,total,consent_version) values('00000000-0000-4000-8000-000000000001','{}',$1,9960,'2026-10-27')`,
      [JSON.stringify(snapshot)],
    );
    await db.query(
      `update northia.products set data='{"slug":"tee","price":6000}' where slug='tee'`,
    );
    const order = (
      await db.query(`select items,total,consent_at from northia.orders`)
    ).rows[0];
    assert.deepEqual(order.items, snapshot);
    assert.equal(Number(order.total), 9960);
    assert.ok(order.consent_at);
    await assert.rejects(
      db.query(
        `insert into northia.waitlist(id,name,contact,consent_version) values('00000000-0000-4000-8000-000000000002','Test','@test',null)`,
      ),
    );
  } finally {
    await db.close();
  }
});

test("application repositories: catalog conflict rollback, parameter binding, orders and waitlist", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);`);
    await db.exec(
      await readFile(new URL("../db/001_initial.sql", import.meta.url), "utf8"),
    );
    const sql = createSql((text, values) => db.query(text, values));
    const content = structuredClone(defaultContent);
    await sql`insert into northia.site(id,revision,settings) values(true,${content.revision},${sql.json(content.settings)})`;
    for (const [position, p] of content.products.entries())
      await sql`insert into northia.products(slug,position,data) values(${p.slug},${position},${sql.json(p)})`;
    assert.deepEqual(await readDatabaseContent(sql), content);
    const next = await saveDatabaseContent(content, sql);
    await assert.rejects(saveDatabaseContent(content, sql), /CONFLICT/);
    assert.deepEqual(await readDatabaseContent(sql), next);
    assert.equal(
      (await sql`select count(*)::int as n from northia.content_history`)[0].n,
      1,
    );
    const product = next.products[0];
    const input = {
      name: "Test'); DROP TABLE northia.products; --",
      phone: "+79991234567",
      contact: "@test",
      city: "Test",
      address: "Test",
      comment: "",
      consent: true,
      consentVersion: "2026-10-27",
      items: [{ slug: product.slug, size: product.sizes[0], qty: 2 }],
    };
    const id = await saveOrder(input, sql);
    const [order] = await sql`select * from northia.orders where id=${id}`;
    assert.equal(order.customer.name, input.name);
    assert.equal(Number(order.total), product.price * 2);
    assert.equal(order.items[0].price, product.price);
    await assert.rejects(
      saveOrder(
        { ...input, items: [{ slug: "missing", size: "S", qty: 1 }] },
        sql,
      ),
      /UNAVAILABLE_PRODUCT/,
    );
    assert.equal(
      (await sql`select count(*)::int as n from northia.orders`)[0].n,
      1,
    );
    await saveWaiting(
      {
        name: "Test",
        contact: "@test",
        consent: true,
        consentVersion: "2026-10-27",
      },
      sql,
    );
    assert.equal(
      (await sql`select consent_version from northia.waitlist`)[0]
        .consent_version,
      "2026-10-27",
    );
    const request = new Request("http://localhost/api/waitlist", {
      headers: { "x-forwarded-for": "192.0.2.1" },
    });
    for (let i = 0; i < 10; i++)
      assert.equal((await rateLimit(request, "waitlist", sql)).allowed, true);
    const blocked = await rateLimit(request, "waitlist", sql);
    assert.equal(blocked.allowed, false);
    assert.ok(blocked.retryAfter > 0);
    for (let i = 0; i < 5; i++)
      assert.equal(
        (await rateLimit(request, "admin-login", sql)).allowed,
        true,
      );
    assert.equal((await rateLimit(request, "admin-login", sql)).allowed, false);
  } finally {
    await db.close();
  }
});
