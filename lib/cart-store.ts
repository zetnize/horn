import { type Size } from "@/data/products";
export type CartItem = { slug: string; size: Size; qty: number };
export const CART_KEY = "northia.cart.v1";
export const MAX_QTY = 99;
const empty: CartItem[] = [];
const serverSnapshot = { items: empty, ready: false };
let snapshot: { items: CartItem[]; ready: boolean } = serverSnapshot;
const listeners = new Set<() => void>();
export function parseCart(value: unknown): CartItem[] {
  if (!Array.isArray(value) || value.length > 50) return [];
  const result: CartItem[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const { slug, size, qty } = item;
    if (
      typeof slug !== "string" ||
      typeof size !== "string" ||
      !Number.isInteger(qty) ||
      qty < 1 ||
      qty > MAX_QTY
    )
      continue;
    if (
      !/^[a-z0-9-]{1,100}$/.test(slug) ||
      !["XS", "S", "M", "L", "XL"].includes(size)
    )
      continue;
    const existing = result.find(
      (line) => line.slug === slug && line.size === size,
    );
    if (existing) existing.qty = Math.min(MAX_QTY, existing.qty + qty);
    else result.push({ slug, size: size as Size, qty });
  }
  return result;
}
function read(): CartItem[] {
  try {
    return parseCart(JSON.parse(localStorage.getItem(CART_KEY) ?? "[]"));
  } catch {
    return [];
  }
}
export function getCartSnapshot() {
  if (typeof window !== "undefined" && !snapshot.ready)
    snapshot = { items: read(), ready: true };
  return snapshot;
}
export function getServerCartSnapshot() {
  return serverSnapshot;
}
function emit() {
  listeners.forEach((listener) => listener());
}
function onStorage(event: StorageEvent) {
  if (
    event.storageArea === localStorage &&
    (event.key === CART_KEY || event.key === null)
  ) {
    snapshot = { items: read(), ready: true };
    emit();
  }
}
export function subscribeCart(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    if (!listeners.size) window.removeEventListener("storage", onStorage);
  };
}
function save(items: CartItem[]) {
  snapshot = { items, ready: true };
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
  } catch {
    /* Корзина работает в памяти, если storage недоступен. */
  }
  emit();
}
export function addCartItem(slug: string, size: Size) {
  const items = getCartSnapshot().items;
  const existing = items.find(
    (item) => item.slug === slug && item.size === size,
  );
  save(
    existing
      ? items.map((item) =>
          item === existing
            ? { ...item, qty: Math.min(MAX_QTY, item.qty + 1) }
            : item,
        )
      : [...items, { slug, size, qty: 1 }],
  );
}
export function removeCartItem(slug: string, size: Size) {
  save(
    getCartSnapshot().items.filter(
      (item) => item.slug !== slug || item.size !== size,
    ),
  );
}
export function clearCart() {
  save([]);
}
