import { mkdir, writeFile } from "node:fs/promises";
import { randomBytes, scryptSync } from "node:crypto";
import path from "node:path";
import { spawnSync } from "node:child_process";

try {
  process.loadEnvFile(".env.local");
} catch (error) {
  if (error.code !== "ENOENT") throw new Error("ENV_FILE_INVALID");
}
if (process.env.DATABASE_URL) {
  const result = spawnSync(
    process.execPath,
    ["scripts/database.mjs", "admin", "--apply"],
    { stdio: "inherit", env: process.env },
  );
  process.exitCode = result.status ?? 1;
} else {
  const login = process.env.ADMIN_SETUP_LOGIN;
  const password = process.env.ADMIN_SETUP_PASSWORD;
  if (
    !login ||
    !password ||
    login.length > 100 ||
    password.length < 8 ||
    password.length > 256
  ) {
    console.error(
      "Передайте ADMIN_SETUP_LOGIN и ADMIN_SETUP_PASSWORD (8–256 символов) через защищённое окружение процесса.",
    );
    process.exitCode = 1;
  } else {
    const root = path.join(process.cwd(), "storage");
    await mkdir(root, { recursive: true });
    const salt = randomBytes(32).toString("hex");
    try {
      await writeFile(
        path.join(root, "admin.json"),
        JSON.stringify({
          login,
          salt,
          hash: scryptSync(password, salt, 64).toString("hex"),
        }),
        { flag: "wx", mode: 0o600 },
      );
      console.log("Администратор настроен. Пароль сохранён в виде хеша.");
    } catch (error) {
      if (error.code === "EEXIST") {
        console.error(
          "Администратор уже настроен. Существующий файл не изменён.",
        );
        process.exitCode = 1;
      } else throw error;
    }
  }
}
