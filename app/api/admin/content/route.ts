import { authenticated, sameOrigin } from "@/lib/server/admin-auth";
import { adminResponse, limitedBody } from "@/lib/server/admin-http";
import { readContent, saveContent } from "@/lib/server/content";
import { contentSchema } from "@/lib/content-schema";
export async function GET() {
  if (!(await authenticated()))
    return adminResponse({ message: "Требуется вход" }, 401);
  return adminResponse(await readContent());
}
export async function PUT(request: Request) {
  if (!sameOrigin(request) || !(await authenticated()))
    return adminResponse({ message: "Требуется вход" }, 403);
  try {
    const parsed = contentSchema.safeParse(
      JSON.parse((await limitedBody(request, 2 * 1024 * 1024)).toString()),
    );
    if (!parsed.success)
      return adminResponse(
        {
          message: parsed.error.issues
            .map((i) => `${i.path.join(".")}: ${i.message}`)
            .join("; "),
        },
        400,
      );
    return adminResponse(await saveContent(parsed.data));
  } catch (error) {
    if (error instanceof Error && error.message === "CONFLICT")
      return adminResponse(
        {
          message:
            "Данные изменены в другой вкладке. Скопируйте свои правки и перезагрузите страницу.",
        },
        409,
      );
    return adminResponse({ message: "Не удалось сохранить данные" }, 400);
  }
}
