import type { Metadata, Viewport } from "next";
import "./globals.css";
export const metadata: Metadata = {
 title: { default: "NORTHIA — born in the mountains", template: "%s | NORTHIA" },
 description: "NORTHIA — бренд одежды, вдохновлённый культурой и духом Кавказа. Каталог и предзаказ.",
 openGraph: { title: "NORTHIA", description: "Одежда, вдохновлённая культурой и духом Кавказа", locale: "ru_RU", type: "website" },
 icons: { icon: "/icon.svg" },
};
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#ffffff" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
 return <html lang="ru"><body><div className="shell"><a className="skip-link" href="#main">К содержимому</a>{children}</div></body></html>;
}

