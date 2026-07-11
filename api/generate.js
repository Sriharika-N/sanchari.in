export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_KEY = process.env.SUPABASE_KEY;

  const { payload, prompt } = req.body;

  try {
    // Invoke active Gemini model endpoint
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;
    
    const geminiRes = await fetch(geminiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': GEMINI_API_KEY
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.4 }
      })
    });

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini Engine Refusal: ${errText}`);
    }
    
    const data = await geminiRes.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Extractor wrapper to cleanly capture JSON structures
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const parsedPlan = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw_output: rawText };

    // Capture token context from request header. Fallback to server verification key if guest.
    const authHeader = req.headers['authorization'] || `Bearer ${SUPABASE_KEY}`;

    // Post to the updated, verified database schema table structure
    const dbPostResponse = await fetch(`${SUPABASE_URL}/rest/v1/trip_history`, {
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

    if (!dbPostResponse.ok) {
      const dbErr = await dbPostResponse.text();
      throw new Error(`Supabase DB Write Error: ${dbErr}`);
    }

    return res.status(200).json(parsedPlan);

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
