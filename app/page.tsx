import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EditorialImage } from "@/components/EditorialImage";
import { ProductGrid } from "@/components/ProductGrid";
export default function Home() {
  return (
    <>
      <Header />
      <main id="main">
        <h1 className="sr-only">NORTHIA — born in the mountains</h1>
        <EditorialImage caption="[born in the mountains]" hero />
        <p className="brand-copy">
          NORTHIA — бренд одежды, вдохновлённый культурой и духом Кавказа. Мы
          соединяем традиции с современным стилем, создавая вещи с характером,
          смыслом и вниманием к деталям.
        </p>
        <section id="catalog" aria-labelledby="catalog-title">
          <h2 id="catalog-title" className="catalog-title">
            BASE DROP&gt;
          </h2>
          <ProductGrid />
        </section>
        <section className="drop" aria-label="Новая коллекция">
          <EditorialImage caption="[drop 5] soon..." />
          <div className="drop-copy">
            <p>
              Уже в ноябре мы представим новую коллекцию NORTHIA. Хотите узнать
              о старте продаж первыми? Присоединяйтесь к листу ожидания,
              заполнив короткую форму по кнопке ниже.
            </p>
            <Link href="/waitlist">лист ожидания</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
