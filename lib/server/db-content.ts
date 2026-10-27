import "server-only";
import { database } from "./database";
import { contentSchema, type Content } from "@/lib/content-schema";

export async function readDatabaseContent(sql = database()): Promise<Content> {
  const rows = await sql`select s.revision, s.settings,
    coalesce((select jsonb_agg(p.data order by p.position) from northia.products p), '[]'::jsonb) as products
    from northia.site s where id = true`;
  if (!rows.length) throw new Error("DATABASE_NOT_INITIALIZED");
  return contentSchema.parse(rows[0]);
}
export async function saveDatabaseContent(
  input: Content,
  sql = database(),
): Promise<Content> {
  const next = contentSchema.parse({ ...input, revision: input.revision + 1 });
  await sql.begin(async (tx) => {
    const rows =
      await tx`select revision from northia.site where id = true for update`;
    if (rows[0]?.revision !== input.revision) throw new Error("CONFLICT");
    await tx`insert into northia.content_history(revision, data)
      select s.revision, jsonb_build_object('revision',s.revision,'settings',s.settings,
        'products',coalesce((select jsonb_agg(data order by position) from northia.products),'[]'::jsonb))
      from northia.site s where id = true on conflict do nothing`;
    await tx`delete from northia.products`;
    for (const [position, product] of next.products.entries()) {
      await tx`insert into northia.products(slug,position,data) values(${product.slug},${position},${tx.json(product)})`;
    }
    await tx`update northia.site set revision=${next.revision},settings=${tx.json(next.settings)},updated_at=now() where id=true`;
  });
  return next;
}
