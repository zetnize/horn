"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icons";
import { Menu } from "./Menu";
import { useCart } from "./CartProvider";
export function Header() {
  const [open, setOpen] = useState(false);
  const { items } = useCart();
  const count = items.reduce((total, item) => total + item.qty, 0);
  return (
    <>
      <header className="header container">
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
