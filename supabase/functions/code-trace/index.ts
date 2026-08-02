const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SYSTEM = `You are a precise program execution tracer, like Python Tutor.

Given source code, mentally EXECUTE it and return a step-by-step trace of the run.
One step = one meaningful executed line (declaration, condition check, call, return, loop iteration, print).

Rules:
- First validate that the source is syntactically valid for the stated language. If it is invalid, do not invent a trace. Return ONLY this JSON shape:
  {"valid":false,"error":{"line":4,"column":8,"message":"Clear syntax error message","code":"the offending source line"}}
- Error line and column are 1-based and must point to the source exactly as provided.
- Simulate faithfully. Values must be the real values at that moment.
- Include a step when a function is called (before its body runs) and when it returns.
- Cap at 120 steps. If the program is longer, trace the first 120 steps and set "truncated": true.
- Every frame in "frames" is a call frame currently on the call stack, ordered from bottom (main/global) to top (most recent call). The global scope frame is always first and titled "Main Block".
- Values are short strings ("4", "[1, 2, 3]", "'hi'", "{a: 1}").
- Explanation must teach a beginner what this exact line does with the current values, 1-3 short sentences.

Return ONLY JSON matching this shape (no markdown fence):
{
  "valid": true,
  "language": "python",
  "truncated": false,
  "steps": [
    {
      "line": 12,
      "code": "print(factorial(num))",
      "event": "call" | "line" | "return" | "output",
      "frames": [
        {"name": "Main Block", "isGlobal": true, "vars": [{"name":"num","value":"4"}], "returned": null},
        {"name": "factorial(4)", "isGlobal": false, "vars": [{"name":"x","value":"4"}], "returned": null}
      ],
      "callArgs": ["4"],
      "returnValue": null,
      "stdout": "",
      "explanation": "The function factorial() is called with argument 4."
    }
  ]
}
"line" is 1-based against the code exactly as given. "stdout" is the cumulative program output so far.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { code, language } = await req.json();
    if (!code || typeof code !== "string" || code.length > 12000) {
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lang = String(language ?? "python").slice(0, 40);

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": LOVABLE_API_KEY },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: `Language: ${lang}\n\nCode:\n\`\`\`${lang}\n${code}\n\`\`\`` },
        ],
      }),
    });

    if (!aiRes.ok) {
      const details = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI failed", details }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const j = await aiRes.json();
    let raw = j?.choices?.[0]?.message?.content ?? "{}";
    raw = String(raw).replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return new Response(JSON.stringify({ error: "Could not parse trace" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = parsed as { valid?: boolean; steps?: unknown[]; error?: unknown };
    if (result.valid === false && result.error) {
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(result.steps) || result.steps.length === 0) {
      return new Response(JSON.stringify({ error: "No execution steps were generated" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ...result, valid: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
