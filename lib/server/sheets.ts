import "server-only";
import { google } from "googleapis";
import { escapeSheetCell, SHEETS } from "./sheet-values";
type SheetName = (typeof SHEETS)[keyof typeof SHEETS];
export class SheetConfigurationError extends Error {
  constructor(public readonly reason: "missing-env" | "missing-tab") {
    super(reason);
    this.name = "SheetConfigurationError";
  }
}
export async function appendSheetRow(
  sheet: SheetName,
  row: (string | number)[],
) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!email || !privateKey || !sheetId) {
    if (process.env.NODE_ENV === "development") {
      console.info("[NORTHIA DEV: заявка не сохранена в Google Sheets]", {
        sheet,
        values: row.map(escapeSheetCell),
      });
      return;
    }
    throw new SheetConfigurationError("missing-env");
  }
  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const options = { timeout: 10_000, retry: false };
  const metadata = await sheets.spreadsheets.get(
    { spreadsheetId: sheetId, fields: "sheets.properties.title" },
    options,
  );
  if (!metadata.data.sheets?.some((tab) => tab.properties?.title === sheet))
    throw new SheetConfigurationError("missing-tab");
  await sheets.spreadsheets.values.append(
    {
      spreadsheetId: sheetId,
      range: `'${sheet}'!A:${sheet === SHEETS.preorder ? "J" : "C"}`,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row.map(escapeSheetCell)] },
    },
    options,
  );
}
