"use client";
import Image from "next/image";
import { useRef, useState } from "react";
import { Icon } from "./Icons";
export function Slider({
  images,
  name,
}: {
  images: readonly string[];
  name: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  function go(index: number) {
    const node = ref.current;
    if (node)
      node.scrollTo({
        left:
          Math.max(0, Math.min(images.length - 1, index)) * node.clientWidth,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "instant"
          : "smooth",
      });
  }
  return (
    <section
      className="slider"
      aria-label={`Фотографии: ${name}`}
      aria-roledescription="карусель"
    >
      <div className="slider-segments" aria-hidden="true">
        {images.map((_, index) => (
          <span key={index} className={index === active ? "active" : ""} />
        ))}
      </div>
      <div
        className="slider-track"
        ref={ref}
        tabIndex={0}
        aria-label="Фотографии, используйте стрелки влево и вправо"
        onScroll={(event) =>
          setActive(
            Math.round(
              event.currentTarget.scrollLeft / event.currentTarget.clientWidth,
            ),
          )
        }
        onKeyDown={(event) => {
          if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
            event.preventDefault();
            go(active + (event.key === "ArrowRight" ? 1 : -1));
          }
        }}
      >
        {images.map((src, index) => (
          <div
            className="slide"
            key={index}
            role="group"
            aria-roledescription="слайд"
            aria-label={`${index + 1} из ${images.length}`}
          >
            <Image
              src={src}
              alt={`${name}, фото ${index + 1} — изображение ожидается`}
              width={500}
              height={700}
              sizes="(max-width: 430px) 100vw, 430px"
              priority={index === 0}
            />
          </div>
        ))}
      </div>
      {images.length > 1 ? (
        <>
          <button
            className="icon-button slider-prev"
            onClick={() => go(active - 1)}
            aria-label="Предыдущее фото"
            disabled={active === 0}
          >
            <Icon name="left" />
          </button>
          <button
            className="icon-button slider-next"
            onClick={() => go(active + 1)}
            aria-label="Следующее фото"
            disabled={active === images.length - 1}
          >
            <Icon name="right" />
          </button>
        </>
      ) : null}
      <p className="sr-only" aria-live="polite">
        Фото {active + 1} из {images.length}
      </p>
    </section>
  );
}
