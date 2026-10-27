import type { Metadata } from "next";
import { authenticated } from "@/lib/server/admin-auth";
import { readContent } from "@/lib/server/content";
import { AdminPanel } from "@/components/admin/AdminPanel";
import { AdminLogin } from "@/components/admin/AdminLogin";
export const metadata: Metadata = {
  title: "Управление сайтом",
  robots: { index: false, follow: false },
};
export default async function AdminPage() {
  return (
    <main id="main" className="admin container">
      <h1>Управление NORTHIA</h1>
      {(await authenticated()) ? (
        <AdminPanel initial={await readContent()} />
      ) : (
        <AdminLogin />
      )}
    </main>
  );
}
