import { submit } from "@/lib/server/submit";
import { appendSheetRow } from "@/lib/server/sheets";
import { moscowDate, SHEETS } from "@/lib/server/sheet-values";
export const runtime = "nodejs";
export async function POST(request: Request) {
  return submit(request, "waitlist", async (input) => {
    await appendSheetRow(SHEETS.waitlist, [
      moscowDate(), input.name, input.contact,
      `Согласие: ${input.consentVersion}; принято: ${new Date().toISOString()}; форма: waitlist`,
    ]);
  });
}
