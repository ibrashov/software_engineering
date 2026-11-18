import {
  deriveReasonCode,
  buildDeterministicFallback,
  validateExplanationInput,
  validateExplanationOutput,
  DEFAULT_TIMEOUT_MS,
  type ExplanationInputContract,
} from "./explanationService";
import { labelToMinutes } from "./booking";

export interface MockAvailabilityFacts {
  available: boolean;
  reason: string | null;
  roomName: string;
  startLabel: string;
  endLabel: string;
  durationMinutes: number;
}

export type MockExplanation =
  | { ok: true; explanation: string; source: "mock-ai" | "deterministic-fallback" }
  | { ok: false; error: string };

function isExplanationBody(
  value: unknown
): value is { explanation: string; source: string } {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.explanation === "string" &&
    v.explanation.length > 0 &&
    v.source === "mock-ai"
  );
}

export async function fetchMockExplanation(
  facts: MockAvailabilityFacts
): Promise<MockExplanation> {
  const contract: ExplanationInputContract = {
    roomLabel: facts.roomName,
    startTime: facts.startLabel,
    endTime: facts.endLabel,
    isAvailable: facts.available,
    reasonCode: deriveReasonCode(facts.available, facts.reason),
    reasonMessage: facts.reason,
  };

  const inputCheck = validateExplanationInput(contract);
  if (!inputCheck.valid || !inputCheck.sanitized) {
    return {
      ok: false,
      error: inputCheck.error ?? "Invalid input parameters.",
    };
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Safe fallback if edge function is unconfigured (AC4, T13)
  if (typeof supabaseUrl !== "string" || typeof supabaseAnonKey !== "string") {
    const fallbackText = buildDeterministicFallback(inputCheck.sanitized);
    return {
      ok: true,
      explanation: fallbackText,
      source: "deterministic-fallback",
    };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const startMin = labelToMinutes(inputCheck.sanitized.startTime);
    const endMin = labelToMinutes(inputCheck.sanitized.endTime);
    const durationMinutes = Math.max(0, endMin - startMin);

    // Ensure wire payload matches ExplainRequest on Supabase Edge Function (FINDING-CRIT-01)
    const wirePayload = {
      available: inputCheck.sanitized.isAvailable,
      reason: inputCheck.sanitized.reasonMessage,
      roomName: inputCheck.sanitized.roomLabel,
      startLabel: inputCheck.sanitized.startTime,
      endLabel: inputCheck.sanitized.endTime,
      durationMinutes,
      roomLabel: inputCheck.sanitized.roomLabel,
      startTime: inputCheck.sanitized.startTime,
      endTime: inputCheck.sanitized.endTime,
      isAvailable: inputCheck.sanitized.isAvailable,
      reasonCode: inputCheck.sanitized.reasonCode,
    };

    const response = await fetch(
      `${supabaseUrl}/functions/v1/explain-availability`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify(wirePayload),
        signal: controller.signal,
      }
    );

    if (!response.ok) {
      // Safe fallback on HTTP error (AC4, T11)
      const fallbackText = buildDeterministicFallback(inputCheck.sanitized);
      return {
        ok: true,
        explanation: fallbackText,
        source: "deterministic-fallback",
      };
    }

    // Timeout guard remains active through body parsing (FINDING-PERF-01)
    const body: unknown = await response.json();
    if (!isExplanationBody(body)) {
      // Safe fallback on malformed response (AC4, T12)
      const fallbackText = buildDeterministicFallback(inputCheck.sanitized);
      return {
        ok: true,
        explanation: fallbackText,
        source: "deterministic-fallback",
      };
    }

    const outputCheck = validateExplanationOutput(
      body.explanation,
      contract.isAvailable
    );

    if (!outputCheck.valid || outputCheck.explanation !== buildDeterministicFallback(inputCheck.sanitized)) {
      // Safe fallback on invalid/contradictory response (AC2, T14)
      const fallbackText = buildDeterministicFallback(inputCheck.sanitized);
      return {
        ok: true,
        explanation: fallbackText,
        source: "deterministic-fallback",
      };
    }

    return {
      ok: true,
      explanation: outputCheck.explanation,
      source: "mock-ai",
    };
  } catch {
    // Safe fallback on network failure or timeout (AC4, T10, T11)
    const fallbackText = buildDeterministicFallback(inputCheck.sanitized);
    return {
      ok: true,
      explanation: fallbackText,
      source: "deterministic-fallback",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
