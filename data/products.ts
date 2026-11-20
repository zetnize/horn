export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"] as const;
export const PRODUCT_TYPE_LABELS = {
  tee: "Футболка",
  longsleeve: "Лонгслив",
  hoodie: "Худи",
  trousers: "Брюки",
  shirt: "Рубашка",
  cap: "Бейсболка",
} as const;
export type Size = (typeof PRODUCT_SIZES)[number];
export type ProductType = keyof typeof PRODUCT_TYPE_LABELS;
export type Product = {
  slug: string;
  name: string;
  price: number;
  sizes: readonly Size[];
  color: string;
  shipping: string;
  shippingText?: string;
  type: ProductType;
  images: readonly string[];
  sizeGuideImage?: string;
  description: string;
};
const defaultSizeGuides: Partial<Record<ProductType, string>> = {
  tee: "/assets/size-tee.png",
  longsleeve: "/assets/size-longsleeve.png",
  hoodie: "/assets/size-hoodie.png",
};

export function getSizeGuideImage(product: Pick<Product, "type" | "sizeGuideImage">) {
  return product.sizeGuideImage ?? defaultSizeGuides[product.type];
}
const missingDescription = "Описание товара пока не предоставлено.";
const placeholder = "/assets/product-placeholder.svg";
export const DEFAULT_SHIPPING = "10-15 дней";
export const MAX_SHIPPING_TEXT_LENGTH = 240;

export function formatShipping(product: Pick<Product, "shipping" | "shippingText">) {
  return product.shippingText ?? `Срок отправки: ${product.shipping}`;
}
export const products: readonly Product[] = [
  {
    slug: "tee-iron-milk",
    name: "Футболка «Ирон»",
    price: 4980,
    sizes: ["XS", "S", "M", "XL"],
    color: "молочный",
    type: "tee",
    shipping: DEFAULT_SHIPPING,
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
    shipping: DEFAULT_SHIPPING,
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
    shipping: DEFAULT_SHIPPING,
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
    shipping: DEFAULT_SHIPPING,
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
    shipping: DEFAULT_SHIPPING,
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
    shipping: DEFAULT_SHIPPING,
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
    shipping: DEFAULT_SHIPPING,
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
