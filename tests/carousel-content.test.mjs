import test from "node:test";
import assert from "node:assert/strict";
import { settingsSchema, carouselSlideSchema } from "../lib/content-schema.ts";
import { defaultContent } from "../data/content-defaults.ts";
import { PGlite } from "@electric-sql/pglite";
import { createSql } from "../lib/server/sql.ts";
import { readDatabaseContent, saveDatabaseContent } from "../lib/server/db-content.ts";

test("legacy settings gain placeholders; carousel rejects unsafe links and oversized collections", () => {
  const { successCarousel, ...legacy } = defaultContent.settings;
  const parsed = settingsSchema.parse(legacy);
  assert.equal(parsed.successCarousel.enabled, true);
  assert.equal(parsed.successCarousel.slides.length, 3);
  for (const href of ["javascript:alert(1)", "//evil.example", "/\\evil.example", "data:text/html,test", "http://example.com"]) {
    assert.equal(carouselSlideSchema.safeParse({ ...successCarousel.slides[0], href }).success, false, href);
  }
  for (const href of ["", "/#catalog", "/product/tee-iron-milk", "https://example.com/path"]) {
    assert.equal(carouselSlideSchema.safeParse({ ...successCarousel.slides[0], href }).success, true, href);
  }
  assert.equal(settingsSchema.safeParse({ ...legacy, successCarousel: { enabled: true, slides: Array(11).fill(successCarousel.slides[0]) } }).success, false);
  assert.equal(settingsSchema.safeParse({ ...legacy, successCarousel: { enabled: false, slides: [] } }).success, true);
});

test("carousel saves and reloads in isolated PostgreSQL without a schema migration", async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema northia;
      create table northia.site(id boolean primary key,revision int,settings jsonb,updated_at timestamptz);
      create table northia.products(slug text primary key,position int,data jsonb);
      create table northia.content_history(revision int primary key,data jsonb);`);
    const { successCarousel, ...legacy } = defaultContent.settings;
    await db.query("insert into northia.site values(true,0,$1,now())", [JSON.stringify(legacy)]);
    const sql = createSql((text, values) => db.query(text, values));
    const content = await readDatabaseContent(sql);
    assert.equal(content.settings.successCarousel.slides.length, 3);
    content.settings.successCarousel = { enabled: true, slides: [
      { ...successCarousel.slides[1], title: "Второй", buttonText: "Каталог", href: "/#catalog" },
      { ...successCarousel.slides[0], title: "Первый" },
    ] };
    await saveDatabaseContent(content, sql);
    const saved = await readDatabaseContent(sql);
    assert.deepEqual(saved.settings.successCarousel, content.settings.successCarousel);
    await saveDatabaseContent({ ...saved, settings: { ...saved.settings, successCarousel: { enabled: false, slides: [] } } }, sql);
    assert.deepEqual((await readDatabaseContent(sql)).settings.successCarousel, { enabled: false, slides: [] });
  } finally { await db.close(); }
});
