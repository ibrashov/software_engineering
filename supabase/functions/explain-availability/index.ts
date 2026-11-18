import { explainMock } from "../_shared/explainMock.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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

function isExplainRequest(value: unknown): value is ExplainRequest {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.available === "boolean" &&
    (v.reason === null || typeof v.reason === "string") &&
    typeof v.roomName === "string" &&
    typeof v.startLabel === "string" &&
    typeof v.endLabel === "string" &&
    typeof v.durationMinutes === "number" &&
    Number.isFinite(v.durationMinutes)
  );
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

    if (!isExplainRequest(body)) {
      return new Response(
        JSON.stringify({ error: "Invalid request body: expected available, reason, roomName, startLabel, endLabel, durationMinutes." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const explanation = explainMock(body);
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
