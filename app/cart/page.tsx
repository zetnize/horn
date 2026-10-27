import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { CartContents } from "@/components/CartContents";
export const metadata: Metadata = {
  title: "Корзина",
  description: "Ваши товары для предзаказа NORTHIA.",
  robots: { index: false, follow: true },
};
export default function CartPage() {
  return (
    <>
      <Header />
      <main id="main" className="cart-page container">
        <h1 className="page-title">КОРЗИНА</h1>
        <CartContents />
      </main>
      <Footer />
    </>
  );
}
