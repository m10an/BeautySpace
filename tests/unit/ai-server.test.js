import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { once } from "node:events";
import {
  createHandler,
  validateInterview,
  generatePlan,
  verifyTurnstile,
} from "../../server/handler.js";
import { createNodeServer } from "../../server/index.js";
const origin = "https://m10an.github.io";
const config = {
  origins: [origin],
  apiKey: "test-only-not-live",
  turnstileSecret: "test-only-secret",
  model: "gpt-4.1-mini",
  dailyLimit: 40,
};
const fixture = JSON.parse(readFileSync("tests/fixtures/ai-plan.json"));
const interview = {
  skinType: "unsure",
  sensitivity: "moderate",
  goals: ["hydration"],
  currentProducts: "Synthetic moisturizer: Aqua, Glycerin",
  actives: "",
  morning: "",
  evening: "",
  constraints: "",
  preferences: "",
  alarmSymptoms: false,
  startDate: "2026-01-01",
  consent: true,
  challengeToken: "synthetic-token",
};
const request = (body = interview, headers = {}) =>
  new Request("https://ai.example/v1/routine-plan", {
    method: "POST",
    headers: { origin, "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
test("missing server key reports unavailable and never calls a model", async () => {
  let called = 0;
  const handler = createHandler({
    config: { ...config, apiKey: "" },
    provider: async () => {
      called++;
      return fixture;
    },
    verify: async () => true,
  });
  const health = await handler(
    new Request("https://ai.example/health", { headers: { origin } }),
  );
  assert.equal((await health.json()).available, false);
  assert.equal((await handler(request())).status, 503);
  assert.equal(called, 0);
});
test("origin, consent and challenge gates all precede provider access", async () => {
  let called = 0;
  const handler = createHandler({
    config,
    provider: async () => {
      called++;
      return fixture;
    },
    verify: async () => false,
  });
  assert.equal(
    (await handler(request(interview, { origin: "https://bad.example" })))
      .status,
    403,
  );
  assert.equal(
    (await handler(request({ ...interview, consent: false }))).status,
    400,
  );
  assert.equal((await handler(request())).status, 403);
  assert.equal(called, 0);
});
test("alarm symptoms receive medical escalation without model request", async () => {
  let called = 0;
  const handler = createHandler({
    config,
    provider: async () => {
      called++;
      return fixture;
    },
    verify: async () => true,
  });
  assert.equal(
    (await handler(request({ ...interview, alarmSymptoms: true }))).status,
    422,
  );
  assert.equal(called, 0);
});
test("valid request returns a separately validated plan, with no-store CORS headers", async () => {
  const handler = createHandler({
    config,
    provider: async () => fixture,
    verify: async () => true,
  });
  const r = await handler(request());
  assert.equal(r.status, 200);
  assert.equal(r.headers.get("cache-control"), "no-store");
  assert.equal(r.headers.get("access-control-allow-origin"), origin);
  assert.deepEqual((await r.json()).plan, fixture);
});
test("malformed provider output is rejected, never patched into a plausible fake plan", async () => {
  const handler = createHandler({
    config,
    provider: async () => ({ text: "unstructured advice" }),
    verify: async () => true,
  });
  assert.equal((await handler(request())).status, 502);
});
test("provider rate limits stay visible, with no automatic retry", async () => {
  let calls = 0;
  const handler = createHandler({
    config,
    provider: async () => {
      calls++;
      const e = Error("limit");
      e.status = 429;
      throw e;
    },
    verify: async () => true,
  });
  const r = await handler(request());
  assert.equal(r.status, 429);
  assert.equal(calls, 1);
  assert.equal(r.headers.get("retry-after"), "60");
});
test("per-IP and daily request caps constrain paid model calls", async () => {
  let calls = 0;
  const handler = createHandler({
    config: { ...config, dailyLimit: 2 },
    provider: async () => {
      calls++;
      return fixture;
    },
    verify: async () => true,
  });
  assert.equal((await handler(request())).status, 200);
  assert.equal((await handler(request())).status, 200);
  assert.equal((await handler(request())).status, 429);
  assert.equal(calls, 2);
});
test("large and unexpected interview payloads fail validation", async () => {
  assert.throws(() => validateInterview({ ...interview, photos: [] }));
  const handler = createHandler({
    config,
    provider: async () => fixture,
    verify: async () => true,
  });
  assert.equal(
    (
      await handler(
        request({ ...interview, currentProducts: "x".repeat(40000) }),
      )
    ).status,
    413,
  );
});
test("real provider adapter sends strict schema, a token cap and store:false", async () => {
  let sent;
  const result = await generatePlan(
    interview,
    config,
    new AbortController().signal,
    async (url, options) => {
      assert.equal(url, "https://api.openai.com/v1/responses");
      sent = JSON.parse(options.body);
      return new Response(
        JSON.stringify({
          status: "completed",
          output: [
            {
              content: [{ type: "output_text", text: JSON.stringify(fixture) }],
            },
          ],
        }),
        { status: 200 },
      );
    },
  );
  assert.deepEqual(result, fixture);
  assert.equal(sent.store, false);
  assert.equal(sent.max_output_tokens, 2000);
  assert.equal(sent.text.format.strict, true);
  assert.equal(sent.input.includes("challengeToken"), false);
});
test("Turnstile verification checks action and hostname, not success alone", async () => {
  const verify = (result) =>
    verifyTurnstile(
      "fixture",
      "fixture",
      new AbortController().signal,
      config,
      async () => new Response(JSON.stringify(result)),
    );
  assert.equal(
    await verify({
      success: true,
      action: "beauty-routine",
      hostname: "m10an.github.io",
    }),
    true,
  );
  assert.equal(
    await verify({
      success: true,
      action: "wrong",
      hostname: "m10an.github.io",
    }),
    false,
  );
  assert.equal(
    await verify({
      success: true,
      action: "beauty-routine",
      hostname: "bad.example",
    }),
    false,
  );
});
test("Node HTTP adapter starts and exposes an honest unconfigured health endpoint", async () => {
  const server = createNodeServer({ config: { ...config, apiKey: "" } });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  try {
    const r = await fetch(`http://127.0.0.1:${server.address().port}/health`, {
      headers: { origin },
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).available, false);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
test("concurrent verified requests cannot overshoot the daily paid-call budget", async () => {
  let calls = 0;
  const handler = createHandler({
    config: { ...config, dailyLimit: 2 },
    verify: async () => {
      await Promise.resolve();
      return true;
    },
    provider: async () => {
      calls++;
      return fixture;
    },
  });
  const responses = await Promise.all(
    Array.from({ length: 5 }, (_, i) =>
      handler(request(), { ip: "fixture-" + i }),
    ),
  );
  assert.equal(calls, 2);
  assert.equal(responses.filter((r) => r.status === 429).length, 3);
});
