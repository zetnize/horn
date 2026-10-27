import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { authenticated, sameOrigin } from "@/lib/server/admin-auth";
import { storageRoot } from "@/lib/server/content";
import { adminResponse, limitedBody } from "@/lib/server/admin-http";
import { database, databaseEnabled } from "@/lib/server/database";
import { uploadMedia } from "@/lib/server/storage";
export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await authenticated()))
    return adminResponse({ message: "Требуется вход" }, 403);
  try {
    const bytes = await limitedBody(request, 8 * 1024 * 1024);
    const png = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (!png)
      return adminResponse(
        { message: "Выберите изображение в формате PNG" },
        400,
      );
    const dir = path.join(storageRoot, "media");
    const name = `${randomUUID()}.png`;
    if (databaseEnabled()) {
      const mime = "image/png";
      await uploadMedia(name, bytes, mime);
      await database()`insert into northia.media(name,mime,bytes) values(${name},${mime},${bytes.length})`;
    } else {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, name), bytes, { flag: "wx" });
    }
    return adminResponse({ path: `/media/${name}` });
  } catch {
    return adminResponse(
      { message: "Не удалось загрузить изображение. Максимум 8 МБ." },
      400,
    );
  }
}
