import {
  authenticated,
  checkCredentials,
  endSession,
  sameOrigin,
  startSession,
} from "@/lib/server/admin-auth";
import { adminResponse, limitedBody } from "@/lib/server/admin-http";
const attempts: number[] = [];
export async function POST(request: Request) {
  if (!sameOrigin(request))
    return adminResponse({ message: "Запрос отклонён" }, 403);
  while (attempts.length && attempts[0] < Date.now() - 60000) attempts.shift();
  if (attempts.length >= 5)
    return adminResponse(
      { message: "Слишком много попыток. Подождите минуту." },
      429,
    );
  attempts.push(Date.now());
  try {
    const body = JSON.parse((await limitedBody(request, 2048)).toString());
    if (
      typeof body.login !== "string" ||
      typeof body.password !== "string" ||
      body.password.length > 256 ||
      !(await checkCredentials(body.login, body.password))
    )
      return adminResponse({ message: "Неверный логин или пароль" }, 401);
    await startSession(request);
    return adminResponse({ ok: true });
  } catch {
    return adminResponse(
      {
        message:
          "Не удалось выполнить вход. Проверьте настройку администратора.",
      },
      400,
    );
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request) || !(await authenticated()))
    return adminResponse({ message: "Требуется вход" }, 403);
  await endSession();
  return adminResponse({ ok: true });
}
