"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
export function AdminLogin() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <form
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setMessage("");
        const data = Object.fromEntries(new FormData(event.currentTarget));
        try {
          const response = await fetch("/api/admin/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          const result = await response.json();
          if (!response.ok) throw new Error(result.message);
          router.refresh();
        } catch (error) {
          setMessage(
            error instanceof Error ? error.message : "Ошибка соединения",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <p>Войдите, чтобы редактировать товары и содержимое сайта.</p>
      <label>
        Логин
        <input name="login" autoComplete="username" required maxLength={100} />
      </label>
      <label>
        Пароль
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          maxLength={256}
        />
      </label>
      {message && (
        <p role="alert" className="form-error">
          {message}
        </p>
      )}
      <button className="button" disabled={busy}>
        {busy ? "Вход…" : "Войти"}
      </button>
      <Link href="/">Вернуться на сайт</Link>
    </form>
  );
}
