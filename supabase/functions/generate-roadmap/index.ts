import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { user_id, onboarding_data } = await req.json()
    
    const prompt = `Based on the following user goals for interview preparation, generate a 4-week personalized roadmap.
    Company: ${onboarding_data.target_company}
    Role: ${onboarding_data.target_role}
    Timeline: ${onboarding_data.target_timeline}
    
    Return a JSON structure:
    {
      "weeks": [
        {
          "week_number": 1,
          "title": "Topic Name",
          "tasks": [
            {"day": 1, "title": "Task 1", "type": "problem/revision", "estimated_minutes": 60},
            ...
          ]
        },
        ...
      ]
    }`

    // Call AI to generate roadmap
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': Deno.env.get('ANTHROPIC_API_KEY') || '',
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20240620',
        max_tokens: 2048,
        messages: [{ role: 'user', content: prompt }]
      })
    })

    const aiData = await response.json()
    const roadmapJson = JSON.parse(aiData.content[0].text.match(/\{[\s\S]*\}/)[0])

    return new Response(
      JSON.stringify({ roadmap: roadmapJson }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
