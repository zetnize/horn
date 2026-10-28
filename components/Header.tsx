"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icons";
import { Menu } from "./Menu";
import { useCart } from "./CartProvider";
export function Header() {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const { items } = useCart();
  const count = items.reduce((total, item) => total + item.qty, 0);
  useEffect(() => {
    let anchor = window.scrollY;
    function onScroll() {
      const position = Math.max(0, window.scrollY);
      if (position <= (headerRef.current?.offsetHeight ?? 0)) {
        setHidden(false);
        anchor = position;
      } else if (Math.abs(position - anchor) >= 8) {
        setHidden(position > anchor);
        anchor = position;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <>
      <header
        ref={headerRef}
        className="header container scroll-header"
        data-hidden={hidden && !open}
      >
        <Link href="/" aria-label="NORTHIA — главная">
          <Image
            src="/assets/logo.svg"
            width={78}
            height={17}
            className="logo"
            alt="northia."
            loading="eager"
          />
        </Link>
        <nav className="header-actions" aria-label="Основная навигация">
          <Link
            href="/cart"
            className="icon-button header-cart"
            aria-label={count ? `Корзина, количество товаров: ${count}` : "Корзина"}
          >
            <Icon name="cart" />
            {count > 0 ? (
              <span className="cart-badge" aria-hidden="true">
                {count > 99 ? "99+" : count}
              </span>
            ) : null}
          </Link>
          <button
            type="button"
            className="icon-button"
            aria-label="Открыть меню"
            aria-expanded={open}
            aria-haspopup="dialog"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
          </button>
        </nav>
      </header>
      {open ? <Menu onClose={() => setOpen(false)} /> : null}
    </>
  );
}
