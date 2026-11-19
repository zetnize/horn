"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ProductGridReveal({ children }: { children: ReactNode }) {
  const grid = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!grid.current || !("IntersectionObserver" in window)) return;

    const observer = new IntersectionObserver((entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!isIntersecting) continue;
        target.classList.add("is-revealed");
        observer.unobserve(target);
      }
    });
    for (const card of grid.current.children) observer.observe(card);
    return () => observer.disconnect();
  }, [children]);

  return <div className="product-grid" ref={grid}>{children}</div>;
}
