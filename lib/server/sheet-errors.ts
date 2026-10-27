import "server-only";

export class SheetConfigurationError extends Error {
  constructor(public readonly reason: "missing-env" | "missing-tab") {
    super(reason);
    this.name = "SheetConfigurationError";
  }
}
