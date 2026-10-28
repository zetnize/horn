"use client";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties } from "react";
type ImageBounds = {
  width: number;
  height: number;
  x: number;
  y: number;
  cropWidth: number;
  cropHeight: number;
};

// Keep the uploaded file intact; fit its opaque area without transparent export padding.
function visibleBounds(image: HTMLImageElement): ImageBounds {
  const width = image.naturalWidth,
    height = image.naturalHeight;
  const full = {
    width,
    height,
    x: 0,
    y: 0,
    cropWidth: width,
    cropHeight: height,
  };
  if (!width || !height) return full;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return full;
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, width, height);
    let left = width,
      top = height,
      right = -1,
      bottom = -1;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (data[(y * width + x) * 4 + 3] === 255) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    }
    // Stay inside the opaque pixels so browser interpolation cannot pull padding back in.
    if (left > 0) left += 1;
    if (top > 0) top += 1;
    if (right < width - 1) right -= 1;
    if (bottom < height - 1) bottom -= 1;
    return right < left || bottom < top
      ? full
      : {
          width,
          height,
          x: left,
          y: top,
          cropWidth: right - left + 1,
          cropHeight: bottom - top + 1,
        };
  } catch {
    return full;
  }
}
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
  const frame = useRef<HTMLDivElement>(null);
  const bounds = useRef<ImageBounds | null>(null);
  const [placement, setPlacement] = useState<CSSProperties>();
  function fitImage(box: ImageBounds) {
    const node = frame.current;
    if (!node || !box.cropWidth || !box.cropHeight) return;
    const width = node.clientWidth,
      height = node.clientHeight;
    const scale = Math.max(width / box.cropWidth, height / box.cropHeight);
    setPlacement({
      width: box.width * scale,
      height: box.height * scale,
      left: (width - box.cropWidth * scale) / 2 - box.x * scale,
      top: (height - box.cropHeight * scale) / 2 - box.y * scale,
      right: "auto",
      bottom: "auto",
      objectFit: "fill",
      maxWidth: "none",
    });
  }
  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const observer = new ResizeObserver(() => {
      if (bounds.current) fitImage(bounds.current);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  return (
    <div
      ref={frame}
      className={`editorial-image ${hero ? "hero" : "drop-image"} ${src.startsWith("/media/") ? "uploaded-image" : ""}`}
    >
      <Image
        src={src}
        alt={alt}
        width={390}
        height={486}
        style={placement}
        sizes="(max-width: 767px) 100vw, 430px"
        priority={hero}
        onLoad={(event) => {
          const box = src.startsWith("/media/")
            ? visibleBounds(event.currentTarget)
            : {
                width: event.currentTarget.naturalWidth,
                height: event.currentTarget.naturalHeight,
                x: 0,
                y: 0,
                cropWidth: event.currentTarget.naturalWidth,
                cropHeight: event.currentTarget.naturalHeight,
              };
          bounds.current = box;
          fitImage(box);
        }}
      />
      <p>{caption}</p>
    </div>
  );
}
