"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { formatPrice, formatShipping, type Product } from "@/data/products";
import { Icon } from "./Icons";

export function ProductCard({ product }: { product: Product }) {
  const track = useRef<HTMLAnchorElement>(null);
  const [active, setActive] = useState(0);
  const images = product.images.length ? [...new Set(product.images)] : ["/assets/product-placeholder.svg"];
  const href = `/product/${product.slug}`;

  function showPhoto(index: number) {
    const node = track.current;
    if (node) node.scrollTo({ left: index * node.clientWidth });
  }

  return (
    <article className="product-card">
      <div className="card-gallery">
        <Link
          ref={track}
          className="card-track slider-track"
          href={href}
          aria-label={`${product.name}, фото ${active + 1} из ${images.length}`}
          onScroll={(event) => {
            const node = event.currentTarget;
            setActive(Math.round(node.scrollLeft / node.clientWidth));
          }}
          onKeyDown={(event) => {
            if (images.length < 2) return;
            if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
              event.preventDefault();
              showPhoto(active + (event.key === "ArrowRight" ? 1 : -1));
            }
          }}
        >
          {images.map((src, index) => (
            <Image
              className="slide"
              key={src}
              src={src}
              alt={`${product.name}, ${product.color}, фото ${index + 1}`}
              width={500}
              height={700}
              sizes="(min-width: 1024px) min(26vw, 457px), (max-width: 767px) 50vw, 215px"
              draggable={false}
            />
          ))}
        </Link>
        {images.length > 1 && (
          <>
            <div className="card-indicator" aria-hidden="true">
              {images.map((src, index) => <span key={src} className={active === index ? "active" : undefined} />)}
            </div>
            {(["left", "right"] as const).map((direction) => (
              <button
                type="button"
                key={direction}
                className={`card-arrow card-arrow-${direction}`}
                aria-label={direction === "left" ? "Предыдущее фото" : "Следующее фото"}
                disabled={direction === "left" ? active === 0 : active === images.length - 1}
                onClick={() => showPhoto(active + (direction === "right" ? 1 : -1))}
              >
                <Icon name={direction} />
              </button>
            ))}
          </>
        )}
      </div>
      <div className="card-copy">
        <h3><Link href={href}>{product.name}</Link></h3>
        <p className="price">{formatPrice(product.price)}</p>
        <ul className="card-sizes" aria-label="Доступные размеры">
          {product.sizes.map((size) => <li key={size}>{size}</li>)}
        </ul>
        <p className="card-shipping">{formatShipping(product)}</p>
      </div>
    </article>
  );
}
