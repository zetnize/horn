import "server-only";

export type ScriptOrder = {
  fullName: string;
  phone: string;
  contact: string;
  city: string;
  pickupAddress: string;
  comment: string;
};

export class ScriptError extends Error {
  readonly reason:
    | "missing-env"
    | "invalid-url"
    | "request-failed"
    | "invalid-response";
  constructor(reason: ScriptError["reason"]) {
    super(reason);
    this.name = "ScriptError";
    this.reason = reason;
  }
}

export async function sendScriptOrder(order: ScriptOrder): Promise<void> {
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
    url.port || url.username || url.password || url.search || url.hash ||
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
    if (!response.ok) throw new ScriptError("request-failed");
    const result: unknown = await response.json();
    if (!result || typeof result !== "object" || Array.isArray(result))
      throw new ScriptError("invalid-response");
    const data = result as Record<string, unknown>;
    const confirmed =
      data.ok === true || data.success === true || data.status === "success";
    if (
      !confirmed || data.ok === false || data.success === false || data.error ||
      (data.status !== undefined && data.status !== "success")
    )
      throw new ScriptError("invalid-response");
  } catch (error) {
    // Do not propagate upstream bodies, URLs, request details or customer data.
    if (error instanceof ScriptError) throw error;
    throw new ScriptError("request-failed");
  }
}
