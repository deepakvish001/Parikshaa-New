import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type PlanDay = {
  day_index: number;
  day_date: string;
  focus: string;
  tasks: Array<{
    kind: "dsa" | "sql" | "quiz" | "srs" | "interview" | "reading" | "mock";
    topic?: string;
    title: string;
    description?: string;
    estimated_minutes: number;
    difficulty?: "easy" | "medium" | "hard";
    resource_url?: string;
  }>;
};

type PlanShape = {
  summary: string;
  readiness: { score: number; strengths: string[]; gaps: string[] };
  days: PlanDay[];
};

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfWeek(d = new Date()) {
  const day = d.getDay(); // 0 Sun .. 6 Sat
  const diff = (day + 6) % 7; // Monday=0
  const s = new Date(d);
  s.setDate(d.getDate() - diff);
  s.setHours(0, 0, 0, 0);
  return s;
}

function computeReadiness(ctx: {
  topicsCompleted: number;
  topicsTotal: number;
  srsDue: number;
  srsMastered: number;
  platformSolved: number;
  quizAvg: number | null;
}) {
  const topicRatio = ctx.topicsTotal > 0 ? ctx.topicsCompleted / ctx.topicsTotal : 0;
  const srsHealth = ctx.srsMastered / Math.max(1, ctx.srsMastered + ctx.srsDue);
  const platform = Math.min(1, ctx.platformSolved / 300);
  const quiz = ctx.quizAvg != null ? Math.max(0, Math.min(1, ctx.quizAvg / 100)) : 0.4;
  const score = Math.round((topicRatio * 40 + srsHealth * 20 + platform * 25 + quiz * 15));
  return Math.max(0, Math.min(100, score));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    // Gather context in parallel
    const [
      profileRes,
      topicRes,
      srsRes,
      platformRes,
      quizRes,
      extendedRes,
    ] = await Promise.all([
      admin.from("user_study_profile").select("*").eq("user_id", userId).maybeSingle(),
      admin.from("user_topic_progress").select("sheet_id,topic_id,completed,is_revision").eq("user_id", userId).limit(1000),
      admin.from("quiz_spaced_repetition").select("question_category,next_review_at,correct_streak").eq("user_id", userId).limit(500),
      admin.from("user_platform_stats").select("platform,solved_total,solved_easy,solved_medium,solved_hard,rating").eq("user_id", userId),
      admin.from("quiz_results").select("score,total_questions,created_at").eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
      admin.from("user_profiles_extended").select("full_name,skills,goals,interests").eq("user_id", userId).maybeSingle(),
    ]);

    const profile = profileRes.data as any;
    const topics = (topicRes.data ?? []) as any[];
    const srs = (srsRes.data ?? []) as any[];
    const platformStats = (platformRes.data ?? []) as any[];
    const quizzes = (quizRes.data ?? []) as any[];
    const extended = extendedRes.data as any;

    const topicsCompleted = topics.filter((t) => t.completed).length;
    const topicsTotal = topics.length;
    const now = new Date();
    const srsDue = srs.filter((s) => !s.next_review_at || new Date(s.next_review_at) <= now).length;
    const srsMastered = srs.filter((s) => (s.correct_streak ?? 0) >= 3).length;
    const platformSolved = platformStats.reduce((sum, p) => sum + (p.solved_total ?? 0), 0);
    const quizAvg = quizzes.length
      ? Math.round(quizzes.reduce((s, q) => s + (q.total_questions ? (q.score / q.total_questions) * 100 : 0), 0) / quizzes.length)
      : null;

    // Detect weak vs strong topics from topic progress
    const bySheet: Record<string, { total: number; done: number }> = {};
    topics.forEach((t) => {
      const k = t.sheet_id ?? "misc";
      bySheet[k] ??= { total: 0, done: 0 };
      bySheet[k].total++;
      if (t.completed) bySheet[k].done++;
    });
    const weakSheets = Object.entries(bySheet)
      .map(([k, v]) => ({ k, ratio: v.done / Math.max(1, v.total), done: v.done, total: v.total }))
      .filter((x) => x.total >= 3)
      .sort((a, b) => a.ratio - b.ratio)
      .slice(0, 8)
      .map((x) => x.k);

    // SRS categories most due
    const srsByCat: Record<string, number> = {};
    srs.forEach((s) => {
      if (!s.next_review_at || new Date(s.next_review_at) <= now) {
        srsByCat[s.question_category ?? "general"] = (srsByCat[s.question_category ?? "general"] ?? 0) + 1;
      }
    });
    const topDueCats = Object.entries(srsByCat).sort((a, b) => b[1] - a[1]).slice(0, 5);

    const readinessScore = computeReadiness({
      topicsCompleted, topicsTotal, srsDue, srsMastered, platformSolved, quizAvg,
    });

    const weekStart = startOfWeek();
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      return { i, iso: isoDate(d), weekday: d.toLocaleDateString("en-US", { weekday: "long" }) };
    });

    const weekdayMin = profile?.weekday_minutes ?? 60;
    const weekendMin = profile?.weekend_minutes ?? 120;

    const systemPrompt = `You are an elite placement-prep coach. Build a highly personalized 7-day study plan for a coding/placement student.

Rules:
- Total minutes per day MUST respect the user's available time budget.
- Mix DSA problems (topic-linked), SQL practice, quizzes (weak topics), SRS revisions (due cards), interview questions, mock interviews, and short focused reading.
- Prioritize weak topics and due SRS revisions. Add at least 1 revision task/day if SRS is due.
- For each task: short actionable title, 1-line description ("why this task"), estimated_minutes (5-90), and difficulty.
- Include resource_url ONLY when relevant. Use these platform links:
  * DSA: /library/dsa or /library/problems
  * SQL: /library/sql
  * Quizzes: /library/quiz
  * Interview: /library/interview
  * SRS: /learn/dsa-tracker
- Weekends can include a longer mock interview or a mini-project reading.
- Keep the plan realistic and encouraging. Provide 3-6 tasks per day.

Return STRICT JSON matching this schema exactly:
{
  "summary": "string (2-3 sentences on plan strategy)",
  "readiness": { "score": number 0-100, "strengths": string[], "gaps": string[] },
  "days": [{
    "day_index": 0-6,
    "day_date": "YYYY-MM-DD",
    "focus": "string (one-line theme)",
    "tasks": [{
      "kind": "dsa"|"sql"|"quiz"|"srs"|"interview"|"reading"|"mock",
      "topic": "string?",
      "title": "string",
      "description": "string",
      "estimated_minutes": number,
      "difficulty": "easy"|"medium"|"hard",
      "resource_url": "string?"
    }]
  }]
}`;

    const userPrompt = `USER CONTEXT
Name: ${extended?.full_name ?? "Student"}
Goal: ${profile?.goal ?? "Crack placements"}
Target date: ${profile?.target_date ?? "not set"}
Self-rated level: ${profile?.level ?? "intermediate"}
Topics known: ${(profile?.topics_known ?? []).slice(0, 15).join(", ") || "unspecified"}
Skills: ${(extended?.skills ?? []).slice(0, 15).join(", ") || "unspecified"}
Aspirations/Goals: ${(extended?.goals ?? []).slice(0, 5).join(", ") || "unspecified"}
Notes: ${profile?.notes ?? "-"}

TIME BUDGET
Weekday minutes/day: ${weekdayMin}
Weekend minutes/day: ${weekendMin}

READINESS SNAPSHOT (score ${readinessScore}/100)
Topics completed: ${topicsCompleted}/${topicsTotal}
SRS due now: ${srsDue}   SRS mastered: ${srsMastered}
Platform problems solved (total): ${platformSolved}  ${platformStats.map(p => `${p.platform}:${p.solved_total ?? 0}`).join(", ")}
Recent quiz avg: ${quizAvg == null ? "n/a" : quizAvg + "%"}

WEAK AREAS (bottom sheets by completion): ${weakSheets.join(", ") || "n/a"}
TOP SRS DUE CATEGORIES: ${topDueCats.map(([c, n]) => `${c}(${n})`).join(", ") || "none"}

WEEK DAYS
${days.map(d => `Day ${d.i} (${d.weekday}) = ${d.iso} — budget ${d.i >= 5 ? weekendMin : weekdayMin} min`).join("\n")}

Build the JSON plan now. Return JSON only, no markdown fences.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": LOVABLE_API_KEY,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway failed:", aiRes.status, errText);
      return new Response(
        JSON.stringify({ error: "AI generation failed", status: aiRes.status, details: errText }),
        { status: aiRes.status === 429 || aiRes.status === 402 ? aiRes.status : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const aiJson = await aiRes.json();
    const content = aiJson?.choices?.[0]?.message?.content ?? "{}";
    let plan: PlanShape;
    try {
      plan = JSON.parse(content);
    } catch (e) {
      console.error("Plan JSON parse failed:", content.slice(0, 500));
      return new Response(JSON.stringify({ error: "AI returned invalid JSON" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist: deactivate old, insert new
    await admin.from("study_plans").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);

    const weekStartIso = isoDate(weekStart);
    const focusTopics = [
      ...weakSheets.slice(0, 4),
      ...topDueCats.map(([c]) => c).slice(0, 3),
    ];

    const { data: planRow, error: planErr } = await admin
      .from("study_plans")
      .insert({
        user_id: userId,
        week_start: weekStartIso,
        goal: profile?.goal ?? null,
        target_date: profile?.target_date ?? null,
        focus_topics: focusTopics,
        weekday_minutes: weekdayMin,
        weekend_minutes: weekendMin,
        readiness_snapshot: {
          score: plan.readiness?.score ?? readinessScore,
          computed_score: readinessScore,
          strengths: plan.readiness?.strengths ?? [],
          gaps: plan.readiness?.gaps ?? weakSheets,
          topicsCompleted, topicsTotal, srsDue, srsMastered, platformSolved, quizAvg,
        },
        plan_json: plan,
        summary: plan.summary ?? null,
        is_active: true,
      })
      .select()
      .single();

    if (planErr) {
      console.error("Insert plan failed", planErr);
      return new Response(JSON.stringify({ error: planErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert tasks
    const taskRows = (plan.days ?? []).flatMap((day) =>
      (day.tasks ?? []).map((t, idx) => ({
        plan_id: planRow.id,
        user_id: userId,
        day_date: day.day_date || days[day.day_index]?.iso || weekStartIso,
        day_index: day.day_index ?? 0,
        order_index: idx,
        kind: t.kind,
        topic: t.topic ?? null,
        title: (t.title ?? "Task").slice(0, 300),
        description: t.description ?? null,
        estimated_minutes: Math.max(5, Math.min(180, Number(t.estimated_minutes) || 20)),
        resource_url: t.resource_url ?? null,
        resource_ref: null,
        difficulty: t.difficulty ?? null,
        status: "pending",
      })),
    );

    if (taskRows.length) {
      const { error: taskErr } = await admin.from("study_plan_tasks").insert(taskRows);
      if (taskErr) console.error("Insert tasks failed", taskErr);
    }

    return new Response(JSON.stringify({ plan_id: planRow.id, plan, readiness_score: readinessScore }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("generate-study-plan error", err);
    return new Response(JSON.stringify({ error: String((err as Error).message ?? err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
