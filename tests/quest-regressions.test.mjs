import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("uses a direct coach asset with a built-in fallback", async () => {
  const page = await readFile(new URL("app/page.tsx", root), "utf8");
  const fallback = await readFile(new URL("public/coach-bot.svg", root), "utf8");

  assert.doesNotMatch(page, /next\/image/);
  assert.match(page, /src="\/coach-bot\.webp\?v=5"/);
  assert.match(page, /image\.src = "\/coach-bot\.svg\?v=5"/);
  assert.match(fallback, /<title id="title">Pixel Coach<\/title>/);
});

test("keeps the real AI endpoint private to the signed-in Site owner", async () => {
  const workerUrl = new URL("dist/server/index.js", root);
  workerUrl.searchParams.set("coach-test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const ctx = { waitUntil() {}, passThroughOnException() {} };
  const baseEnv = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    OPENAI_API_KEY: "test-only",
    COACH_OWNER_EMAIL: "owner@example.com",
    COACH_AI_MODEL: "gpt-5.6-luna",
  };

  const anonymous = await worker.fetch(new Request("http://localhost/api/coach"), baseEnv, ctx);
  assert.deepEqual(await anonymous.json(), { status: "signin", model: "gpt-5.6-luna" });

  const visitor = await worker.fetch(new Request("http://localhost/api/coach", {
    headers: { "oai-authenticated-user-email": "visitor@example.com" },
  }), baseEnv, ctx);
  assert.deepEqual(await visitor.json(), { status: "forbidden", model: "gpt-5.6-luna" });

  const owner = await worker.fetch(new Request("http://localhost/api/coach", {
    headers: { "oai-authenticated-user-email": "owner@example.com" },
  }), baseEnv, ctx);
  assert.deepEqual(await owner.json(), { status: "ready", model: "gpt-5.6-luna" });
});
