import "server-only";

export class SheetConfigurationError extends Error {
  constructor(public readonly reason: "missing-env" | "missing-tab") {
    super(reason);
    this.name = "SheetConfigurationError";
  }
}

const safeReasons = new Set([
  "accessNotConfigured",
  "serviceDisabled",
  "SERVICE_DISABLED",
  "forbidden",
  "insufficientPermissions",
  "ACCESS_TOKEN_SCOPE_INSUFFICIENT",
  "PERMISSION_DENIED",
  "IAM_PERMISSION_DENIED",
  "CONSUMER_INVALID",
  "rateLimitExceeded",
  "userRateLimitExceeded",
  "dailyLimitExceeded",
  "quotaExceeded",
  "QUOTA_EXCEEDED",
  "RATE_LIMIT_EXCEEDED",
  "authError",
  "invalid_grant",
  "UNAUTHENTICATED",
  "NOT_FOUND",
]);
function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}
export class SheetRequestError extends Error {
  readonly status?: number;
  readonly googleReason: string;
  constructor(
    error: unknown,
    readonly stage: "metadata" | "append",
  ) {
    super("sheets-request-failed");
    this.name = "SheetRequestError";
    const source = record(error);
    const response = record(source.response);
    const body = record(record(response.data).error);
    const status = response.status ?? source.status ?? source.code;
    this.status =
      typeof status === "number" &&
      Number.isInteger(status) &&
      status >= 100 &&
      status <= 599
        ? status
        : undefined;
    const candidates = [
      ...(Array.isArray(body.details)
        ? body.details.map((v) => record(v).reason)
        : []),
      ...(Array.isArray(body.errors)
        ? body.errors.map((v) => record(v).reason)
        : []),
      body.status,
      record(response.data).error,
    ];
    this.googleReason =
      candidates.find(
        (value): value is string =>
          typeof value === "string" && safeReasons.has(value),
      ) ?? "unclassified";
  }
}
