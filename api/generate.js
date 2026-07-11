export default async function handler(req, res) {
  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. Read keys securely from Vercel's Environment Variables
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const { payload, prompt } = req.body;

  try {
    // 3. Point to the active Gemini engine endpoint
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
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
    
    // 4. Robust extraction regex to isolate JSON data blocks cleanly
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("Failed to isolate a valid JSON block from the model response.");
    }
    
    const parsedPlan = JSON.parse(jsonMatch[0]);

    // 5. Capture the traveler's active authentication token passed from the frontend request
    // Defaults back to the service key if a traveler is operating in guest mode
    const authHeader = req.headers['authorization'] || `Bearer ${SUPABASE_KEY}`;

    // 6. Commit the history entry directly to your Supabase database instance
    await fetch(`${SUPABASE_URL}/rest/v1/trip_history`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        destination: payload.destination,
        start_city: payload.startCity,
        plan_data: parsedPlan
      })
    });

    // 7. Return the planned travel asset data back to the browser interface
    return res.status(200).json(parsedPlan);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
