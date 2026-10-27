import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { legalDocuments } from "@/data/legal";

function getDocument(key: string) {
  return Object.hasOwn(legalDocuments, key)
    ? legalDocuments[key as keyof typeof legalDocuments]
    : undefined;
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ document: string }>;
}): Promise<Metadata> {
  const doc = getDocument((await params).document);
  return { title: doc?.title ?? "Документ не найден" };
}
export default async function LegalPage({
  params,
}: {
  params: Promise<{ document: string }>;
}) {
  const doc = getDocument((await params).document);
  if (!doc) notFound();
  return (
    <>
      <Header />
      <main id="main" className="legal-page container">
        <h1>{doc.title}</h1>
        <p className="legal-date">Редакция от 27 октября 2026 года</p>
        {doc.sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.text}</p>
          </section>
        ))}
      </main>
      <Footer />
    </>
  );
}
