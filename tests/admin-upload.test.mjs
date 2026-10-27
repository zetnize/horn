import test from "node:test";
import assert from "node:assert/strict";
import {
  uploadedImagePath,
  MAX_IMAGE_BYTES,
  IMAGE_SIZE_MESSAGE,
} from "../lib/admin-upload.ts";

test("plain text/HTML hosting failures yield readable upload errors", async () => {
  assert.ok(MAX_IMAGE_BYTES < 4_500_000);
  for (const body of [
    "Request Entity Too Large",
    "<html>Payload Too Large</html>",
  ])
    await assert.rejects(
      uploadedImagePath(new Response(body, { status: 413 })),
      { message: IMAGE_SIZE_MESSAGE },
    );
  await assert.rejects(
    uploadedImagePath(new Response("upstream failure", { status: 502 })),
    /Не удалось загрузить/,
  );
  await assert.rejects(
    uploadedImagePath(new Response("<html>Login</html>", { status: 403 })),
    /Сессия истекла/,
  );
  await assert.rejects(
    uploadedImagePath(new Response("Request Error", { status: 200 })),
    /не подтвердил/,
  );
});
test("only confirmed PNG paths update image selection", async () => {
  const path = "/media/12345678-abcd-4321-abcd-123456789abc.png";
  assert.equal(await uploadedImagePath(Response.json({ path })), path);
  for (const data of [
    null,
    {},
    { path: "https://external.invalid/file.png" },
    { path: 42 },
  ])
    await assert.rejects(
      uploadedImagePath(Response.json(data)),
      /не подтвердил/,
    );
  await assert.rejects(
    uploadedImagePath(
      Response.json({ message: "Выберите PNG" }, { status: 400 }),
    ),
    /Выберите PNG/,
  );
});
