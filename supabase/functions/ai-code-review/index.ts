const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { code, language, problem } = await req.json();
    if (!code || typeof code !== "string" || code.length > 20000) {
      return new Response(JSON.stringify({ error: "Invalid code" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const lang = String(language ?? "javascript").slice(0, 40);
    const ctx = problem ? `Problem context: ${String(problem).slice(0, 800)}\n\n` : "";

    const system = `You are a senior code reviewer for placement prep. Review the user's code and return STRICT markdown with these exact sections:

## ⏱ Complexity
- **Time:** Big-O with 1-line justification
- **Space:** Big-O with 1-line justification

## ✅ Correctness & Edge Cases
Bullet list of correctness observations and missing edge cases.

## 🔧 Refactor Suggestions
Numbered list of concrete refactors (naming, structure, idioms).

## ⚡ Optimizations
Alternative approaches with their complexity trade-offs. Include a short refactored code block in the same language when helpful.

## 🎯 Interview Tips
2-4 crisp bullets on how to explain this solution in an interview.

Keep it concise, honest, and practical. No filler.`;

    const user = `${ctx}Language: ${lang}\n\n\`\`\`${lang}\n${code}\n\`\`\``;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": LOVABLE_API_KEY },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: system }, { role: "user", content: user }],
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI failed", status: aiRes.status, details: t }), {
        status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const j = await aiRes.json();
    const review = j?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ review }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
