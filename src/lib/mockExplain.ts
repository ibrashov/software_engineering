export interface MockAvailabilityFacts {
  available: boolean;
  reason: string | null;
  roomName: string;
  startLabel: string;
  endLabel: string;
  durationMinutes: number;
}

function bookingWindow(reason: string): string | null {
  const m = reason.match(/overlaps an existing booking \((\d{2}:\d{2})[–-](\d{2}:\d{2})\)/);
  return m ? `${m[1]}–${m[2]}` : null;
}

export function explainMock(facts: MockAvailabilityFacts): string {
  const { available, reason, roomName, startLabel, endLabel, durationMinutes } = facts;
  const MAX_BOOKING_MINUTES = 120;

  if (available) {
    return `${roomName} is free from ${startLabel} to ${endLabel}. The ${durationMinutes}-minute slot fits inside the ${MAX_BOOKING_MINUTES}-minute cap and does not overlap any existing booking.`;
  }

  if (reason === "Room is blocked.") {
    return `${roomName} is currently blocked, so no bookings can be made for ${startLabel}–${endLabel} or any other time today.`;
  }

  if (reason !== null && reason.startsWith("Booking must be in the future")) {
    return `${roomName} cannot be booked for ${startLabel}–${endLabel} because that time has already passed. Pick a start time later than the current time.`;
  }

  if (reason !== null && reason.startsWith("Times must stay within")) {
    return `${roomName} bookings must fall within the same day, 00:00 to 24:00. The requested ${startLabel}–${endLabel} slot falls outside that window.`;
  }

  if (reason !== null && reason.startsWith("Start time must be before end time.")) {
    return `For ${roomName}, the start time must be earlier than the end time. The requested ${startLabel}–${endLabel} range is inverted, so it cannot be booked.`;
  }

  if (reason !== null && reason.startsWith("Booking cannot exceed")) {
    return `${roomName} allows bookings of at most ${MAX_BOOKING_MINUTES} minutes. The requested ${startLabel}–${endLabel} slot is ${durationMinutes} minutes, which exceeds the cap.`;
  }

  if (reason !== null && reason.startsWith("Requested time overlaps")) {
    const window = bookingWindow(reason);
    if (window) {
      const [from, to] = window.split("–");
      return `${roomName} is already booked from ${from} to ${to}, and the requested ${startLabel}–${endLabel} slot overlaps it. Try a time after ${to} or before ${from} — touching endpoints are allowed.`;
    }
  }

  return `The checker could not confirm availability for ${startLabel}–${endLabel}. ${reason ?? "Unknown reason."}`;
}
