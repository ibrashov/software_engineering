export interface MockAvailabilityFacts {
  available: boolean;
  reason: string | null;
  roomName: string;
  startLabel: string;
  endLabel: string;
  durationMinutes: number;
}

export type MockExplanation =
  | { ok: true; explanation: string }
  | { ok: false; error: string };

function isExplanationBody(value: unknown): value is { explanation: string; source: string } {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return typeof v.explanation === "string" && v.explanation.length > 0 && typeof v.source === "string";
}

export async function fetchMockExplanation(
  facts: MockAvailabilityFacts
): Promise<MockExplanation> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (typeof supabaseUrl !== "string" || typeof supabaseAnonKey !== "string") {
    return { ok: false, error: "Explanation service is not configured." };
  }

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/explain-availability`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
          apikey: supabaseAnonKey,
        },
        body: JSON.stringify(facts),
      }
    );

    if (!response.ok) {
      return { ok: false, error: `Explanation service returned status ${response.status}.` };
    }

    const body: unknown = await response.json();
    if (!isExplanationBody(body)) {
      return { ok: false, error: "Explanation service returned an unexpected response." };
    }

    if (body.source !== "mock-ai") {
      return { ok: false, error: "Explanation service returned an unexpected source." };
    }

    return { ok: true, explanation: body.explanation };
  } catch {
    return { ok: false, error: "Could not reach the explanation service." };
  }
}
