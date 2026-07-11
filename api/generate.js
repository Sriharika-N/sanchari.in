export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  if (!GEMINI_API_KEY || !SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: "Missing required backend infrastructure keys in Vercel configuration." });
  }

  const { payload, prompt } = req.body;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    
    const enhancedPrompt = `${prompt}
    Format your response strictly as a single JSON object. Do not wrap the response in markdown code blocks like \`\`\`json or include any text outside the raw JSON structure. 
    
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

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: enhancedPrompt }] }]
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return res.status(502).json({ error: `Gemini Engine Refusal: ${errText}` });
    }
    
    const data = await geminiRes.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Aggressive normalization formatting scrub to completely isolate raw JSON
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    let parsedPlan;
    try {
      parsedPlan = JSON.parse(rawText);
    } catch (parseErr) {
      return res.status(422).json({ error: "Failed to parse raw text response stream from AI engine into structural JSON formatting." });
    }

    const authHeader = req.headers['authorization'] || `Bearer ${SUPABASE_KEY}`;

    // Gracefully attempt history persistence without crashing if database connections time out
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
