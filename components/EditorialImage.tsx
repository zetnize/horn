import Image from "next/image";
export function EditorialImage({
  caption,
  src,
  alt,
  hero = false,
}: {
  caption: string;
  src: string;
  alt: string;
  hero?: boolean;
}) {
  return (
    <div className={`editorial-image ${hero ? "hero" : "drop-image"}`}>
      <Image
        src={src}
        alt={alt}
        width={390}
        height={486}
        sizes="(max-width: 430px) 100vw, 430px"
        priority={hero}
      />
      <p>{caption}</p>
    </div>
  );
}
