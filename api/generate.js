export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Missing required backend infrastructure keys (OpenAI/Supabase) in Vercel." });
  }

  const { payload, prompt } = req.body;

  try {
    const openaiUrl = 'https://api.openai.com/v1/chat/completions';
    
    const enhancedPrompt = `${prompt}
    Format your response strictly as a single JSON object. 
    The JSON object must contain exactly these keys:
    {
      "famousActivities": ["activity 1", "activity 2"],
      "hiddenGems": ["gem 1", "gem 2"],
      "timingOptimization": {
        "bestTimeToDepart": "detailed timing recommendation text string",
        "layoverTransverseStrategy": "detailed routing/transit optimization string"
      },
      "multimodalBudgetOptions": {
        "budgetRoute": "economy transit details string",
        "premiumRoute": "premium transit details string",
        "optimizedStayRecommendation": "hotel/stay optimization details string"
      }
    }`;

    const openaiRes = await fetch(openaiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        response_format: { type: "json_object" }, // Forces ChatGPT to return clean JSON structure natively
        messages: [
          { role: 'system', content: 'You are a professional travel routing engine that outputs strict raw JSON travel plans.' },
          { role: 'user', content: enhancedPrompt }
        ]
      })
    });

    if (!openaiRes.ok) {
      const errText = await openaiRes.text();
      return res.status(502).json({ error: `ChatGPT Engine Refusal: ${errText}` });
    }
    
    const data = await openaiRes.json();
    const rawText = data.choices?.[0]?.message?.content || '{}';
    const parsedPlan = JSON.parse(rawText.trim());

    const authHeader = req.headers['authorization'] || `Bearer ${SUPABASE_KEY}`;

    // Log history seamlessly into your existing Supabase structure
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/trip_history`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': authHeader,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          destination: Array.isArray(payload.destination) ? payload.destination.toString() : payload.destination,
          start_city: payload.startCity,
          plan_data: parsedPlan
        })
      });
    } catch (dbErr) {
      console.warn("Telemetry persistence skipped:", dbErr.message);
    }

    return res.status(200).json(parsedPlan);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
