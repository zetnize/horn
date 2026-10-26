import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/data/products";
export function ProductCard({ product }: { product: Product }) {
 return <Link className="product-card" href={`/product/${product.slug}`}><Image src={product.images[0]} alt={`${product.name}, ${product.color} — фото ожидается`} width={500} height={700} sizes="(max-width: 430px) 50vw, 215px"/><div className="card-copy"><h3>{product.name}</h3><p className="price">{formatPrice(product.price)}</p><p className="card-sizes" aria-label={`Размеры: ${product.sizes.join(", ")}`}>{product.sizes.map(size=><span key={size}>{size}</span>)}</p></div></Link>;
}

