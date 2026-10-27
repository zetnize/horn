import Link from "next/link";
import { Header } from "@/components/Header";
export default function NotFound() {
  return (
    <>
      <Header />
      <main id="main" className="empty-state container">
        <h1>Страница не найдена</h1>
        <Link href="/#catalog">Вернуться в каталог</Link>
      </main>
    </>
  );
}
