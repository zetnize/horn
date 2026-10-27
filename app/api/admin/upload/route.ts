import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { authenticated, sameOrigin } from "@/lib/server/admin-auth";
import { storageRoot } from "@/lib/server/content";
import { adminResponse, limitedBody } from "@/lib/server/admin-http";
export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await authenticated()))
    return adminResponse({ message: "Требуется вход" }, 403);
  try {
    const bytes = await limitedBody(request, 8 * 1024 * 1024);
    const ext = bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
      ? "png"
      : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        ? "jpg"
        : bytes.toString("ascii", 0, 4) === "RIFF" &&
            bytes.toString("ascii", 8, 12) === "WEBP"
          ? "webp"
          : null;
    if (!ext)
      return adminResponse(
        { message: "Выберите изображение JPEG, PNG или WebP" },
        400,
      );
    const dir = path.join(storageRoot, "media");
    await mkdir(dir, { recursive: true });
    const name = `${randomUUID()}.${ext}`;
    await writeFile(path.join(dir, name), bytes, { flag: "wx" });
    return adminResponse({ path: `/media/${name}` });
  } catch {
    return adminResponse(
      { message: "Не удалось загрузить изображение. Максимум 8 МБ." },
      400,
    );
  }
}
