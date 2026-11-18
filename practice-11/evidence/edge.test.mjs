import { after, test } from "node:test";
import assert from "node:assert/strict";

let handle;
globalThis.Deno = { serve(handler) { handle = handler; } };
await import("../../supabase/functions/explain-availability/index.ts");
after(() => { delete globalThis.Deno; });

const facts = {
  available: true, reason: null, roomName: "Library Study Room B-12",
  startLabel: "23:00", endLabel: "24:00", durationMinutes: 60,
};

async function request(body) {
  return handle(new Request("http://localhost", {
    method: "POST", body: JSON.stringify(body),
  }));
}

for (const [name, body] of [
  ["null body", null],
  ["blank label", { ...facts, roomName: "   " }],
  ["long label", { ...facts, roomName: "x".repeat(101) }],
  ["malformed time", { ...facts, endLabel: "24:15" }],
  ["long reason", { ...facts, reason: "x".repeat(301) }],
  ["bad reason type", { ...facts, reason: 4 }],
  ["incorrect duration", { ...facts, durationMinutes: 61 }],
  ["contradictory available facts", { ...facts, reason: "Room is blocked." }],
]) {
  test("edge rejects " + name, async () => {
    assert.equal((await request(body)).status, 400);
  });
}

test("edge accepts a valid legacy request ending at 24:00", async () => {
  const response = await request(facts);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.source, "mock-ai");
  assert.match(body.explanation, /23:00 to 24:00/);
});

test("edge accepts structured facts for an unavailable reversed interval", async () => {
  const response = await request({
    isAvailable: false, roomLabel: facts.roomName, startTime: "12:00", endTime: "11:00",
    reasonCode: "INVALID_ORDER", reasonMessage: "Start time must be before end time.",
  });
  assert.equal(response.status, 200);
  assert.match((await response.json()).explanation, /earlier than the end time/);
});
