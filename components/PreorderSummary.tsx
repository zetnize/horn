import Image from "next/image";
import Link from "next/link";
import { formatPrice, type Product } from "@/data/products";
import type { CartItem } from "@/lib/cart-store";

export function PreorderSummary({ items, products }: {
  items: CartItem[];
  products: readonly Product[];
}) {
  const lines = items.map((item) => ({
    item,
    product: products.find((product) => product.slug === item.slug && product.sizes.includes(item.size)),
  }));
  const total = lines.reduce((sum, { item, product }) => sum + item.qty * (product?.price ?? 0), 0);
  return (
    <section className="preorder-summary desktop-only" aria-labelledby="preorder-summary-title">
      <h2 id="preorder-summary-title">Ваш заказ</h2>
      <ul>
        {lines.map(({ item, product }) => (
          <li key={`${item.slug}-${item.size}`}>
            {product ? (
              <>
                <Image src={product.images[0]} alt="" width={500} height={700} sizes="48px" />
                <div>
                  <p>{product.name}</p>
                  <p className="preorder-summary-meta">Размер: {item.size} · {item.qty} ед.</p>
                  <p className="price">{formatPrice(product.price * item.qty)}</p>
                </div>
              </>
            ) : (
              <p>Товар или размер больше недоступен</p>
            )}
          </li>
        ))}
      </ul>
      {lines.some(({ product }) => !product) ? (
        <Link href="/cart">Вернуться в корзину</Link>
      ) : (
        <dl>
          <dt>Общая стоимость</dt>
          <dd className="price">{formatPrice(total)}</dd>
        </dl>
      )}
    </section>
  );
}
