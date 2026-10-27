import Image from "next/image";
export function EditorialImage({
  caption,
  hero = false,
}: {
  caption: string;
  hero?: boolean;
}) {
  return (
    <div className={`editorial-image ${hero ? "hero" : "drop-image"}`}>
      <Image
        src="/assets/hero-placeholder.svg"
        alt="Фотография гор Кавказа — изображение ожидается"
        width={390}
        height={486}
        sizes="(max-width: 430px) 100vw, 430px"
        priority={hero}
      />
      <p>{caption}</p>
    </div>
  );
}
