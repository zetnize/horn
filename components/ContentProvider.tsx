"use client";
import { createContext, useContext } from "react";
import type { Content } from "@/lib/content-schema";
const Context = createContext<Content | null>(null);
export function ContentProvider({
  value,
  children,
}: {
  value: Content;
  children: React.ReactNode;
}) {
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useContent() {
  const value = useContext(Context);
  if (!value) throw new Error("ContentProvider отсутствует");
  return value;
}
