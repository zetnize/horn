"use client";
import { getImageProps } from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
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
  desktopSrc,
  alt,
  hero = false,
}: {
  caption?: string;
  src: string;
  desktopSrc?: string;
  alt: string;
  hero?: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const bounds = useRef<ImageBounds | null>(null);
  const [placement, setPlacement] = useState<CSSProperties>();
  const imageProps = {
    alt,
    width: 390,
    height: 486,
    sizes: "(min-width: 1024px) 100vw, (max-width: 767px) 100vw, 430px",
  };
  const { props: mobile } = getImageProps({ ...imageProps, src, loading: hero ? "eager" : "lazy", fetchPriority: hero ? "high" : undefined });
  const desktop = desktopSrc ? getImageProps({ ...imageProps, src: desktopSrc, sizes: "100vw" }).props : undefined;
  const fitImage = useCallback((box: ImageBounds) => {
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
  }, []);
  const fitLoadedImage = useCallback((image: HTMLImageElement) => {
    if (!image.naturalWidth || !image.currentSrc) return;
    const url = new URL(image.currentSrc);
    const uploaded = (url.searchParams.get("url") ?? url.pathname).startsWith("/media/");
    frame.current?.classList.toggle("uploaded-image", uploaded);
    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const box = uploaded ? visibleBounds(image) : {
      width, height, x: 0, y: 0, cropWidth: width, cropHeight: height,
    };
    bounds.current = box;
    fitImage(box);
  }, [fitImage]);
  useEffect(() => {
    const node = frame.current;
    if (!node) return;
    const image = imageRef.current;
    if (image?.complete) fitLoadedImage(image);
    const observer = new ResizeObserver(() => {
      if (bounds.current) fitImage(bounds.current);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [fitImage, fitLoadedImage]);
  return (
    <div
      ref={frame}
      className={`editorial-image ${hero ? "hero" : "drop-image"}`}
      data-desktop-image={desktopSrc || undefined}
    >
      <picture>
        {desktop && <source media="(min-width: 1024px)" srcSet={desktop.srcSet ?? desktop.src} sizes={desktop.sizes} />}
        <img {...mobile} alt={alt} ref={imageRef} style={{ ...mobile.style, ...placement }} onLoad={(event) => fitLoadedImage(event.currentTarget)} />
      </picture>
      {caption === undefined ? null : <p>{caption}</p>}
    </div>
  );
}
