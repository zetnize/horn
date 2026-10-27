export type Size = "XS" | "S" | "M" | "L" | "XL";
export type ProductType = "tee" | "longsleeve" | "hoodie";
export type Product = {
  slug: string;
  name: string;
  price: number;
  sizes: readonly Size[];
  color: string;
  shipping: string;
  type: ProductType;
  images: readonly string[];
  description: string;
};
const missingDescription = "Описание товара пока не предоставлено.";
const placeholder = "/assets/product-placeholder.svg";
export const products: readonly Product[] = [
  {
    slug: "tee-iron-milk",
    name: "Футболка «Ирон»",
    price: 4980,
    sizes: ["XS", "S", "M", "XL"],
    color: "молочный",
    type: "tee",
    shipping: "3-5 дней",
    images: Array.from({ length: 6 }, () => placeholder),
    description:
      "Футболка «ИРОН» молочного цвета свободного силуэта в стиле oversize. На груди минималистичная вышивка, на спине принт шелкографией. Лаконичный дизайн с акцентом на культурную идентичность. Выполнена из двухниточного трикотажного полотна.",
  },
  {
    slug: "tee-sudba-blue",
    name: "Футболка «Судьба»",
    price: 4980,
    sizes: ["S", "M", "L", "XL"],
    color: "голубой",
    type: "tee",
    shipping: "3-5 дней",
    images: [placeholder],
    description: missingDescription,
  },
  {
    slug: "zip-hoodie-grey",
    name: "Худи на молнии",
    price: 11980,
    sizes: ["XS", "S"],
    color: "серый",
    type: "hoodie",
    shipping: "3-5 дней",
    images: [placeholder],
    description: missingDescription,
  },
  {
    slug: "tee-svoboda-black",
    name: "Футболка «Свобода»",
    price: 4980,
    sizes: ["S"],
    color: "чёрный",
    type: "tee",
    shipping: "3-5 дней",
    images: [placeholder],
    description: missingDescription,
  },
  {
    slug: "tee-svoboda-milk",
    name: "Футболка «Свобода»",
    price: 4980,
    sizes: ["S", "M", "L", "XL"],
    color: "молочный",
    type: "tee",
    shipping: "3-5 дней",
    images: [placeholder],
    description: missingDescription,
  },
  {
    slug: "longsleeve-iron-milk",
    name: "Лонгслив «Ирон»",
    price: 7480,
    sizes: ["XS", "S", "M"],
    color: "молочный",
    type: "longsleeve",
    shipping: "3-5 дней",
    images: [placeholder],
    description: missingDescription,
  },
  {
    slug: "longsleeve-iron-black",
    name: "Лонгслив «Ирон»",
    price: 7480,
    sizes: ["XS", "S"],
    color: "чёрный",
    type: "longsleeve",
    shipping: "3-5 дней",
    images: [placeholder],
    description: missingDescription,
  },
];
export function getProduct(slug: string) {
  return products.find((product) => product.slug === slug);
}
export function formatPrice(price: number) {
  return `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(price).replace(/\s/g, "\u00a0")}\u00a0₽`;
}
