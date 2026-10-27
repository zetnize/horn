// Keep proxied uploads below Vercel Functions' 4.5 MB request limit.
export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
export const IMAGE_SIZE_MESSAGE =
  "Максимум 4 МБ. Уменьшите размер PNG и повторите загрузку.";

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
    !/^\/media\/[a-f0-9-]+\.png$/.test(result.path)
  )
    throw new Error("Сервер не подтвердил загрузку. Попробуйте ещё раз.");
  return result.path;
}
