"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icons";
import { Menu } from "./Menu";
export function Header() {
  const [open, setOpen] = useState(false);
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
          <Link href="/cart" className="icon-button" aria-label="Корзина">
            <Icon name="cart" />
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
