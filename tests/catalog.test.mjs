import test from "node:test";
import assert from "node:assert/strict";
import { productSchema } from "../lib/content-schema.ts";
import { parseCart } from "../lib/cart-store.ts";
import { itemSchema } from "../lib/validation.ts";
import { defaultContent } from "../data/content-defaults.ts";
import { formatShipping } from "../data/products.ts";

test("catalog and preorder support XXL with the new product types", () => {
  const item = { slug: "new-product", size: "XXL", qty: 1 };
  assert.deepEqual(parseCart([item]), [item]);
  assert.deepEqual(itemSchema.parse(item), item);
  for (const type of ["trousers", "shirt", "cap"]) {
    const product = {
      slug: item.slug, name: "Товар", price: 4980, color: "Чёрный",
      sizes: ["XS", "S", "M", "L", "XL", "XXL"], type, shipping: "3–5 дней",
      images: ["/assets/product-placeholder.svg"], description: "Описание",
      delivery: "Доставка", care: "Уход", hidden: false,
    };
    assert.deepEqual(productSchema.parse(product), product);
  }
});

test("shipping displays legacy durations and replaces the full line with saved custom text", () => {
  const legacy = productSchema.parse({ ...defaultContent.products[0], shipping: "3–5 дней" });
  assert.equal(formatShipping(legacy), "Срок отправки: 3–5 дней");
  const edited = productSchema.parse({ ...legacy, shippingText: "  Отправим через неделю  " });
  assert.equal(formatShipping(edited), "Отправим через неделю");
  assert.equal(productSchema.safeParse({ ...legacy, shippingText: " " }).success, false);
});
