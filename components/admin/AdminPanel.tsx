"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Content, ManagedProduct, Settings } from "@/lib/content-schema";
import { formatPrice } from "@/data/products";
import { Dialog } from "@/components/Dialog";
import {
  MAX_IMAGE_BYTES,
  IMAGE_SIZE_MESSAGE,
  uploadedImagePath,
} from "@/lib/admin-upload";

const settingsFields: [keyof Settings, string, boolean?][] = [
  ["heroCaption", "Подпись главного изображения"],
  ["heroAlt", "Описание главного изображения (alt)"],
  ["brandCopy", "Текст о бренде", true],
  ["catalogTitle", "Заголовок каталога"],
  ["dropCaption", "Подпись новой коллекции"],
  ["dropAlt", "Описание изображения коллекции (alt)"],
  ["dropCopy", "Текст новой коллекции", true],
  ["preorderIntro", "Текст перед формой предзаказа", true],
  ["waitlistIntro", "Текст листа ожидания", true],
  ["telegram", "Ссылка на Telegram (https://)"],
  ["channel", "Ссылка на Telegram-канал (https://)"],
  ["legalName", "Юридическое имя в подвале"],
];
function TextField({
  label,
  value,
  onChange,
  multiline = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  disabled?: boolean;
}) {
  return (
    <label>
      {label}
      {multiline ? (
        <textarea
          rows={6}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </label>
  );
}
function Upload({
  label,
  value,
  onChange,
  onBusy,
}: {
  label: string;
  value: string;
  onChange: (path: string) => void;
  onBusy: (busy: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return (
    <div className="admin-upload">
      {value && (
        <Image src={value} alt={label} width={160} height={160} sizes="160px" />
      )}
      <label>
        {label}
        <input
          type="file"
          accept="image/png,.png"
          disabled={busy}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            if (file.size > MAX_IMAGE_BYTES) {
              setError(IMAGE_SIZE_MESSAGE);
              return;
            }
            setBusy(true);
            onBusy(true);
            setError("");
            try {
              const response = await fetch("/api/admin/upload", {
                method: "POST",
                headers: { "Content-Type": file.type },
                body: file,
              });
              onChange(await uploadedImagePath(response));
            } catch (err) {
              setError(err instanceof Error ? err.message : "Ошибка загрузки");
            } finally {
              setBusy(false);
              onBusy(false);
            }
          }}
        />
      </label>
      <p className="admin-hint">PNG, до 4 МБ. Прозрачный фон сохраняется.</p>
      {busy && <p role="status">Загрузка…</p>}
      {error && (
        <p role="alert" className="form-error">
          {error}
        </p>
      )}
    </div>
  );
}
export function AdminPanel({ initial }: { initial: Content }) {
  const [data, setData] = useState(initial);
  const [selected, setSelected] = useState<number | null>(null);
  const [tab, setTab] = useState<"products" | "content">("products");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [uploads, setUploads] = useState(0);
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const productList = useRef<HTMLOListElement>(null);
  const [savedSlugs, setSavedSlugs] = useState(
    () => new Set(initial.products.map((p) => p.slug)),
  );
  const router = useRouter();
  useEffect(() => {
    if (selected !== null && tab === "products") {
      const editor = document.getElementById("admin-product-editor");
      editor?.scrollIntoView({ block: "start" });
      editor?.focus({ preventScroll: true });
    }
  }, [selected, tab]);
  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  const onBusy = (value: boolean) => setUploads((n) => n + (value ? 1 : -1));
  function change(fn: (current: Content) => Content) {
    setData(fn);
    setDirty(true);
    setMessage("");
  }
  function setting(key: keyof Settings, value: string) {
    change((d) => ({ ...d, settings: { ...d.settings, [key]: value } }));
  }
  function product(patch: Partial<ManagedProduct>) {
    change((d) => ({
      ...d,
      products: d.products.map((p, i) =>
        i === selected ? { ...p, ...patch } : p,
      ),
    }));
  }
  const current = selected === null ? null : data.products[selected];
  async function save() {
    setBusy(true);
    setMessage("");
    setFailure(false);
    try {
      const response = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);
      setData(result);
      setDirty(false);
      setSavedSlugs(
        new Set(result.products.map((p: ManagedProduct) => p.slug)),
      );
      setMessage("Изменения сохранены. Сайт обновлён.");
      router.refresh();
    } catch (error) {
      setFailure(true);
      setMessage(
        error instanceof Error
          ? error.message
          : "Ошибка соединения. Изменения не сохранены.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="admin-top">
        <Link href="/" target="_blank">
          Открыть сайт ↗
        </Link>
        <button
          type="button"
          disabled={busy || uploads > 0}
          onClick={async () => {
            if (dirty && !window.confirm("Выйти без сохранения изменений?"))
              return;
            try {
              const response = await fetch("/api/admin/session", {
                method: "DELETE",
              });
              if (!response.ok) throw new Error();
              router.refresh();
            } catch {
              setFailure(true);
              setMessage("Не удалось выйти. Повторите попытку.");
            }
          }}
        >
          Выйти
        </button>
      </div>
      <nav className="admin-tabs" aria-label="Разделы управления">
        <button
          aria-pressed={tab === "products"}
          onClick={() => setTab("products")}
        >
          Товары ({data.products.length})
        </button>
        <button
          aria-pressed={tab === "content"}
          onClick={() => setTab("content")}
        >
          Контент сайта
        </button>
      </nav>
      <fieldset disabled={busy || uploads > 0} className="admin-fields">
        {tab === "content" ? (
          <section>
            <h2>Содержимое сайта</h2>
            <Upload
              label="Главное изображение"
              value={data.settings.heroImage}
              onChange={(p) => setting("heroImage", p)}
              onBusy={onBusy}
            />
            <Upload
              label="Изображение новой коллекции"
              value={data.settings.dropImage}
              onChange={(p) => setting("dropImage", p)}
              onBusy={onBusy}
            />
            {settingsFields.map(([key, label, multiline]) => (
              <TextField
                key={key}
                label={label}
                value={data.settings[key]}
                multiline={multiline}
                onChange={(v) => setting(key, v)}
              />
            ))}
          </section>
        ) : (
          <section>
            <h2>Каталог</h2>
            <button
              className="button"
              onClick={() => {
                const newProduct: ManagedProduct = {
                  slug: `product-${Date.now()}`,
                  name: "Новый товар",
                  price: 4980,
                  sizes: ["S", "M"],
                  color: "молочный",
                  shipping: "3-5 дней",
                  type: "tee",
                  images: ["/assets/product-placeholder.svg"],
                  description: "Добавьте описание товара.",
                  delivery: "Добавьте условия доставки.",
                  care: "Добавьте состав и рекомендации по уходу.",
                  hidden: true,
                };
                setSelected(data.products.length);
                change((d) => ({
                  ...d,
                  products: [...d.products, newProduct],
                }));
              }}
            >
              + Добавить товар
            </button>
            <ol
              className="admin-products"
              ref={productList}
              tabIndex={-1}
              aria-label="Товары каталога"
            >
              {data.products.map((p, i) => (
                <li key={i}>
                  <button
                    className="admin-product-select"
                    aria-pressed={selected === i}
                    onClick={() => setSelected(i)}
                  >
                    {p.name}
                    <small>
                      {formatPrice(p.price)} · {p.hidden ? "Скрыт" : "На сайте"}
                    </small>
                  </button>
                  <div className="admin-order">
                    {[-1, 1].map((direction) => (
                      <button
                        key={direction}
                        aria-label={`${direction < 0 ? "Поднять" : "Опустить"} ${p.name}`}
                        disabled={
                          i + direction < 0 ||
                          i + direction >= data.products.length
                        }
                        onClick={() => {
                          change((d) => {
                            const products = [...d.products];
                            [products[i], products[i + direction]] = [
                              products[i + direction],
                              products[i],
                            ];
                            return { ...d, products };
                          });
                          setSelected(null);
                        }}
                      >
                        {direction < 0 ? "↑" : "↓"}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="admin-product-delete"
                      aria-label={`Удалить ${p.name}, ${p.color}, ${p.slug}`}
                      onClick={() => setDeleting(i)}
                    >
                      Удалить
                    </button>
                  </div>
                </li>
              ))}
            </ol>
            {current && (
              <div
                className="admin-editor"
                id="admin-product-editor"
                tabIndex={-1}
              >
                <h2>Редактор товара</h2>
                <TextField
                  label="Название"
                  value={current.name}
                  onChange={(name) => product({ name })}
                />
                <TextField
                  label="Адрес товара (латиница и дефисы)"
                  value={current.slug}
                  disabled={savedSlugs.has(current.slug)}
                  onChange={(slug) => product({ slug })}
                />
                <p className="admin-hint">
                  После сохранения адрес закрепляется, чтобы ссылки и корзины
                  продолжали работать.
                </p>
                <label>
                  Цена, ₽
                  <input
                    type="number"
                    min={1}
                    max={10000000}
                    step={1}
                    value={current.price}
                    onChange={(e) => product({ price: Number(e.target.value) })}
                  />
                </label>
                <TextField
                  label="Цвет"
                  value={current.color}
                  onChange={(color) => product({ color })}
                />
                <TextField
                  label="Срок отправки"
                  value={current.shipping}
                  onChange={(shipping) => product({ shipping })}
                />
                <label>
                  Тип товара
                  <select
                    value={current.type}
                    onChange={(e) =>
                      product({
                        type: e.target.value as ManagedProduct["type"],
                      })
                    }
                  >
                    <option value="tee">Футболка</option>
                    <option value="longsleeve">Лонгслив</option>
                    <option value="hoodie">Худи</option>
                  </select>
                </label>
                <fieldset>
                  <legend>Доступные размеры</legend>
                  <div className="admin-sizes">
                    {(["XS", "S", "M", "L", "XL"] as const).map((size) => (
                      <label key={size}>
                        <input
                          type="checkbox"
                          checked={current.sizes.includes(size)}
                          onChange={(e) =>
                            product({
                              sizes: e.target.checked
                                ? [...current.sizes, size]
                                : current.sizes.filter((s) => s !== size),
                            })
                          }
                        />
                        {size}
                      </label>
                    ))}
                  </div>
                </fieldset>
                <label className="admin-check">
                  <input
                    type="checkbox"
                    checked={!current.hidden}
                    onChange={(e) => product({ hidden: !e.target.checked })}
                  />
                  Показывать на сайте
                </label>
                <TextField
                  label="Описание"
                  multiline
                  value={current.description}
                  onChange={(description) => product({ description })}
                />
                <TextField
                  label="Доставка"
                  multiline
                  value={current.delivery}
                  onChange={(delivery) => product({ delivery })}
                />
                <TextField
                  label="Состав и уход"
                  multiline
                  value={current.care}
                  onChange={(care) => product({ care })}
                />
                <h3>Фотографии</h3>
                <p className="admin-hint">
                  Первая фотография — обложка. JPEG, PNG, WebP, до 8 МБ.
                </p>
                {current.images.map((src, i) => (
                  <div key={`${selected}-${i}`} className="admin-photo">
                    <Upload
                      label={`Фотография ${i + 1}`}
                      value={src}
                      onBusy={onBusy}
                      onChange={(p) =>
                        product({
                          images: current.images.map((old, j) =>
                            j === i ? p : old,
                          ),
                        })
                      }
                    />
                    <div className="admin-order">
                      <button
                        disabled={i === 0}
                        onClick={() => {
                          const images = [...current.images];
                          [images[i - 1], images[i]] = [
                            images[i],
                            images[i - 1],
                          ];
                          product({ images });
                        }}
                      >
                        Раньше
                      </button>
                      <button
                        disabled={current.images.length === 1}
                        onClick={() =>
                          product({
                            images: current.images.filter((_, j) => j !== i),
                          })
                        }
                      >
                        Убрать из товара
                      </button>
                    </div>
                  </div>
                ))}
                {current.images.length < 12 && (
                  <Upload
                    label="Добавить фотографию"
                    value=""
                    onBusy={onBusy}
                    onChange={(p) =>
                      product({ images: [...current.images, p] })
                    }
                  />
                )}
              </div>
            )}
          </section>
        )}
      </fieldset>
      <div className="admin-save">
        <p>
          {dirty ? "Есть несохранённые изменения" : "Все изменения сохранены"}
        </p>
        <button
          className="button"
          disabled={!dirty || busy || uploads > 0}
          onClick={save}
        >
          {busy ? "Сохранение…" : "Сохранить изменения"}
        </button>
        {message && (
          <p
            role={failure ? "alert" : "status"}
            className={failure ? "form-error" : ""}
          >
            {message}
          </p>
        )}
      </div>
      {deleting !== null && data.products[deleting] && (
        <Dialog
          labelId="admin-delete-title"
          onDismiss={() => setDeleting(null)}
          className="admin-delete-dialog"
        >
          <h2 id="admin-delete-title">Удалить товар?</h2>
          <p className="admin-delete-name">{data.products[deleting].name}</p>
          <p className="admin-hint">
            {data.products[deleting].color} · {data.products[deleting].slug}
          </p>
          <p>
            Товар будет удалён из каталога после нажатия «Сохранить изменения».
            Фотографии и ранее оформленные заказы сохранятся.
          </p>
          <div className="admin-delete-actions">
            <button type="button" onClick={() => setDeleting(null)}>
              Отмена
            </button>
            <button
              type="button"
              className="admin-delete-confirm"
              onClick={() => {
                change((d) => ({
                  ...d,
                  products: d.products.filter((_, index) => index !== deleting),
                }));
                setSelected((index) =>
                  index === null || index === deleting
                    ? null
                    : index > deleting
                      ? index - 1
                      : index,
                );
                setDeleting(null);
                setFailure(false);
                setMessage(
                  "Товар убран из списка. Сохраните изменения, чтобы обновить сайт.",
                );
                requestAnimationFrame(() =>
                  productList.current?.focus({ preventScroll: true }),
                );
              }}
            >
              Удалить товар
            </button>
          </div>
        </Dialog>
      )}
    </>
  );
}
