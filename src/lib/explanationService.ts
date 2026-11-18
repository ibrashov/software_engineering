import {
  type RoomState,
  type AvailabilityResult,
  checkAvailability,
  labelToMinutes,
  minutesToLabel,
} from "./booking";
import { explainMock } from "./mockExplain";

export type ReasonCode =
  | "AVAILABLE"
  | "OVERLAP"
  | "ROOM_BLOCKED"
  | "PAST_TIME"
  | "EXCEEDS_DURATION"
  | "INVALID_ORDER"
  | "OUT_OF_RANGE"
  | "NON_FINITE"
  | "UNKNOWN";

export interface ExplanationInputContract {
  roomLabel: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  reasonCode: ReasonCode;
  reasonMessage?: string | null;
}

export interface ExplanationOutputContract {
  explanation: string;
  source: "mock-ai" | "deterministic-fallback";
}

export interface ExplanationServiceOptions {
  timeoutMs?: number;
  simulateTimeout?: boolean;
  simulateFailure?: boolean;
  simulateMalformedResponse?: boolean;
  simulateContradiction?: boolean;
  simulateMissingKey?: boolean;
}

export const MAX_ROOM_LABEL_LENGTH = 100;
export const MAX_REASON_MESSAGE_LENGTH = 300;
export const MAX_EXPLANATION_LENGTH = 500;
export const DEFAULT_TIMEOUT_MS = 2000;

export function deriveReasonCode(
  available: boolean,
  reason: string | null
): ReasonCode {
  if (available) return "AVAILABLE";
  if (!reason) return "UNKNOWN";
  if (reason.includes("valid finite numbers")) return "NON_FINITE";
  if (reason.includes("00:00–24:00") || reason.includes("0-1440"))
    return "OUT_OF_RANGE";
  if (reason.includes("must be before end time")) return "INVALID_ORDER";
  if (reason.includes("must be in the future")) return "PAST_TIME";
  if (reason.includes("cannot exceed")) return "EXCEEDS_DURATION";
  if (reason.includes("Room is blocked")) return "ROOM_BLOCKED";
  if (reason.includes("overlaps an existing booking")) return "OVERLAP";
  return "UNKNOWN";
}

/**
 * Validates the raw input contract.
 * Rejects empty, overly long, or malformed inputs (AC3).
 */
export function validateExplanationInput(input: unknown): {
  valid: boolean;
  error?: string;
  sanitized?: ExplanationInputContract;
} {
  if (!input || typeof input !== "object") {
    return { valid: false, error: "Validation error: input payload is empty or not an object." };
  }

  const raw = input as Record<string, unknown>;

  if (
    typeof raw.roomLabel !== "string" ||
    raw.roomLabel.trim().length === 0
  ) {
    return { valid: false, error: "Validation error: roomLabel is required and cannot be empty." };
  }

  // Strip carriage returns and control characters for defense-in-depth (FINDING-SEC-01)
  const sanitizedRoomLabel = raw.roomLabel.trim().replace(/[\r\n\t]+/g, " ");

  if (sanitizedRoomLabel.length > MAX_ROOM_LABEL_LENGTH) {
    return {
      valid: false,
      error: `Validation error: roomLabel exceeds maximum length of ${MAX_ROOM_LABEL_LENGTH} characters.`,
    };
  }

  // Allow standard times 00:00–23:59 and end of day 24:00 (FINDING-CORR-01)
  const timeRegex = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;
  if (
    typeof raw.startTime !== "string" ||
    !timeRegex.test(raw.startTime) ||
    typeof raw.endTime !== "string" ||
    !timeRegex.test(raw.endTime)
  ) {
    return {
      valid: false,
      error: "Validation error: startTime and endTime must be valid HH:MM strings.",
    };
  }

  if (typeof raw.isAvailable !== "boolean") {
    return {
      valid: false,
      error: "Validation error: isAvailable must be a boolean.",
    };
  }

  const validReasonCodes: ReasonCode[] = [
    "AVAILABLE",
    "OVERLAP",
    "ROOM_BLOCKED",
    "PAST_TIME",
    "EXCEEDS_DURATION",
    "INVALID_ORDER",
    "OUT_OF_RANGE",
    "NON_FINITE",
    "UNKNOWN",
  ];

  if (
    typeof raw.reasonCode !== "string" ||
    !validReasonCodes.includes(raw.reasonCode as ReasonCode)
  ) {
    return {
      valid: false,
      error: "Validation error: reasonCode is invalid or unrecognized.",
    };
  }

  let reasonMessage: string | null = null;
  if (raw.reasonMessage !== undefined && raw.reasonMessage !== null) {
    if (typeof raw.reasonMessage !== "string") {
      return {
        valid: false,
        error: "Validation error: reasonMessage must be a string or null.",
      };
    }
    if (raw.reasonMessage.length > MAX_REASON_MESSAGE_LENGTH) {
      return {
        valid: false,
        error: `Validation error: reasonMessage exceeds maximum length of ${MAX_REASON_MESSAGE_LENGTH} characters.`,
      };
    }
    reasonMessage = raw.reasonMessage;
  }

  return {
    valid: true,
    sanitized: {
      roomLabel: sanitizedRoomLabel,
      startTime: raw.startTime,
      endTime: raw.endTime,
      isAvailable: raw.isAvailable,
      reasonCode: raw.reasonCode as ReasonCode,
      reasonMessage,
    },
  };
}

/**
 * Validates candidate model explanation (AC2, AC3).
 * Rejects empty, overly long, or contradictory statements.
 */
export function validateExplanationOutput(
  candidate: unknown,
  expectedAvailable: boolean
): { valid: boolean; explanation?: string; error?: string } {
  if (typeof candidate !== "string") {
    return { valid: false, error: "Output validation failed: response is not a string." };
  }

  const trimmed = candidate.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: "Output validation failed: explanation is empty." };
  }

  if (trimmed.length > MAX_EXPLANATION_LENGTH) {
    return {
      valid: false,
      error: `Output validation failed: explanation exceeds ${MAX_EXPLANATION_LENGTH} characters.`,
    };
  }

  const lower = trimmed.toLowerCase();
  if (!expectedAvailable) {
    // If the room is unavailable, explanation must not state it is free/available
    const affirmativeFree =
      (lower.includes("is free") || lower.includes("is available") || lower.includes("can be booked")) &&
      !lower.includes("not available") &&
      !lower.includes("not free") &&
      !lower.includes("cannot be booked") &&
      !lower.includes("overlaps") &&
      !lower.includes("blocked") &&
      !lower.includes("exceeds") &&
      !lower.includes("passed");

    if (affirmativeFree) {
      return {
        valid: false,
        error: "Output validation failed: model response contradicts deterministic unavailability.",
      };
    }
  } else {
    // If available, explanation must not claim it is unavailable/blocked
    // Accurately allows phrases like "does not overlap" or "no overlap" (FINDING-CORR-03)
    const falselyUnavailable =
      lower.includes("is unavailable") ||
      lower.includes("cannot be booked") ||
      lower.includes("is blocked") ||
      (lower.includes("overlaps") &&
        !lower.includes("no overlap") &&
        !lower.includes("does not overlap"));

    if (falselyUnavailable) {
      return {
        valid: false,
        error: "Output validation failed: model response contradicts deterministic availability.",
      };
    }
  }

  return { valid: true, explanation: trimmed };
}

/**
 * Builds the safe deterministic fallback explanation (AC4).
 */
export function buildDeterministicFallback(
  input: ExplanationInputContract
): string {
  const startMin = labelToMinutes(input.startTime);
  const endMin = labelToMinutes(input.endTime);
  const duration = Math.max(0, endMin - startMin);

  return explainMock({
    available: input.isAvailable,
    reason: input.reasonMessage ?? (input.isAvailable ? null : "Requested slot is unavailable."),
    roomName: input.roomLabel,
    startLabel: input.startTime,
    endLabel: input.endTime,
    durationMinutes: duration,
  });
}

/**
 * Creates structured explanation input from authoritative room state and times.
 * This guarantees that client-provided availability flags are not blindly trusted.
 */
export function buildAuthoritativeFacts(
  room: RoomState,
  currentTime: number,
  startMin: number,
  endMin: number
): {
  result: AvailabilityResult;
  contract: ExplanationInputContract;
} {
  const result = checkAvailability(room, currentTime, startMin, endMin);
  const isAvailable = result.available;
  const reasonMessage = result.available ? null : result.reason;
  const reasonCode = deriveReasonCode(isAvailable, reasonMessage);

  const contract: ExplanationInputContract = {
    roomLabel: room.name,
    startTime: minutesToLabel(startMin),
    endTime: minutesToLabel(endMin),
    isAvailable,
    reasonCode,
    reasonMessage,
  };

  return { result, contract };
}

/**
 * Main explanation service function.
 * Coordinates input validation, server adapter / mock call with timeout,
 * output validation, and fallback handling (AC1-AC5).
 */
export async function getAvailabilityExplanation(
  rawInput: unknown,
  options: ExplanationServiceOptions = {}
): Promise<ExplanationOutputContract> {
  // Step 1: Validate input contract (AC3)
  const inputCheck = validateExplanationInput(rawInput);
  if (!inputCheck.valid || !inputCheck.sanitized) {
    throw new Error(inputCheck.error ?? "Invalid input");
  }

  const input = inputCheck.sanitized;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  // Step 2: Handle simulated failure flags (for testing AC4)
  if (options.simulateMissingKey) {
    return {
      explanation: buildDeterministicFallback(input),
      source: "deterministic-fallback",
    };
  }

  if (options.simulateFailure) {
    return {
      explanation: buildDeterministicFallback(input),
      source: "deterministic-fallback",
    };
  }

  if (options.simulateTimeout) {
    return {
      explanation: buildDeterministicFallback(input),
      source: "deterministic-fallback",
    };
  }

  // Step 3: Server adapter execution with timeout
  try {
    const candidateText = await executeAdapterWithTimeout(input, timeoutMs, options);

    // Step 4: Validate output contract (AC2, AC3)
    const outputCheck = validateExplanationOutput(candidateText, input.isAvailable);
    if (!outputCheck.valid || !outputCheck.explanation) {
      return {
        explanation: buildDeterministicFallback(input),
        source: "deterministic-fallback",
      };
    }

    return {
      explanation: outputCheck.explanation,
      source: "mock-ai",
    };
  } catch {
    // Step 5: On any error, network fault, or timeout, produce safe deterministic fallback (AC4)
    return {
      explanation: buildDeterministicFallback(input),
      source: "deterministic-fallback",
    };
  }
}

async function executeAdapterWithTimeout(
  input: ExplanationInputContract,
  timeoutMs: number,
  options: ExplanationServiceOptions
): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await new Promise<string>((resolve, reject) => {
      controller.signal.addEventListener("abort", () => {
        reject(new Error("Request timed out"));
      });

      // Simulate network / adapter response
      setTimeout(() => {
        if (controller.signal.aborted) return;

        if (options.simulateMalformedResponse) {
          // Returns empty or corrupted string
          resolve("");
          return;
        }

        if (options.simulateContradiction) {
          // If unavailable, returns contradictory available text
          if (!input.isAvailable) {
            resolve(`${input.roomLabel} is free and ready to book from ${input.startTime} to ${input.endTime}.`);
          } else {
            resolve(`${input.roomLabel} is unavailable and cannot be booked.`);
          }
          return;
        }

        // Standard generation via pure mock rule
        const startMin = labelToMinutes(input.startTime);
        const endMin = labelToMinutes(input.endTime);
        const duration = Math.max(0, endMin - startMin);

        const explanation = explainMock({
          available: input.isAvailable,
          reason: input.reasonMessage ?? null,
          roomName: input.roomLabel,
          startLabel: input.startTime,
          endLabel: input.endTime,
          durationMinutes: duration,
        });

        resolve(explanation);
      }, 50);
    });
  } finally {
    clearTimeout(timer);
  }
}
