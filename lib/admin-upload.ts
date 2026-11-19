// Keep proxied uploads below Vercel Functions' 4.5 MB request limit.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const MAX_JPEG_INPUT_BYTES = 10 * 1024 * 1024;
export const IMAGE_SIZE_MESSAGE =
  "Файл для отправки превышает 4 МБ. Уменьшите изображение и повторите загрузку.";
export const IMAGE_FORMAT_MESSAGE = "Выберите изображение в формате JPG или PNG.";

export function uploadImageType(bytes: Uint8Array) {
  if ([137, 80, 78, 71, 13, 10, 26, 10].every((byte, i) => bytes[i] === byte))
    return { extension: "png", mime: "image/png" } as const;
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255)
    return { extension: "jpg", mime: "image/jpeg" } as const;
  return null;
}

export async function prepareImageUpload(file: File) {
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const type = uploadImageType(header);
  if (!type) throw new Error(IMAGE_FORMAT_MESSAGE);
  if (file.size <= MAX_IMAGE_BYTES) return file.slice(0, file.size, type.mime);
  if (type.extension === "png")
    throw new Error("PNG должен быть не больше 4 МБ.");
  if (file.size > MAX_JPEG_INPUT_BYTES)
    throw new Error("JPG должен быть не больше 10 МБ.");

  const image = await createImageBitmap(file).catch(() => {
    throw new Error("Не удалось открыть JPG. Проверьте файл и повторите загрузку.");
  });
  const canvas = document.createElement("canvas");
  try {
    const context = canvas.getContext("2d");
    if (!context) throw new Error(IMAGE_SIZE_MESSAGE);
    for (const [maxEdge, quality] of [[2560, 0.92], [2560, 0.8], [1920, 0.8]]) {
      const scale = Math.min(1, maxEdge / Math.max(image.width, image.height));
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const compressed = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", quality),
      );
      if (compressed?.type === type.mime && compressed.size <= MAX_IMAGE_BYTES)
        return compressed;
    }
    throw new Error(IMAGE_SIZE_MESSAGE);
  } finally {
    image.close();
    canvas.width = canvas.height = 0;
  }
}

export async function uploadedImagePath(response: Response): Promise<string> {
  if (response.status === 413) throw new Error(IMAGE_SIZE_MESSAGE);
  if (response.status === 401 || response.status === 403)
    throw new Error("Сессия истекла. Войдите в админку снова.");
  const result: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      result &&
      typeof result === "object" &&
      "message" in result &&
      typeof result.message === "string"
        ? result.message
        : "Не удалось загрузить изображение. Попробуйте ещё раз.";
    throw new Error(message);
  }
  if (
    !result ||
    typeof result !== "object" ||
    !("path" in result) ||
    typeof result.path !== "string" ||
    !/^\/media\/[a-f0-9-]+\.(?:jpg|png)$/.test(result.path)
  )
    throw new Error("Сервер не подтвердил загрузку. Попробуйте ещё раз.");
  return result.path;
}
