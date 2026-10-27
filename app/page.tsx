import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EditorialImage } from "@/components/EditorialImage";
import { ProductGrid } from "@/components/ProductGrid";
import { readContent } from "@/lib/server/content";
export default async function Home() {
  const { settings } = await readContent();
  return (
    <>
      <Header />
      <main id="main">
        <h1 className="sr-only">NORTHIA — born in the mountains</h1>
        <EditorialImage
          caption={settings.heroCaption}
          src={settings.heroImage}
          alt={settings.heroAlt}
          hero
        />
        <p className="brand-copy">{settings.brandCopy}</p>
        <section id="catalog" aria-labelledby="catalog-title">
          <h2 id="catalog-title" className="catalog-title">
            {settings.catalogTitle}
          </h2>
          <ProductGrid />
        </section>
        <section className="drop" aria-label="Новая коллекция">
          <EditorialImage
            caption={settings.dropCaption}
            src={settings.dropImage}
            alt={settings.dropAlt}
          />
          <div className="drop-copy">
            <p>{settings.dropCopy}</p>
            <Link href="/waitlist">лист ожидания</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
