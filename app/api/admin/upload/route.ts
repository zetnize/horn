import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { authenticated, sameOrigin } from "@/lib/server/admin-auth";
import { storageRoot } from "@/lib/server/content";
import { adminResponse, limitedBody } from "@/lib/server/admin-http";
import { database, databaseEnabled } from "@/lib/server/database";
import { uploadMedia } from "@/lib/server/storage";
import {
  MAX_IMAGE_BYTES,
  IMAGE_FORMAT_MESSAGE,
  IMAGE_SIZE_MESSAGE,
  uploadImageType,
} from "@/lib/admin-upload";
export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await authenticated()))
    return adminResponse({ message: "Требуется вход" }, 403);
  try {
    const bytes = await limitedBody(request, MAX_IMAGE_BYTES);
    const type = uploadImageType(bytes);
    if (!type) return adminResponse({ message: IMAGE_FORMAT_MESSAGE }, 400);
    const dir = path.join(storageRoot, "media");
    const name = `${randomUUID()}.${type.extension}`;
    if (databaseEnabled()) {
      const { mime } = type;
      await uploadMedia(name, bytes, mime);
      await database()`insert into northia.media(name,mime,bytes) values(${name},${mime},${bytes.length})`;
    } else {
      await mkdir(dir, { recursive: true });
      await writeFile(path.join(dir, name), bytes, { flag: "wx" });
    }
    return adminResponse({ path: `/media/${name}` });
  } catch (error) {
    if (error instanceof Error && error.message === "LIMIT")
      return adminResponse({ message: IMAGE_SIZE_MESSAGE }, 413);
    return adminResponse(
      {
        message:
          "Не удалось загрузить изображение. Проверьте файл и повторите попытку.",
      },
      400,
    );
  }
}
