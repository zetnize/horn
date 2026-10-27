import { readContent } from "@/lib/server/content";
import { ProductCard } from "./ProductCard";
export async function ProductGrid() {
  const { products } = await readContent();
  return (
    <div className="product-grid">
      {products
        .filter((p) => !p.hidden)
        .map((product) => (
          <ProductCard product={product} key={product.slug} />
        ))}
    </div>
  );
}
