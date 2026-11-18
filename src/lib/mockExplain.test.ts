import { describe, it, expect } from "vitest";
import { explainMock, type MockAvailabilityFacts } from "@/lib/mockExplain";


function makeFacts(overrides: Partial<MockAvailabilityFacts> = {}): MockAvailabilityFacts {
  return {
    available: true,
    reason: null,
    roomName: "Library Study Room B-12",
    startLabel: "11:00",
    endLabel: "12:00",
    durationMinutes: 60,
    ...overrides,
  };
}

describe("explainMock", () => {
  it("E01: available slot mentions room, time range, and duration", () => {
    const text = explainMock(makeFacts());
    expect(text).toContain("Library Study Room B-12");
    expect(text).toContain("11:00");
    expect(text).toContain("12:00");
    expect(text).toContain("60");
  });

  it("E02: blocked room produces a blocked explanation", () => {
    const text = explainMock(makeFacts({ available: false, reason: "Room is blocked." }));
    expect(text).toContain("blocked");
  });

  it("E03: past-time reason produces a past-time explanation", () => {
    const text = explainMock(
      makeFacts({
        available: false,
        reason: "Booking must be in the future — current time is 09:00.",
      })
    );
    expect(text).toContain("already passed");
  });

  it("E04: overlap reason includes the existing booking window", () => {
    const text = explainMock(
      makeFacts({
        available: false,
        reason:
          "Requested time overlaps an existing booking (10:00–11:00). Touching endpoints are allowed.",
      })
    );
    expect(text).toContain("10:00");
    expect(text).toContain("11:00");
  });

  it("E05: duration-cap reason includes the requested duration", () => {
    const text = explainMock(
      makeFacts({
        available: false,
        reason: "Booking cannot exceed 120 minutes.",
        durationMinutes: 150,
      })
    );
    expect(text).toContain("150");
  });

  it("E06: out-of-range reason produces a range explanation", () => {
    const text = explainMock(
      makeFacts({
        available: false,
        reason: "Times must stay within the 00:00–24:00 range (0–1440 minutes).",
      })
    );
    expect(text).toContain("00:00");
  });

  it("E07: inverted-order reason produces an order explanation", () => {
    const text = explainMock(
      makeFacts({
        available: false,
        reason: "Start time must be before end time.",
      })
    );
    expect(text).toContain("start time must be earlier");
  });

  it("E08: unknown reason falls back to a generic explanation with the reason text", () => {
    const text = explainMock(
      makeFacts({ available: false, reason: "Something unexpected." })
    );
    expect(text).toContain("Something unexpected.");
  });

  it("E09: explanation is always a short non-empty string", () => {
    const texts = [
      explainMock(makeFacts()),
      explainMock(makeFacts({ available: false, reason: "Room is blocked." })),
      explainMock(makeFacts({ available: false, reason: "Something unexpected." })),
    ];
    for (const t of texts) {
      expect(typeof t).toBe("string");
      expect(t.length).toBeGreaterThan(0);
      expect(t.length).toBeLessThanOrEqual(400);
    }
  });
});
