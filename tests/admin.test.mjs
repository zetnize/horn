import test from "node:test";
import assert from "node:assert/strict";
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:5000";
const login = process.env.TEST_ADMIN_LOGIN;
const password = process.env.TEST_ADMIN_PASSWORD;
test(
  "admin authorization, content, uploads, catalog and session revocation",
  { skip: !login || !password },
  async () => {
    let cookie = "";
    const call = (url, method = "GET", body, origin = base) =>
      fetch(base + url, {
        method,
        headers: {
          Origin: origin,
          Cookie: cookie,
          "Content-Type": "application/json",
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    assert.equal((await call("/api/admin/content")).status, 401);
    assert.equal((await call("/api/admin/content", "PUT", {})).status, 403);
    assert.equal((await call("/api/admin/upload", "POST", {})).status, 403);
    assert.equal(
      (
        await call(
          "/api/admin/session",
          "POST",
          { login, password },
          "https://foreign.example",
        )
      ).status,
      403,
    );
    assert.equal(
      (
        await call("/api/admin/session", "POST", {
          login,
          password: "incorrect",
        })
      ).status,
      401,
    );
    const session = await call("/api/admin/session", "POST", {
      login,
      password,
    });
    assert.equal(session.status, 200);
    const header = session.headers.get("set-cookie");
    assert.match(header, /HttpOnly/i);
    assert.match(header, /SameSite=strict/i);
    cookie = header.split(";")[0];
    const original = await (await call("/api/admin/content")).json();
    let revision = original.revision;
    try {
      assert.equal(
        (
          await call(
            "/api/admin/content",
            "PUT",
            original,
            "https://foreign.example",
          )
        ).status,
        403,
      );
      const invalid = structuredClone(original);
      invalid.products[0].price = -1;
      assert.equal(
        (await call("/api/admin/content", "PUT", invalid)).status,
        400,
      );
      invalid.products[0].price = 100;
      invalid.settings.telegram = "javascript:alert(1)";
      assert.equal(
        (await call("/api/admin/content", "PUT", invalid)).status,
        400,
      );
      assert.equal(
        (await call("/api/admin/upload", "POST", { svg: "<svg/>" })).status,
        400,
      );
      const png = Buffer.from(
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0a0AAAAASUVORK5CYII=",
        "base64",
      );
      const upload = await fetch(base + "/api/admin/upload", {
        method: "POST",
        headers: { Origin: base, Cookie: cookie, "Content-Type": "image/png" },
        body: png,
      });
      assert.equal(upload.status, 200);
      const media = (await upload.json()).path;
      const image = await fetch(base + media);
      assert.equal(image.status, 200);
      assert.equal(image.headers.get("content-type"), "image/png");
      const edited = structuredClone(original);
      edited.settings.heroImage = media;
      edited.settings.brandCopy = "Проверка сохранения NORTHIA";
      edited.settings.preorderIntro = "Проверка текста предзаказа";
      const slug = "admin-test-" + Date.now();
      edited.products.unshift({
        ...edited.products[0],
        slug,
        name: "Проверочный товар",
        price: 6123,
        sizes: ["M"],
        hidden: false,
      });
      const saved = await call("/api/admin/content", "PUT", edited);
      assert.equal(saved.status, 200);
      revision = (await saved.json()).revision;
      assert.equal(
        (await call("/api/admin/content", "PUT", edited)).status,
        409,
      );
      const home = await (await fetch(base)).text();
      assert.ok(home.includes(edited.settings.brandCopy));
      assert.ok(home.includes(media));
      const product = await fetch(base + "/product/" + slug);
      assert.equal(product.status, 200);
      assert.ok((await product.text()).includes("Проверочный товар"));
      const loaded = await (await call("/api/admin/content")).json();
      assert.equal(loaded.products[0].price, 6123);
      assert.equal(
        loaded.settings.preorderIntro,
        edited.settings.preorderIntro,
      );
      loaded.products[0].hidden = true;
      const hidden = await call("/api/admin/content", "PUT", loaded);
      assert.equal(hidden.status, 200);
      revision = (await hidden.json()).revision;
      assert.equal((await fetch(base + "/product/" + slug)).status, 404);
    } finally {
      const restored = await call("/api/admin/content", "PUT", {
        ...original,
        revision,
      });
      assert.equal(restored.status, 200, "restore original content");
    }
    assert.equal((await call("/api/admin/session", "DELETE")).status, 200);
    assert.equal(
      (await call("/api/admin/content")).status,
      401,
      "logged-out cookie cannot be reused",
    );
  },
);
