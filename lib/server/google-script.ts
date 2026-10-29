import "server-only";

export type ScriptOrder = {
  fullName: string;
  phone: string;
  contact: string;
  city: string;
  pickupAddress: string;
  comment: string;
  orderItems?: string;
};
type ScriptWaitlist = { name: string; contact: string; phone: string; comment: string; consentVersion: string };

export class ScriptError extends Error {
  readonly reason:
    | "missing-env"
    | "invalid-url"
    | "request-failed"
    | "http-error"
    | "timeout"
    | "auth-required"
    | "invalid-json"
    | "script-unauthorized"
    | "script-invalid-fields"
    | "script-sheet-not-found"
    | "script-server-error"
    | "invalid-response";
  readonly status?: number;
  constructor(reason: ScriptError["reason"], status?: number) {
    super(reason);
    this.name = "ScriptError";
    this.reason = reason;
    this.status = status;
  }
}

export async function sendScriptOrder(order: ScriptOrder): Promise<void> {
  return sendScriptRequest(order);
}

export async function sendScriptWaitlist(input: ScriptWaitlist): Promise<void> {
  return sendScriptRequest({
    type: "waitlist",
    name: input.name,
    contact: input.contact,
    phone: input.phone,
    comment: input.comment,
    consentVersion: input.consentVersion,
  });
}

async function sendScriptRequest(
  order: ScriptOrder | (ScriptWaitlist & { type: "waitlist" }),
): Promise<void> {
  const endpoint = process.env.GOOGLE_SCRIPT_URL;
  const secret = process.env.GOOGLE_SCRIPT_SECRET;
  if (!endpoint || !secret?.trim()) throw new ScriptError("missing-env");
  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    throw new ScriptError("invalid-url");
  }
  if (
    url.protocol !== "https:" ||
    url.hostname !== "script.google.com" ||
    url.port ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/macros\/s\/[\w-]+\/exec$/.test(url.pathname)
  )
    throw new ScriptError("invalid-url");

  try {
    // ContentService redirects the response to script.googleusercontent.com.
    // Never retry POST automatically: the row may already have been written.
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...order, secret }),
      cache: "no-store",
      redirect: "follow",
      signal: AbortSignal.timeout(15_000),
    });
    if (
      response.url &&
      new URL(response.url).hostname === "accounts.google.com"
    )
      throw new ScriptError("auth-required", response.status);
    if (!response.ok) throw new ScriptError("http-error", response.status);
    let result: unknown;
    try {
      result = await response.json();
    } catch (error) {
      if (error instanceof SyntaxError)
        throw new ScriptError("invalid-json", response.status);
      throw error;
    }
    if (!result || typeof result !== "object" || Array.isArray(result))
      throw new ScriptError("invalid-response", response.status);
    const data = result as Record<string, unknown>;
    // Only fixed, known script errors may reach logs; never forward arbitrary text.
    if (data.success === false) {
      switch (data.error) {
        case "Unauthorized":
          throw new ScriptError("script-unauthorized", response.status);
        case "Invalid fields":
          throw new ScriptError("script-invalid-fields", response.status);
        case "Sheet not found":
          throw new ScriptError("script-sheet-not-found", response.status);
        case "Server error":
          throw new ScriptError("script-server-error", response.status);
      }
    }
    const confirmed =
      data.ok === true || data.success === true || data.status === "success";
    if (
      !confirmed ||
      data.ok === false ||
      data.success === false ||
      data.error ||
      (data.status !== undefined && data.status !== "success")
    )
      throw new ScriptError("invalid-response", response.status);
  } catch (error) {
    // Do not propagate upstream bodies, URLs, request details or customer data.
    if (error instanceof ScriptError) throw error;
    if (
      error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    )
      throw new ScriptError("timeout");
    throw new ScriptError("request-failed");
  }
}
