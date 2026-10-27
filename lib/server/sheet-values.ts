// Pure helpers, shared only by server modules and tests.
export const SHEETS = {
  preorder: "Заявки",
  waitlist: "Лист ожидания",
} as const;
export function escapeSheetCell(value: string | number): string | number {
  if (typeof value === "number") return value;
  return /^[=+\-@]/.test(value.trimStart()) ? `'${value}` : value;
}
export function moscowDate(date = new Date()) {
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Moscow",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
