import { explainMock } from "../_shared/explainMock.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface ExplainRequest {
  available: boolean;
  reason: string | null;
  roomName: string;
  startLabel: string;
  endLabel: string;
  durationMinutes: number;
}

const timeLabel = /^(?:[01]\d|2[0-3]):[0-5]\d$|^24:00$/;

function minutes(label: string): number {
  const [hours, minutes] = label.split(":").map(Number);
  return hours * 60 + minutes;
}

function normalizeRequest(body: unknown): ExplainRequest | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) return null;

  const raw = body as Record<string, unknown>;
  const available = raw.available ?? raw.isAvailable;
  const room = raw.roomName ?? raw.roomLabel;
  const startLabel = raw.startLabel ?? raw.startTime;
  const endLabel = raw.endLabel ?? raw.endTime;
  const reason = ("reason" in raw ? raw.reason : raw.reasonMessage) ?? null;
  if (
    typeof available !== "boolean" ||
    typeof room !== "string" || room.length > 100 ||
    typeof startLabel !== "string" || !timeLabel.test(startLabel) ||
    typeof endLabel !== "string" || !timeLabel.test(endLabel) ||
    (reason !== null && (typeof reason !== "string" || reason.length > 300))
  ) return null;

  const roomName = room.trim().replace(/[\r\n\t]+/g, " ");
  const durationMinutes = Math.max(0, minutes(endLabel) - minutes(startLabel));
  if (
    !roomName ||
    ("durationMinutes" in raw && raw.durationMinutes !== durationMinutes) ||
    (available && (reason !== null || durationMinutes === 0 || durationMinutes > 120))
  ) return null;

  return { available, reason, roomName, startLabel, endLabel, durationMinutes };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Request body must be valid JSON." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const reqFacts = normalizeRequest(body);
    if (!reqFacts) {
      return new Response(
        JSON.stringify({ error: "Invalid request body: expected availability facts." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const explanation = explainMock(reqFacts);
    return new Response(
      JSON.stringify({ explanation, source: "mock-ai" as const }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("explain-availability error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
