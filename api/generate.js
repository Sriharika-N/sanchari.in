export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const { payload, prompt } = req.body;

  try {
    // Pointing to the active 2.5 engine
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        // Simplified configuration to prevent strict 400 validation rejections
        generationConfig: { 
          temperature: 0.4 
        }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini Engine Refusal (${geminiRes.status}): ${errText}`);
    }
    
    const data = await geminiRes.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Robust extraction regex to isolate JSON if the model returns markdown ticks
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to isolate a valid JSON block from the model response.");
    }
    
    const parsedPlan = JSON.parse(jsonMatch[0]);

    // Commit history entry directly to your database instance
    await fetch(`${SUPABASE_URL}/rest/v1/trip_history`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        destination: payload.destination,
        start_city: payload.startCity,
        plan_data: parsedPlan
      })
    });

    return res.status(200).json(parsedPlan);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
