"use client";
import { useEffect, useRef, useState } from "react";
import { formatPrice, type Product, type Size } from "@/data/products";
import { useCart } from "./CartProvider";
import { Button } from "./Button";
import { Icon } from "./Icons";
import { SizeChips } from "./SizeChips";
import { SizeGuideModal } from "./SizeGuideModal";
export function ProductDetails({ product }: { product: Product }) {
  const [size, setSize] = useState<Size | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [guide, setGuide] = useState(false);
  const [added, setAdded] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cart = useCart();
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );
  function add() {
    if (!size) {
      setInvalid(true);
      sizesRef.current?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
      sizesRef.current?.querySelector("input")?.focus({ preventScroll: true });
      return;
    }
    cart.add(product.slug, size);
    setAdded(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setAdded(false), 4000);
  }
  return (
    <>
      <div className="product-info container">
        <h1>{product.name}</h1>
        <p className="product-price price">{formatPrice(product.price)}</p>
        <div className="product-meta">
          <p>Цвет: {product.color}</p>
          <p>Срок отправки: {product.shipping}</p>
        </div>
        <div ref={sizesRef}>
          <SizeChips
            sizes={product.sizes}
            value={size}
            invalid={invalid}
            onChange={(value) => {
              setSize(value);
              setInvalid(false);
              setAdded(false);
            }}
          />
        </div>
        <button
          className="text-button size-guide-link"
          onClick={() => setGuide(true)}
        >
          Размерная сетка
        </button>
        <Button className="add-to-cart" onClick={add}>
          <Icon name="cart" />
          <span>{added ? "ДОБАВЛЕНО" : "В КОРЗИНУ"}</span>
          <span className="price">{formatPrice(product.price)}</span>
        </Button>
      </div>
      <div
        className="cart-notice"
        data-visible={added}
        role="status"
        aria-atomic="true"
      >
        {added ? (
          <>
            <Icon name="cart" />
            <span>Товар добавлен в корзину</span>
          </>
        ) : null}
      </div>
      {guide ? (
        <SizeGuideModal type={product.type} onClose={() => setGuide(false)} />
      ) : null}
    </>
  );
}
