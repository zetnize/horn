import { z } from "zod";
import { CONSENT_VERSION } from "@/data/legal";
const consentFields = {
  consent: z.literal(true, {
    error: "Необходимо согласие на обработку данных",
  }),
  consentVersion: z.literal(CONSENT_VERSION, {
    error: "Обновите страницу и ознакомьтесь с актуальным согласием",
  }),
};
const requiredText = (max: number) =>
  z
    .string({ error: "Заполните поле" })
    .trim()
    .min(1, "Заполните поле")
    .max(max, `Не более ${max} символов`);
export const itemSchema = z.object({
  slug: requiredText(100),
  size: z.enum(["XS", "S", "M", "L", "XL"], {
    error: "Выберите доступный размер",
  }),
  qty: z
    .number({ error: "Укажите количество" })
    .int("Количество должно быть целым")
    .min(1, "Минимум 1")
    .max(99, "Максимум 99"),
});
export const preorderSchema = z.object({
  ...consentFields,
  name: requiredText(150),
  phone: requiredText(40)
    .regex(/^[+\d\s()\-]+$/, "Допустимы цифры, пробелы, +, скобки и дефисы")
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 15;
    }, "Введите номер телефона: от 7 до 15 цифр"),
  contact: requiredText(150),
  city: requiredText(100),
  address: requiredText(300),
  comment: z.string().trim().max(2000, "Не более 2000 символов").default(""),
  website: z.string().max(500).default(""),
  items: z
    .array(itemSchema)
    .min(1, "Корзина пуста")
    .max(50, "Слишком много товаров")
    .refine(
      (items) =>
        new Set(items.map((item) => `${item.slug}:${item.size}`)).size ===
        items.length,
      "Повторяющиеся позиции в корзине",
    ),
});
export const waitlistSchema = z.object({
  ...consentFields,
  name: requiredText(150),
  contact: requiredText(150),
  website: z.string().max(500).default(""),
});
export type PreorderInput = z.infer<typeof preorderSchema>;
export type WaitlistInput = z.infer<typeof waitlistSchema>;
export type FieldErrors = Record<string, string[] | undefined>;
