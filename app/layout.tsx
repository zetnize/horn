import type { Metadata, Viewport } from "next";
import "./globals.css";
import { readContent } from "@/lib/server/content";
import { ContentProvider } from "@/components/ContentProvider";
import { manrope, onest, unbounded } from "./fonts";
export const dynamic = "force-dynamic";
import { CartProvider } from "@/components/CartProvider";
export const metadata: Metadata = {
  title: {
    default: "NORTHIA — born in the mountains",
    template: "%s | NORTHIA",
  },
  description:
    "NORTHIA — бренд одежды, вдохновлённый культурой и духом Кавказа. Каталог и предзаказ.",
  openGraph: {
    title: "NORTHIA",
    description: "Одежда, вдохновлённая культурой и духом Кавказа",
    locale: "ru_RU",
    type: "website",
  },
  icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ffffff",
};
export default async function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const content = await readContent();
  const visible = {
    ...content,
    products: content.products.filter((p) => !p.hidden),
  };
  return (
    <html
      lang="ru"
      data-scroll-behavior="smooth"
      className={`${manrope.variable} ${unbounded.variable} ${onest.variable}`}
    >
      <body>
        <ContentProvider value={visible}>
          <CartProvider>
            <div className="shell">
              <a className="skip-link" href="#main">
                К содержимому
              </a>
              {children}
            </div>
          </CartProvider>
        </ContentProvider>
      </body>
    </html>
  );
}
