export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const { payload, prompt } = req.body;

  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    
    const enhancedPrompt = `${prompt} 
    Return a structural JSON object containing:
    1. "famousActivities": Array of iconic sights in the location.
    2. "hiddenGems": Array of offbeat, not-so-famous spots.
    3. "timingOptimization": { "bestTimeToDepart": String, "layoverTransverseStrategy": String }
    4. "multimodalBudgetOptions": { "budgetRoute": String, "premiumRoute": String, "optimizedStayRecommendation": String }
    5. "itinerary": Daily layout map structured using the specified weekday names (e.g., Monday, Tuesday) matching the user's daily vibes matrix.
    
    CRITICAL: Return ONLY valid JSON. Do not include markdown blocks, backticks, or code wrappers outside the curly braces.`;

    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: enhancedPrompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.5 }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini Engine Refusal: ${errText}`);
    }
    
    const data = await geminiRes.json();
    let rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    rawText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsedPlan = JSON.parse(rawText);

    const authHeader = req.headers['authorization'] || `Bearer ${SUPABASE_KEY}`;

    await fetch(`${SUPABASE_URL}/rest/v1/trip_history`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        destination: payload.destination.toString(),
        start_city: payload.startCity,
        plan_data: parsedPlan
      })
    });

    return res.status(200).json(parsedPlan);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
