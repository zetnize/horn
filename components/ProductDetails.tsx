"use client";
import { useRef, useState } from "react";
import { formatPrice, formatShipping, getSizeGuideImage, type Product, type Size } from "@/data/products";
import { useCart } from "./CartProvider";
import { Button } from "./Button";
import { Icon } from "./Icons";
import { SizeChips } from "./SizeChips";
import { SizeGuideModal } from "./SizeGuideModal";
export function ProductDetails({ product }: { product: Product }) {
  const [size, setSize] = useState<Size | null>(null);
  const [invalid, setInvalid] = useState(false);
  const [guide, setGuide] = useState(false);
  const sizesRef = useRef<HTMLDivElement>(null);
  const cart = useCart();
  const sizeGuideImage = getSizeGuideImage(product);
  const added = cart.items.some(
    (item) => item.slug === product.slug && (size === null || item.size === size),
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
  }
  return (
    <>
      <div className="product-info container">
        <h1>{product.name}</h1>
        <p className="product-price price">{formatPrice(product.price)}</p>
        <div className="product-meta">
          <p>Цвет: {product.color}</p>
          <p>{formatShipping(product)}</p>
        </div>
        <div ref={sizesRef}>
          <SizeChips
            sizes={product.sizes}
            value={size}
            invalid={invalid}
            onChange={(value) => {
              setSize(value);
              setInvalid(false);
            }}
          />
        </div>
        {sizeGuideImage && (
          <button
            className="text-button size-guide-link"
            onClick={() => setGuide(true)}
          >
            Размерная сетка
          </button>
        )}
        <Button className={`add-to-cart${added ? " is-added" : ""}`} onClick={add}>
          <Icon name="cart" />
          <span aria-live="polite">{added ? "Добавлено" : "В КОРЗИНУ"}</span>
          <span className="price">{formatPrice(product.price)}</span>
        </Button>
      </div>
      {guide && sizeGuideImage ? (
        <SizeGuideModal src={sizeGuideImage} name={product.name} onClose={() => setGuide(false)} />
      ) : null}
    </>
  );
}
