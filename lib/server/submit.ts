import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { formatPrice } from "@/data/products";
import {
  preorderSchema,
  waitlistSchema,
  type WaitlistInput,
} from "@/lib/validation";
import { SheetConfigurationError, SheetRequestError } from "./sheet-errors";
import { SHEETS } from "./sheet-values";
import { readContent } from "./content";
import { rateLimit } from "./rate-limit";
import {
  ScriptError,
  sendScriptOrder,
  sendScriptWaitlist,
} from "./google-script";
const MAX_BODY_BYTES = 32_768;
class BodyError extends Error {}
async function readBody(request: Request): Promise<unknown> {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new BodyError("Ожидается JSON");
  if (Number(request.headers.get("content-length")) > MAX_BODY_BYTES)
    throw new BodyError("Слишком большой запрос");
  const reader = request.body?.getReader();
  if (!reader) throw new BodyError("Пустой запрос");
  const decoder = new TextDecoder();
  let text = "";
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_BODY_BYTES) {
        await reader.cancel();
        throw new BodyError("Слишком большой запрос");
      }
      text += decoder.decode(chunk.value, { stream: true });
    }
    text += decoder.decode();
    return JSON.parse(text);
  } catch (error) {
    if (error instanceof BodyError) throw error;
    throw new BodyError("Некорректный JSON");
  } finally {
    reader.releaseLock();
  }
}
function response(
  body: object,
  status = 200,
  headers: Record<string, string> = {},
) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}
function invalid(error: z.ZodError) {
  return response(
    {
      ok: false,
      message: "Проверьте поля формы и состав корзины",
      errors: z.flattenError(error).fieldErrors,
    },
    400,
  );
}
export async function submit(
  request: Request,
  mode: "preorder" | "waitlist",
  saveWaitlist: (input: WaitlistInput) => Promise<void> = sendScriptWaitlist,
  services = { rateLimit, readContent },
) {
  let limit;
  try {
    limit = await services.rateLimit(request, mode);
  } catch {
    return response(
      { ok: false, message: "Приём заявок временно недоступен" },
      503,
    );
  }
  if (!limit.allowed)
    return response(
      { ok: false, message: "Слишком много попыток. Попробуйте позже." },
      429,
      { "Retry-After": String(limit.retryAfter) },
    );
  let body: unknown;
  try {
    body = await readBody(request);
  } catch (error) {
    return response(
      {
        ok: false,
        message:
          error instanceof BodyError ? error.message : "Некорректный запрос",
      },
      400,
    );
  }
  // Bots receive a successful answer without validation, logging or external writes.
  if (
    body &&
    typeof body === "object" &&
    "website" in body &&
    typeof body.website === "string" &&
    body.website.trim()
  )
    return response({ ok: true });
  try {
    if (mode === "preorder") {
      const parsed = preorderSchema.safeParse(body);
      if (!parsed.success) return invalid(parsed.error);
      const input = parsed.data;
      const { products } = await services.readContent();
      const getProduct = (slug: string) =>
        products.find((p) => p.slug === slug && !p.hidden);
      if (input.items.some((i) => !getProduct(i.slug)?.sizes.includes(i.size)))
        return response(
          {
            ok: false,
            message: "Товар или размер больше недоступен. Обновите корзину.",
            errors: { items: ["Товар или размер недоступен"] },
          },
          400,
        );
      const id = randomUUID();
      let total = 0;
      const items = input.items
        .map((item) => {
          const product = getProduct(item.slug)!; // validated against current server catalog
          total += product.price * item.qty;
          return `${product.name} / ${item.size} / ${product.color} / ${item.qty} / ${formatPrice(product.price)}`;
        })
        .join("\n");
      const comment = [
        input.comment,
        `Заявка: ${id}`,
        `Согласие: ${input.consentVersion}; принято: ${new Date().toISOString()}; форма: preorder`,
        `Состав заказа (название / размер / цвет / количество / цена за единицу):\n${items}`,
        `Итого: ${formatPrice(total)}`,
      ]
        .filter(Boolean)
        .join("\n\n");
      if (comment.length > 2000)
        return response(
          {
            ok: false,
            message:
              "Комментарий вместе с составом заказа превышает лимит таблицы. Сократите комментарий или число позиций.",
            errors: {
              comment: [
                "Вместе с составом заказа допускается не более 2000 символов",
              ],
            },
          },
          400,
        );
      await sendScriptOrder({
        fullName: input.name,
        phone: input.phone,
        contact: input.contact,
        city: input.city,
        pickupAddress: input.address,
        comment,
        orderItems: items,
      });
      return response({ ok: true, id });
    }
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) return invalid(parsed.error);
    await saveWaitlist(parsed.data);
    return response({ ok: true });
  } catch (error) {
    // Never log a Google error object: it may contain request headers and credentials.
    const reason =
      error instanceof SheetConfigurationError || error instanceof ScriptError
        ? error.reason
        : "google-request-failed";
    const status =
      error &&
      typeof error === "object" &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : undefined;
    console.error("[NORTHIA] Не удалось сохранить заявку", {
      reason,
      status,
      sheet: SHEETS[mode],
      ...(error instanceof SheetRequestError
        ? { stage: error.stage, googleReason: error.googleReason }
        : {}),
    });
    return response(
      {
        ok: false,
        message:
          error instanceof SheetConfigurationError ||
          (error instanceof ScriptError &&
            ["missing-env", "invalid-url"].includes(error.reason))
            ? "Приём заявок ещё не настроен. Пожалуйста, попробуйте позже."
            : "Не удалось сохранить заявку. Пожалуйста, попробуйте ещё раз.",
      },
      500,
    );
  }
}
