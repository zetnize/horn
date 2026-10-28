import type { ManagedProduct, Settings } from "./content-schema";

export function carouselProducts(
  config: Settings["successCarousel"],
  products: readonly ManagedProduct[],
  orderedSlugs: readonly string[],
): Settings["successCarousel"] {
  if (!config.useCatalog) return config;
  const ordered = new Set(orderedSlugs);
  return {
    ...config,
    slides: products
      .filter((product) => !product.hidden && !ordered.has(product.slug))
      .slice(0, 10)
      .map((product) => ({
        image: product.images[0],
        alt: `${product.name}, ${product.color}`,
        title: product.name,
        buttonText: "Смотреть товар",
        href: `/product/${product.slug}`,
      })),
  };
}
