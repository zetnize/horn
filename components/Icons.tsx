import type { SVGProps, ReactNode } from "react";
export type IconName = "cart" | "menu" | "back" | "close" | "plus" | "minus" | "telegram" | "left" | "right";
export function Icon({ name, ...props }: SVGProps<SVGSVGElement> & { name: IconName }) {
 const paths: Record<Exclude<IconName, "telegram">, ReactNode> = {
 cart:<><path d="M5 7h14l1 14H4L5 7Z"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
 menu:<path d="M3 5h18M3 12h18M3 19h18"/>, back:<path d="m8 7-5 5 5 5M3 12h20"/>,
 close:<path d="m5 5 14 14M5 19 19 5"/>, plus:<path d="M4 12h16M12 4v16"/>, minus:<path d="M4 12h16"/>,
 left:<path d="m15 3-9 9 9 9"/>, right:<path d="m9 3 9 9-9 9"/>,
 };
 return <svg className="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{name === "telegram" ? <><circle cx="12" cy="12" r="10" fill="currentColor" stroke="none"/><path d="m6 11 12-5-3 12-4-4-2 2v-4l7-4-9 5Z" fill="white" stroke="none"/></> : paths[name]}</svg>;
}

