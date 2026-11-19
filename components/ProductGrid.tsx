import { readContent } from "@/lib/server/content";
import { ProductCard } from "./ProductCard";
import { ProductGridReveal } from "./ProductGridReveal";
export async function ProductGrid() {
  const { products } = await readContent();
  return (
    <ProductGridReveal>
      {products
        .filter((p) => !p.hidden)
        .map((product) => (
          <ProductCard product={product} key={product.slug} />
        ))}
    </ProductGridReveal>
  );
}
