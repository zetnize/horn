"use client";
import Link from "next/link";
import Image from "next/image";
import { Dialog } from "./Dialog";
import { Icon } from "./Icons";
export function Menu({ onClose }: { onClose: () => void }) {
  return (
    <Dialog labelId="menu-title" className="menu-dialog" onDismiss={onClose}>
      <h2 id="menu-title" className="sr-only">
        Меню
      </h2>
      <div className="header container">
        <Link href="/" onClick={onClose} aria-label="NORTHIA — главная">
          <Image
            src="/assets/logo.svg"
            width={78}
            height={17}
            alt="northia."
            loading="eager"
          />
        </Link>
        <button
          className="icon-button"
          onClick={onClose}
          aria-label="Закрыть меню"
        >
          <Icon name="back" />
        </button>
      </div>
      <nav className="menu-links" aria-label="Меню">
        <Link href="/#catalog" onClick={onClose}>
          КАТАЛОГ
        </Link>
        <Link href="/cart" onClick={onClose}>
          ПРЕДЗАКАЗ
        </Link>
        <Link href="/#contacts" onClick={onClose}>
          СПОСОБ СВЯЗИ
        </Link>
      </nav>
    </Dialog>
  );
}
