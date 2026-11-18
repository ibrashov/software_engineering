import { afterEach, expect, it, vi } from "vitest";
import { fetchMockExplanation } from "./mockExplanation";

afterEach(() => vi.unstubAllEnvs());
afterEach(() => vi.unstubAllGlobals());

it("falls back when the adapter adds an unsupported detail to an available result", async () => {
  vi.stubEnv("VITE_SUPABASE_URL", "https://example.invalid");
  vi.stubEnv("VITE_SUPABASE_ANON_KEY", "demo");
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({
    explanation: "Library Study Room B-12 is free from 11:00 to 12:00. The room has a projector.",
    source: "mock-ai",
  })));

  const result = await fetchMockExplanation({
    available: true,
    reason: null,
    roomName: "Library Study Room B-12",
    startLabel: "11:00",
    endLabel: "12:00",
    durationMinutes: 60,
  });

  expect(result).toMatchObject({ ok: true, source: "deterministic-fallback" });
});
