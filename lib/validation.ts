import { z } from "zod";
import { getProduct } from "@/data/products";
const requiredText = (max: number) =>
  z
    .string({ error: "Заполните поле" })
    .trim()
    .min(1, "Заполните поле")
    .max(max, `Не более ${max} символов`);
export const itemSchema = z
  .object({
    slug: requiredText(100),
    size: z.enum(["XS", "S", "M", "L", "XL"], {
      error: "Выберите доступный размер",
    }),
    qty: z
      .number({ error: "Укажите количество" })
      .int("Количество должно быть целым")
      .min(1, "Минимум 1")
      .max(99, "Максимум 99"),
  })
  .superRefine((item, ctx) => {
    const product = getProduct(item.slug);
    if (!product)
      ctx.addIssue({
        code: "custom",
        path: ["slug"],
        message: "Товар не найден",
      });
    else if (!product.sizes.includes(item.size))
      ctx.addIssue({
        code: "custom",
        path: ["size"],
        message: "Размер недоступен",
      });
  });
export const preorderSchema = z.object({
  name: requiredText(150),
  phone: requiredText(40)
    .regex(/^[+\d\s()\-]+$/, "Допустимы цифры, пробелы, +, скобки и дефисы")
    .refine((value) => {
      const digits = value.replace(/\D/g, "");
      return digits.length >= 7 && digits.length <= 15;
    }, "Введите номер телефона: от 7 до 15 цифр"),
  contact: requiredText(150),
  city: requiredText(150),
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
  name: requiredText(150),
  contact: requiredText(150),
  website: z.string().max(500).default(""),
});
export type PreorderInput = z.infer<typeof preorderSchema>;
export type WaitlistInput = z.infer<typeof waitlistSchema>;
export type FieldErrors = Record<string, string[] | undefined>;
