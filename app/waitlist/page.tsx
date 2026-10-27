import type { Metadata } from "next";
import { RequestForm } from "@/components/RequestForm";
export const metadata: Metadata = {
  title: "Лист ожидания",
  description: "Узнайте первыми о старте продаж новой коллекции NORTHIA.",
};
export default function WaitlistPage() {
  return <RequestForm mode="waitlist" />;
}
