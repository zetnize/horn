"use client";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { useContent } from "./ContentProvider";
import { SuccessCarousel } from "./SuccessCarousel";
export function Success({ waitlist = false }: { waitlist?: boolean }) {
  const { settings } = useContent();
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    title.current?.focus();
  }, []);
  return (
    <main id="main" className="success container">
      <h1 tabIndex={-1} ref={title}>
        СПАСИБО ЗА ЗАЯВКУ!
      </h1>
      <p>
        {waitlist
          ? "Мы сообщим вам о старте продаж новой коллекции."
          : "В ближайшее время мы свяжемся с вами для оформления заказа"}
      </p>
      <Link href="/">Вернуться на главную</Link>
      {!waitlist && <SuccessCarousel config={settings.successCarousel} />}
    </main>
  );
}
