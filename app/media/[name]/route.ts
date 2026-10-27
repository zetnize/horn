import { readFile } from "node:fs/promises";
import path from "node:path";
import { storageRoot } from "@/lib/server/content";
import { database, databaseEnabled } from "@/lib/server/database";
import { readMedia } from "@/lib/server/storage";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  const { name } = await params;
  if (!/^[a-f0-9-]+\.(jpg|png|webp)$/.test(name))
    return new Response(null, { status: 404 });
  try {
    if (databaseEnabled()) {
      const rows =
        await database()`select mime from northia.media where name=${name}`;
      if (!rows.length) return new Response(null, { status: 404 });
      const result = await readMedia(name);
      if (!result.ok)
        return new Response(null, {
          status: result.status === 404 ? 404 : 503,
        });
      return new Response(result.body, {
        headers: {
          "Content-Type": rows[0].mime,
          "X-Content-Type-Options": "nosniff",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
      });
    }
    const bytes = await readFile(path.join(storageRoot, "media", name));
    const type = name.endsWith(".jpg") ? "jpeg" : name.split(".").pop();
    return new Response(bytes, {
      headers: {
        "Content-Type": `image/${type}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
