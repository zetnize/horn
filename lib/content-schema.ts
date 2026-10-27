import { z } from "zod";
const text = z.string().trim().min(1).max(10000);
export const imagePath = z
  .string()
  .regex(
    /^\/(?:assets\/[a-zA-Z0-9_-]+\.svg|media\/[a-f0-9-]+\.(?:jpg|png|webp))$/,
  );
const link = z.union([
  z.literal(""),
  z.string().url().startsWith("https://").max(500),
]);
export const productSchema = z.object({
  slug: z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(100),
  name: text.max(200),
  price: z.number().int().min(1).max(10000000),
  sizes: z
    .array(z.enum(["XS", "S", "M", "L", "XL"]))
    .min(1)
    .max(5)
    .refine((v) => new Set(v).size === v.length),
  color: text.max(100),
  shipping: text.max(200),
  type: z.enum(["tee", "longsleeve", "hoodie"]),
  images: z.array(imagePath).min(1).max(12),
  description: text,
  delivery: text,
  care: text,
  hidden: z.boolean(),
});
export const settingsSchema = z.object({
  heroImage: imagePath,
  heroAlt: text.max(300),
  heroCaption: text.max(200),
  brandCopy: text,
  catalogTitle: text.max(200),
  dropImage: imagePath,
  dropAlt: text.max(300),
  dropCaption: text.max(200),
  dropCopy: text,
  preorderIntro: text,
  waitlistIntro: text,
  telegram: link,
  channel: link,
  legalName: text.max(300),
});
export const contentSchema = z.object({
  revision: z.number().int().nonnegative(),
  products: z
    .array(productSchema)
    .max(300)
    .refine(
      (v) => new Set(v.map((p) => p.slug)).size === v.length,
      "Адреса товаров должны быть уникальны",
    ),
  settings: settingsSchema,
});
export type Content = z.infer<typeof contentSchema>;
export type ManagedProduct = z.infer<typeof productSchema>;
export type Settings = z.infer<typeof settingsSchema>;
