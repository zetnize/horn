"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatPrice } from "@/data/products";
import { useContent } from "./ContentProvider";
import { Icon } from "./Icons";
import { MAX_QTY } from "@/lib/cart-store";
export function CartContents() {
  const { items, ready, remove, setQuantity } = useCart();
  const { products } = useContent();
  const getProduct = (slug: string) => products.find((p) => p.slug === slug);
  const unavailable = items.some(
    (i) => !getProduct(i.slug)?.sizes.includes(i.size),
  );
  if (!ready)
    return (
      <div className="empty-state" role="status">
        Загрузка корзины…
      </div>
    );
  if (!items.length)
    return (
      <div className="empty-state">
        <p>Ваша корзина пуста</p>
        <Link href="/#catalog">Перейти в каталог</Link>
      </div>
    );
  const total = items.reduce(
    (sum, item) => sum + (getProduct(item.slug)?.price ?? 0) * item.qty,
    0,
  );
  const quantity = items.reduce((sum, item) => sum + item.qty, 0);
  return (
    <>
      <ul className="cart-list">
        {items.map((item) => {
          const product = getProduct(item.slug);
          if (!product || !product.sizes.includes(item.size))
            return (
              <li className="cart-item" key={`${item.slug}-${item.size}`}>
                <p>Товар или размер больше недоступен</p>
                <button
                  className="button"
                  onClick={() => remove(item.slug, item.size)}
                >
                  Убрать
                </button>
              </li>
            );
          return (
            <li className="cart-item" key={`${item.slug}-${item.size}`}>
              <Link
                href={`/product/${item.slug}`}
                tabIndex={-1}
                aria-hidden="true"
              >
                <Image
                  src={product.images[0]}
                  alt=""
                  width={500}
                  height={700}
                  sizes="110px"
                />
              </Link>
              <div className="cart-item-copy">
                <h2>
                  <Link href={`/product/${item.slug}`}>{product.name}</Link>
                </h2>
                <div>
                  <p>Цвет: {product.color}</p>
                  <p>Размер: {item.size}</p>
                </div>
                <div className="cart-item-bottom">
                  <p>Стоимость: {formatPrice(product.price * item.qty)}</p>
                  <div
                    className="cart-quantity"
                    role="group"
                    aria-label={`Количество ${product.name}, размер ${item.size}`}
                  >
                    <button
                      type="button"
                      disabled={item.qty <= 1}
                      onClick={() =>
                        setQuantity(item.slug, item.size, item.qty - 1)
                      }
                      aria-label={`Уменьшить количество ${product.name}, размер ${item.size}`}
                    >
                      −
                    </button>
                    <span aria-live="polite" aria-atomic="true">
                      <span className="sr-only">Количество: </span>
                      {item.qty}
                    </span>
                    <button
                      type="button"
                      disabled={item.qty >= MAX_QTY}
                      onClick={() =>
                        setQuantity(item.slug, item.size, item.qty + 1)
                      }
                      aria-label={`Увеличить количество ${product.name}, размер ${item.size}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <button
                className="icon-button cart-remove"
                onClick={() => remove(item.slug, item.size)}
                aria-label={`Удалить ${product.name}, размер ${item.size}`}
              >
                <Icon name="close" />
              </button>
            </li>
          );
        })}
      </ul>
      <div className="cart-summary">
        <dl>
          <div>
            <dt>Количество</dt>
            <dd>{quantity} ед.</dd>
          </div>
          <div>
            <dt>Общая стоимость</dt>
            <dd>{formatPrice(total)}</dd>
          </div>
        </dl>
        <p className="delivery-note">
          *Стоимость доставки рассчитывается при оформлении
        </p>
        {unavailable ? (
          <p role="alert">Уберите недоступные позиции перед оформлением.</p>
        ) : (
          <Link className="button button-primary" href="/preorder">
            ОФОРМИТЬ ЗАЯВКУ
          </Link>
        )}
      </div>
    </>
  );
}
