import test from "node:test";
import assert from "node:assert/strict";
import {
  uploadedImagePath,
  MAX_IMAGE_BYTES,
  IMAGE_SIZE_MESSAGE,
  MAX_JPEG_INPUT_BYTES,
  prepareImageUpload,
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
test("only confirmed PNG and JPG paths update image selection", async () => {
  for (const extension of ["png", "jpg"]) {
    const path = `/media/12345678-abcd-4321-abcd-123456789abc.${extension}`;
    assert.equal(await uploadedImagePath(Response.json({ path })), path);
  }
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

test("upload preparation accepts JPEG bytes, rejects unsupported files and keeps separate size limits", async () => {
  const jpeg = new Uint8Array([255, 216, 255, 224]);
  const file = new File([jpeg], "photo.jpeg");
  const upload = await prepareImageUpload(file);
  assert.equal(upload.type, "image/jpeg");
  assert.deepEqual(new Uint8Array(await upload.arrayBuffer()), jpeg);
  await assert.rejects(prepareImageUpload(new File(["<svg/>"], "photo.jpg")), /формате JPG или PNG/);
  await assert.rejects(
    prepareImageUpload(new File([jpeg, new Uint8Array(MAX_JPEG_INPUT_BYTES)], "large.jpg")),
    /не больше 10 МБ/,
  );
  await assert.rejects(
    prepareImageUpload(new File([
      new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
      new Uint8Array(MAX_IMAGE_BYTES),
    ], "large.png")),
    /не больше 4 МБ/,
  );
});
