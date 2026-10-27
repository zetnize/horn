import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProduct, products } from "@/data/products";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Slider } from "@/components/Slider";
import { ProductDetails } from "@/components/ProductDetails";
import { Accordion } from "@/components/Accordion";
export function generateStaticParams() {
  return products.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const product = getProduct((await params).slug);
  if (!product) return { title: "Товар не найден" };
  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      locale: "ru_RU",
      type: "website",
    },
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  return (
    <>
      <Header />
      <main id="main">
        <nav className="breadcrumb container" aria-label="Хлебные крошки">
          <Link href="/">главная</Link>
        </nav>
        <Slider images={product.images} name={product.name} />
        <ProductDetails product={product} />
        <div className="product-accordions container">
          <Accordion title="Инфо" defaultOpen>
            <h3>ДЕТАЛИ</h3>
            <p>{product.description}</p>
          </Accordion>
          <Accordion title="Доставка">
            <p>Информация о доставке пока не предоставлена.</p>
          </Accordion>
          <Accordion title="Состав и уход">
            <p>Информация о составе и уходе пока не предоставлена.</p>
          </Accordion>
        </div>
      </main>
      <Footer />
    </>
  );
}
