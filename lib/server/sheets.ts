import "server-only";
import { auth as googleAuth, sheets as googleSheets } from "googleapis/build/src/apis/sheets/index.js";
import { escapeSheetCell, SHEETS } from "./sheet-values";
import { SheetConfigurationError } from "./sheet-errors";
type SheetName = (typeof SHEETS)[keyof typeof SHEETS];
export async function appendSheetRow(
  sheet: SheetName,
  row: (string | number)[],
) {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const sheetId = process.env.GOOGLE_SHEET_ID;
  if (!email || !privateKey || !sheetId) {
    throw new SheetConfigurationError("missing-env");
  }
  const auth = new googleAuth.JWT({
    email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = googleSheets({ version: "v4", auth });
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
