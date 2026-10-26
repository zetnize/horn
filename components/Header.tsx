import Image from "next/image";
import Link from "next/link";
import { Icon } from "./Icons";
export function Header() {
 return <header className="header container"><Link href="/" aria-label="NORTHIA — главная"><Image src="/assets/logo.svg" width={78} height={17} className="logo" alt="northia." loading="eager" /></Link><nav className="header-actions" aria-label="Основная навигация"><Link href="/cart" className="icon-button" aria-label="Корзина"><Icon name="cart" /></Link><button type="button" className="icon-button" aria-label="Открыть меню"><Icon name="menu" /></button></nav></header>;
}

