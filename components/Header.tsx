"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icons";
import { Menu } from "./Menu";
import { useCart } from "./CartProvider";
export function Header() {
  const [open, setOpen] = useState(false);
  const { items } = useCart();
  const count = items.reduce((total, item) => total + item.qty, 0);
  useEffect(() => {
    if (!open) return;
    const desktop = window.matchMedia("(min-width: 1024px)");
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, [open]);
  return (
    <>
      <header className="header container scroll-header">
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
        <nav className="desktop-nav desktop-only" aria-label="Разделы магазина">
          <Link href="/#catalog">Магазин</Link>
          <Link href="/waitlist">Ожидание</Link>
          <Link href="/#contacts">Контакты</Link>
        </nav>
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
            className="icon-button header-menu-toggle"
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
