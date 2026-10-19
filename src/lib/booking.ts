export type Booking = {
  start: number;
  end: number;
};

export type RoomState = {
  name: string;
  blocked: boolean;
  bookings: Booking[];
};

export type AvailabilityResult =
  | { available: true }
  | { available: false; reason: string };

export function minutesToLabel(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function labelToMinutes(label: string): number {
  const [h, m] = label.split(":").map(Number);
  return h * 60 + m;
}

export function checkAvailability(
  room: RoomState,
  currentTime: number,
  start: number,
  end: number
): AvailabilityResult {
  if (start < 0 || end > 1440) {
    return {
      available: false,
      reason: "Times must stay within the 00:00–24:00 range (0–1440 minutes).",
    };
  }

  if (start >= end) {
    return {
      available: false,
      reason: "Start time must be before end time.",
    };
  }

  if (start <= currentTime) {
    return {
      available: false,
      reason: `Booking must be in the future — current time is ${minutesToLabel(currentTime)}.`,
    };
  }

  if (end - start > 120) {
    return {
      available: false,
      reason: "Booking cannot exceed 120 minutes.",
    };
  }

  if (room.blocked) {
    return {
      available: false,
      reason: "Room is blocked.",
    };
  }

  for (const b of room.bookings) {
    if (start < b.end && b.start < end) {
      return {
        available: false,
        reason: `Requested time overlaps an existing booking (${minutesToLabel(b.start)}–${minutesToLabel(b.end)}). Touching endpoints are allowed.`,
      };
    }
  }

  return { available: true };
}
