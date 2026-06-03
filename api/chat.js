export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY nao configurada' });
    try {
          const body = req.body || {};
          const prompt = body.prompt;
          if (!prompt) return res.status(400).json({ error: 'Missing prompt' });
          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
                  body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 500, temperature: 0.1 })
          });
          const data = await groqRes.json();
          return res.status(200).json(data);
    } catch (e) {
          return res.status(500).json({ error: String(e) });
    }
}
