import test from "node:test";
import assert from "node:assert/strict";
import { escapeSheetCell, moscowDate } from "../lib/server/sheet-values.ts";
test("formula prefixes are escaped, including leading whitespace", () => {
  for (const value of [
    "=SUM(A1:A2)",
    "+79991234567",
    "-1",
    "@contact",
    "  =1+1",
    "\t@user",
  ])
    assert.equal(escapeSheetCell(value), "'" + value);
  assert.equal(escapeSheetCell("Обычный текст"), "Обычный текст");
  assert.equal(escapeSheetCell(9960), 9960);
});
test("date uses Moscow even across UTC day boundary", () => {
  const date = moscowDate(new Date("2026-10-26T22:30:00Z"));
  assert.match(date, /27\.10\.2026/);
  assert.match(date, /01:30:00/);
});
