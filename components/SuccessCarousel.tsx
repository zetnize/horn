"use client";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState, type CSSProperties } from "react";
import type { Settings } from "@/lib/content-schema";
import { Icon } from "./Icons";

export function SuccessCarousel({ config }: { config: Settings["successCarousel"] }) {
  const [current, setCurrent] = useState(0);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const { slides } = config;
  const active = Math.min(current, Math.max(0, slides.length - 1));
  if (!config.enabled || !slides.length) return null;
  function move(direction: number) {
    setCurrent((active + direction + slides.length) % slides.length);
  }
  return (
    <section className="success-carousel" aria-label="Карусель NORTHIA" aria-roledescription="карусель">
      <div
        className="success-carousel-viewport"
        tabIndex={0}
        aria-label="Слайды. Используйте стрелки влево и вправо"
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
            event.preventDefault();
            move(event.key === "ArrowLeft" ? -1 : 1);
          }
        }}
        onTouchStart={(event) => {
          const point = event.touches[0];
          touch.current = point ? { x: point.clientX, y: point.clientY } : null;
        }}
        onTouchCancel={() => { touch.current = null; }}
        onTouchEnd={(event) => {
          const start = touch.current;
          touch.current = null;
          const end = event.changedTouches[0];
          if (!start || !end) return;
          const dx = end.clientX - start.x;
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(end.clientY - start.y)) move(dx < 0 ? 1 : -1);
        }}
      >
        {slides.map((slide, index) => {
          let offset = index - active;
          if (slides.length > 2) {
            if (offset > slides.length / 2) offset -= slides.length;
            if (offset < -slides.length / 2) offset += slides.length;
          }
          return (
            <article
              key={index}
              className="success-carousel-slide"
              data-active={index === active}
              style={{ "--slide-offset": offset } as CSSProperties}
              aria-roledescription="слайд"
              aria-label={`${index + 1} из ${slides.length}`}
              aria-hidden={index !== active}
              inert={index !== active}
            >
              <Image src={slide.image} alt={slide.alt} fill sizes="(max-width: 430px) 80vw, 300px" />
              {(slide.title || (slide.href && slide.buttonText)) && (
                <div className="success-carousel-caption">
                  {slide.title && <h2>{slide.title}</h2>}
                  {slide.href && slide.buttonText && <Link href={slide.href}>{slide.buttonText}</Link>}
                </div>
              )}
            </article>
          );
        })}
      </div>
      <div className="success-carousel-controls">
        <button type="button" className="icon-button" aria-label="Предыдущий слайд" disabled={slides.length < 2} onClick={() => move(-1)}><Icon name="back" /></button>
        <span role="status" aria-live="polite" aria-atomic="true">{active + 1} / {slides.length}</span>
        <button type="button" className="icon-button carousel-next" aria-label="Следующий слайд" disabled={slides.length < 2} onClick={() => move(1)}><Icon name="back" /></button>
      </div>
    </section>
  );
}
