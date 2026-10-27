"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import {
  preorderSchema,
  waitlistSchema,
  type FieldErrors,
} from "@/lib/validation";
import { Field, type FieldDefinition } from "./Field";
import { Button } from "./Button";
import { Header } from "./Header";
import { Success } from "./Success";
import { useCart } from "./CartProvider";
const preorderFields: FieldDefinition[] = [
  {
    name: "name",
    label: "ФИО",
    autoComplete: "name",
    maxLength: 150,
    required: true,
  },
  {
    name: "phone",
    label: "Номер телефона",
    type: "tel",
    autoComplete: "tel",
    maxLength: 40,
    required: true,
  },
  {
    name: "contact",
    label: "Контакт для связи (ник instagram / telegram)",
    maxLength: 150,
    required: true,
  },
  {
    name: "city",
    label: "Город / страна",
    autoComplete: "address-level2",
    maxLength: 150,
    required: true,
  },
  {
    name: "address",
    label: "Адрес пункта выдачи СДЭК",
    maxLength: 300,
    required: true,
  },
  { name: "comment", label: "Комментарий", maxLength: 2000, multiline: true },
];
const waitlistFields: FieldDefinition[] = [
  {
    name: "name",
    label: "Имя",
    autoComplete: "given-name",
    maxLength: 150,
    required: true,
  },
  preorderFields[2],
];
export function RequestForm({ mode }: { mode: "preorder" | "waitlist" }) {
  const cart = useCart();
  const router = useRouter();
  const preorder = mode === "preorder";
  const [errors, setErrors] = useState<FieldErrors>({});
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const lock = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (preorder && cart.ready && !cart.items.length && !success)
      router.replace("/cart");
  }, [preorder, cart.ready, cart.items.length, success, router]);
  function showErrors(fieldErrors: FieldErrors) {
    setErrors(fieldErrors);
    const name = Object.keys(fieldErrors)[0];
    const field = formRef.current?.elements.namedItem(name);
    if (field instanceof HTMLElement) field.focus();
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (lock.current) return;
    setMessage("");
    setErrors({});
    const values = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = (preorder ? preorderSchema : waitlistSchema).safeParse({
      ...values,
      ...(preorder ? { items: cart.items } : {}),
    });
    if (!parsed.success) {
      showErrors(z.flattenError(parsed.error).fieldErrors);
      return;
    }
    lock.current = true;
    setPending(true);
    try {
      const response = await fetch(`/api/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json().catch(() => null);
      if (!response.ok || !result?.ok) {
        if (response.status === 400 && result?.errors)
          showErrors(result.errors);
        setMessage(
          response.status === 429
            ? "Слишком много попыток. Попробуйте через несколько минут."
            : (result?.message ??
                "Не удалось отправить заявку. Попробуйте ещё раз."),
        );
        return;
      }
      setSuccess(true);
      if (preorder) cart.clear();
    } catch {
      setMessage(
        "Не удалось связаться с сервером. Проверьте подключение и попробуйте ещё раз.",
      );
    } finally {
      setPending(false);
      lock.current = false;
    }
  }
  if (success) return <Success waitlist={!preorder} />;
  if (preorder && (!cart.ready || !cart.items.length))
    return (
      <>
        <Header />
        <main id="main" className="empty-state container">
          <h1 className="sr-only">Форма предзаказа</h1>
          <p role="status">Проверяем корзину…</p>
        </main>
      </>
    );
  return (
    <>
      <Header />
      <main id="main" className="form-page container">
        <h1 className="page-title">
          {preorder ? "ФОРМА ПРЕДЗАКАЗА" : "ЛИСТ ОЖИДАНИЯ"}
        </h1>
        {preorder ? (
          <div className="form-intro">
            <p>
              После заполнения формы мы свяжемся с вами для подтверждения заказа
              и оформления оплаты. В связи с большим количеством обращений время
              ответа может быть увеличено <strong>до 2 дней</strong> 🤍
            </p>
            <p>
              Мы выпускаем коллекции ограниченными тиражами по предзаказу. Это
              позволяет нам сосредоточиться на качестве каждой вещи и сохранить
              эксклюзивность каждой партии 🖇️
            </p>
            <p>
              Срок отправки: 1-5 дней
              <br />
              Спасибо за доверие 🩶
            </p>
          </div>
        ) : (
          <p className="form-intro">
            Оставьте имя и контакт, чтобы узнать о старте продаж новой коллекции
            NORTHIA.
          </p>
        )}
        <form ref={formRef} onSubmit={submit} noValidate aria-busy={pending}>
          {(preorder ? preorderFields : waitlistFields).map((field) => (
            <Field key={field.name} field={field} errors={errors[field.name]} />
          ))}
          <div hidden aria-hidden="true">
            <label htmlFor="website">Сайт</label>
            <input
              id="website"
              name="website"
              autoComplete="off"
              tabIndex={-1}
            />
          </div>
          {message ? (
            <p role="alert" className="form-error">
              {message}
            </p>
          ) : null}
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Отправка…" : "ОТПРАВИТЬ"}
          </Button>
        </form>
      </main>
    </>
  );
}
