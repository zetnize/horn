import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export function environmentAdmin(env: NodeJS.ProcessEnv = process.env) {
  const login = env.ADMIN_LOGIN;
  const password = env.ADMIN_PASSWORD;
  if (login === undefined && password === undefined) return null;
  if (
    !login ||
    login.length > 100 ||
    !password ||
    password.length < 12 ||
    password.length > 256
  )
    throw new Error("ADMIN_ENV_INVALID");
  return { login, password };
}
export function matchesEnvironmentAdmin(login: string, password: string) {
  const config = environmentAdmin();
  if (!config) return null;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  const loginMatches = timingSafeEqual(digest(login), digest(config.login));
  const passwordMatches = timingSafeEqual(
    digest(password),
    digest(config.password),
  );
  return loginMatches && passwordMatches;
}
export function adminSessionHash(token: string) {
  const config = environmentAdmin();
  return config
    ? createHmac("sha256", config.password)
        .update(JSON.stringify(["northia-admin-env-v1", config.login, token]))
        .digest("hex")
    : createHash("sha256").update(token).digest("hex");
}
