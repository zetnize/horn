import "server-only";
import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { contentSchema, type Content } from "@/lib/content-schema";
import { defaultContent } from "@/data/content-defaults";
import { databaseEnabled } from "./database";
import { readDatabaseContent, saveDatabaseContent } from "./db-content";
export const storageRoot = path.join(process.cwd(), "storage");
const filename = path.join(storageRoot, "content.json");
export async function readContent(): Promise<Content> {
  if (databaseEnabled()) return readDatabaseContent();
  try {
    return contentSchema.parse(JSON.parse(await readFile(filename, "utf8")));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      return structuredClone(defaultContent);
    throw error;
  }
}
// Serializes writes in the supported single Node process; revision detects stale editors.
let pending: Promise<unknown> = Promise.resolve();
export function saveContent(input: Content): Promise<Content> {
  if (databaseEnabled()) return saveDatabaseContent(input);
  const task = pending.then(async () => {
    const current = await readContent();
    if (input.revision !== current.revision) throw new Error("CONFLICT");
    const next = contentSchema.parse({
      ...input,
      revision: current.revision + 1,
    });
    await mkdir(storageRoot, { recursive: true });
    await writeFile(
      path.join(storageRoot, "content.backup.json"),
      JSON.stringify(current, null, 2),
    );
    const temporary = path.join(storageRoot, `${randomUUID()}.tmp`);
    await writeFile(temporary, JSON.stringify(next, null, 2));
    await rename(temporary, filename);
    return next;
  });
  pending = task.catch(() => {});
  return task;
}
