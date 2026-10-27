import "server-only";
import { cookies } from "next/headers";
import {
  randomBytes,
  createHash,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import { readFile, mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { storageRoot } from "./content";
import { database, databaseEnabled } from "./database";
const cookieName = "northia_admin";
const sessions = path.join(storageRoot, "sessions");
function sessionPath(token: string) {
  return path.join(
    sessions,
    createHash("sha256").update(token).digest("hex") + ".json",
  );
}
export async function authenticated() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return false;
  if (databaseEnabled()) {
    const rows =
      await database()`select 1 from northia.sessions where token_hash=${createHash("sha256").update(token).digest("hex")} and expires_at > now()`;
    return rows.length > 0;
  }
  try {
    const session = JSON.parse(await readFile(sessionPath(token), "utf8"));
    return typeof session.expires === "number" && session.expires > Date.now();
  } catch {
    return false;
  }
}
export async function checkCredentials(login: string, password: string) {
  const config = databaseEnabled()
    ? (
        await database()`select login,salt,hash from northia.admins where login=${login}`
      )[0]
    : JSON.parse(await readFile(path.join(storageRoot, "admin.json"), "utf8"));
  if (!config) return false;
  const actual = scryptSync(password, config.salt, 64);
  const expected = Buffer.from(config.hash, "hex");
  return (
    expected.length === actual.length &&
    timingSafeEqual(actual, expected) &&
    login === config.login
  );
}
export async function startSession(request: Request) {
  await endSession();
  const token = randomBytes(32).toString("hex");
  if (databaseEnabled()) {
    await database()`delete from northia.sessions where expires_at <= now()`;
    await database()`insert into northia.sessions(token_hash,expires_at) values(${createHash("sha256").update(token).digest("hex")},now()+interval '8 hours')`;
  } else {
    await mkdir(sessions, { recursive: true });
    await writeFile(
      sessionPath(token),
      JSON.stringify({ expires: Date.now() + 8 * 3600000 }),
    );
  }
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    sameSite: "strict",
    secure: request.headers.get("origin")?.startsWith("https://") === true,
    path: "/",
    maxAge: 8 * 3600,
  });
}
export async function endSession() {
  const jar = await cookies();
  const token = jar.get(cookieName)?.value;
  if (token && /^[a-f0-9]{64}$/.test(token)) {
    if (databaseEnabled())
      await database()`delete from northia.sessions where token_hash=${createHash("sha256").update(token).digest("hex")}`;
    else await unlink(sessionPath(token)).catch(() => {});
  }
  jar.delete(cookieName);
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    const url = new URL(origin);
    return (
      ["http:", "https:"].includes(url.protocol) &&
      url.host === request.headers.get("host")
    );
  } catch {
    return false;
  }
}
