import localFont from "next/font/local";

export const manrope = localFont({
  src: "./fonts/Manrope-Regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-manrope",
  display: "swap",
  fallback: ["Arial"],
});

export const unbounded = localFont({
  src: "./fonts/Unbounded-Bold.ttf",
  weight: "700",
  style: "normal",
  variable: "--font-unbounded",
  display: "swap",
  fallback: ["Arial"],
});

export const onest = localFont({
  src: "./fonts/Onest-Medium.ttf",
  weight: "500",
  style: "normal",
  variable: "--font-onest",
  display: "swap",
  fallback: ["Arial"],
});
