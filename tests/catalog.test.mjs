import test from "node:test";
import assert from "node:assert/strict";
import { productSchema } from "../lib/content-schema.ts";
import { parseCart } from "../lib/cart-store.ts";
import { itemSchema } from "../lib/validation.ts";

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
