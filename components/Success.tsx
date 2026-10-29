"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useContent } from "./ContentProvider";
import { SuccessCarousel } from "./SuccessCarousel";
import { carouselProducts } from "@/lib/carousel-products";
export function Success({ waitlist = false, orderedSlugs = [] }: {
  waitlist?: boolean;
  orderedSlugs?: string[];
}) {
  const { settings, products } = useContent();
  const carousel = carouselProducts(settings.successCarousel, products, orderedSlugs);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    title.current?.focus();
  }, []);
  return (
    <main id="main" className={`success container${waitlist ? "" : " success--preorder"}`}>
      <h1 tabIndex={-1} ref={title}>
        СПАСИБО ЗА ЗАЯВКУ!
      </h1>
      <p>
        {waitlist
          ? "Мы сообщим вам о старте продаж новой коллекции."
          : "В ближайшее время мы свяжемся с вами для оформления заказа"}
      </p>
      <Link href="/">Вернуться на главную</Link>
      {waitlist ? (
        <Image className="success-waitlist-image" src="/waitlist-success.png" alt="Зелёные горы и цветущий луг" width={778} height={976} sizes="(max-width: 430px) 82vw, 353px" />
      ) : <SuccessCarousel config={carousel} />}
    </main>
  );
}
