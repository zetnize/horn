const SCRIPT_VERSION = "northia-2026-10-28-waitlist-v1";
const ORDER_SHEET_NAME = "Заявки";
const WAITLIST_SHEET_NAME = "Лист ожидания";

function doGet() {
  return json({ success: true, supportsWaitlist: true });
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return json({ success: false, error: "Invalid fields" });
    }
    const data = JSON.parse(e.postData.contents);
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return json({ success: false, error: "Invalid fields" });
    }
    const secret = PropertiesService.getScriptProperties().getProperty("FORM_SECRET");
    if (!secret || data.secret !== secret) {
      return json({ success: false, error: "Unauthorized" });
    }
    const type = data.type === undefined ? "preorder" : text(data.type);
    if (type !== "preorder" && type !== "waitlist") {
      return json({ success: false, error: "Invalid fields" });
    }
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    if (!spreadsheet) return json({ success: false, error: "Sheet not found" });

    if (type === "waitlist") {
      const name = text(data.name ?? data.fullName);
      const contact = text(data.contact);
      const consentVersion = text(data.consentVersion);
      if (!name || !contact || name.length > 150 || contact.length > 150 || consentVersion.length > 100) {
        return json({ success: false, error: "Invalid fields" });
      }
      const sheet = spreadsheet.getSheetByName(WAITLIST_SHEET_NAME);
      if (!sheet) return json({ success: false, error: "Sheet not found" });
      const receivedAt = new Date();
      const consent = consentVersion
        ? "Версия согласия: " + consentVersion + "; получено сервером: " + receivedAt.toISOString()
        : "Версия согласия не передана";
      sheet.appendRow([receivedAt, safe(name), safe(contact), safe(consent)]);
      return json({ success: true, message: "Waitlist application saved" });
    }

    const fullName = text(data.fullName);
    const phone = text(data.phone);
    const contact = text(data.contact);
    const city = text(data.city);
    const pickupAddress = text(data.pickupAddress);
    const comment = text(data.comment);
    if (!fullName || !phone || !city || !pickupAddress || fullName.length > 150 || phone.length > 40 || contact.length > 150 || city.length > 100 || pickupAddress.length > 300 || comment.length > 2000) {
      return json({ success: false, error: "Invalid fields" });
    }
    const sheet = spreadsheet.getSheetByName(ORDER_SHEET_NAME);
    if (!sheet) return json({ success: false, error: "Sheet not found" });
    sheet.appendRow([new Date(), safe(fullName), safe(phone), safe(contact), safe(city), safe(pickupAddress), safe(comment), "Новая"]);
    return json({ success: true, message: "Application saved" });
  } catch (_) {
    console.error("NORTHIA: request processing failed");
    return json({ success: false, error: "Server error" });
  }
}

function text(value) {
  return String(value ?? "").trim();
}
function safe(value) {
  return /^\s*[=+\-@]/.test(value) ? "'" + value : value;
}
function json(data) {
  return ContentService.createTextOutput(JSON.stringify(Object.assign({}, data, { version: SCRIPT_VERSION }))).setMimeType(ContentService.MimeType.JSON);
}
