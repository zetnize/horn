"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartProvider";
import { formatPrice, getProduct } from "@/data/products";
import { Icon } from "./Icons";
export function CartContents() {
  const { items, ready, remove } = useCart();
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
          if (!product) return null;
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
                  {item.qty > 1 ? <p>Количество: {item.qty} ед.</p> : null}
                </div>
                <p>Стоимость: {formatPrice(product.price * item.qty)}</p>
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
        <Link className="button button-primary" href="/preorder">
          ОФОРМИТЬ ЗАЯВКУ
        </Link>
      </div>
    </>
  );
}
