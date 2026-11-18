import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EditorialImage } from "@/components/EditorialImage";
import { ProductGrid } from "@/components/ProductGrid";
import { Icon } from "@/components/Icons";
import { readContent } from "@/lib/server/content";
export default async function Home() {
  const { settings } = await readContent();
  return (
    <>
      <Header />
      <main id="main">
        <h1 className="sr-only">NORTHIA — born in the mountains</h1>
        <div className="home-lead">
          <EditorialImage src={settings.heroImage} alt={settings.heroAlt} hero />
          <div className="home-lead-copy">
            <p className="hero-caption">{settings.heroCaption}</p>
            <p className="brand-copy">{settings.brandCopy}</p>
            <h2 id="catalog-title" className="catalog-title">
              {settings.catalogTitle}
            </h2>
            <Link href="#catalog" className="button collection-link desktop-only">
              Посмотреть коллекцию <Icon name="right" />
            </Link>
            <div id="catalog" />
          </div>
        </div>
        <section className="catalog" aria-labelledby="catalog-title">
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
            <Link href="/waitlist" className="button waitlist-button">лист ожидания</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
