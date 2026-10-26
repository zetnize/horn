import { products } from "@/data/products";
import { ProductCard } from "./ProductCard";
export function ProductGrid() { return <div className="product-grid">{products.map(product=><ProductCard product={product} key={product.slug}/>)}</div>; }

