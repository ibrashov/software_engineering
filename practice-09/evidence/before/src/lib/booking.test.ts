import { describe, it, expect } from "vitest";
import {
  checkAvailability,
  type Booking,
  type RoomState,
} from "@/lib/booking";

const NOW = 540;

function cloneBookings(bookings: Booking[]): Booking[] {
  return bookings.map((b) => ({ ...b }));
}

function makeRoom(overrides: Partial<RoomState> = {}): RoomState {
  const defaultBookings: Booking[] = [{ start: 600, end: 660 }];
  const sourceBookings = overrides.bookings ?? defaultBookings;
  return {
    name: "Library Study Room B-12",
    blocked: false,
    ...overrides,
    bookings: cloneBookings(sourceBookings),
  };
}

function snapshotBookings(bookings: Booking[]): Booking[] {
  return bookings.map((b) => ({ ...b }));
}

describe("checkAvailability", () => {
  it("T01: 660-720 => available", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 660, 720);
    expect(result.available).toBe(true);
    expect(room.bookings).toEqual(before);
  });

  it("T02: 540-570 => not available (start not later than current time)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 540, 570);
    expect(result.available).toBe(false);
    expect(result).not.toHaveProperty("reason", undefined);
    if (!result.available) {
      expect(result.reason).toBe(
        "Booking must be in the future — current time is 09:00."
      );
    }
    expect(room.bookings).toEqual(before);
  });

  it("T03: 720-720 => not available (start equals end)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 720, 720);
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reason).toBe("Start time must be before end time.");
    }
    expect(room.bookings).toEqual(before);
  });

  it("T04: 750-720 => not available (start after end)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 750, 720);
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reason).toBe("Start time must be before end time.");
    }
    expect(room.bookings).toEqual(before);
  });

  it("T05: 1380-1441 => not available (end out of day range)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 1380, 1441);
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reason).toBe(
        "Times must stay within the 00:00–24:00 range (0–1440 minutes)."
      );
    }
    expect(room.bookings).toEqual(before);
  });

  it("T06: 720-840 => available (exactly 120 min)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 720, 840);
    expect(result.available).toBe(true);
    expect(room.bookings).toEqual(before);
  });

  it("T07: 720-841 => not available (exceeds 120 min)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 720, 841);
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reason).toBe("Booking cannot exceed 120 minutes.");
    }
    expect(room.bookings).toEqual(before);
  });

  it("T08: 570-600 => available (touching start endpoint)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 570, 600);
    expect(result.available).toBe(true);
    expect(room.bookings).toEqual(before);
  });

  it("T09: 630-690 => not available (overlaps middle of booking)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 630, 690);
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reason).toBe(
        "Requested time overlaps an existing booking (10:00–11:00). Touching endpoints are allowed."
      );
    }
    expect(room.bookings).toEqual(before);
  });

  it("T10: 570-690 => not available (overlaps existing booking)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 570, 690);
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reason).toBe(
        "Requested time overlaps an existing booking (10:00–11:00). Touching endpoints are allowed."
      );
    }
    expect(room.bookings).toEqual(before);
  });

  it("T11: 615-645 => not available (inside existing booking)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 615, 645);
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reason).toBe(
        "Requested time overlaps an existing booking (10:00–11:00). Touching endpoints are allowed."
      );
    }
    expect(room.bookings).toEqual(before);
  });

  it("T12: 600-660 => not available (exact match of booking)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 600, 660);
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reason).toBe(
        "Requested time overlaps an existing booking (10:00–11:00). Touching endpoints are allowed."
      );
    }
    expect(room.bookings).toEqual(before);
  });

  it("T13: 660-720 with blocked room => not available", () => {
    const room = makeRoom({ blocked: true });
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 660, 720);
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reason).toBe("Room is blocked.");
    }
    expect(room.bookings).toEqual(before);
  });

  it("T14: 630-690 with no bookings => available", () => {
    const room = makeRoom({ bookings: [] });
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 630, 690);
    expect(result.available).toBe(true);
    expect(room.bookings).toEqual(before);
  });

  it("T15: 720-780 with two non-overlapping bookings => available, bookings unchanged", () => {
    const room = makeRoom({
      bookings: [
        { start: 900, end: 960 },
        { start: 600, end: 660 },
      ],
    });
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 720, 780);
    expect(result.available).toBe(true);
    expect(room.bookings).toEqual(before);
    expect(room.bookings.length).toBe(2);
    expect(room.bookings[0]).toEqual({ start: 900, end: 960 });
    expect(room.bookings[1]).toEqual({ start: 600, end: 660 });
  });

  it("T16: 1439-1440 => available (last minute of the day)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 1439, 1440);
    expect(result.available).toBe(true);
    expect(room.bookings).toEqual(before);
  });

  it("T17: 720-780 overlaps second booking => not available", () => {
    const room = makeRoom({
      bookings: [
        { start: 600, end: 660 },
        { start: 750, end: 810 },
      ],
    });
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 720, 780);
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reason).toBe(
        "Requested time overlaps an existing booking (12:30–13:30). Touching endpoints are allowed."
      );
    }
    expect(room.bookings).toEqual(before);
  });

  it("T18: -30 to 30 => not available (negative start, out of day range)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, -30, 30);
    expect(result.available).toBe(false);
    if (!result.available) {
      expect(result.reason).toBe(
        "Times must stay within the 00:00–24:00 range (0–1440 minutes)."
      );
    }
    expect(room.bookings).toEqual(before);
  });

  it("T19: 541-600 => available (start one minute after current time)", () => {
    const room = makeRoom();
    const before = snapshotBookings(room.bookings);
    const result = checkAvailability(room, NOW, 541, 600);
    expect(result.available).toBe(true);
    expect(room.bookings).toEqual(before);
  });
});
