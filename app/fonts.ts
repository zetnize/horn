import localFont from "next/font/local";

export const montserrat = localFont({
  src: "./fonts/Montserrat-Regular.ttf",
  weight: "400",
  style: "normal",
  variable: "--font-montserrat",
  display: "swap",
  fallback: ["Arial"],
});

export const unbounded = localFont({
  src: "./fonts/Unbounded-Medium.ttf",
  weight: "500",
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
