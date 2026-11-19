// Vercel Serverless Function — proxy seguro para a Groq.
// Caminho no repositório: /api/chat.js
// A chave fica numa variável de ambiente (GROQ_API_KEY), nunca no front-end.
// O modelo llama-3.3-70b-versatile foi desligado pela Groq em ago/2026; agora usamos openai/gpt-oss-120b.
// Para trocar de modelo no futuro sem mexer no código: crie a env var GROQ_MODEL no Vercel.
const MODEL = process.env.GROQ_MODEL || 'openai/gpt-oss-120b';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GROQ_API_KEY não configurada no Vercel' });
  }

  try {
    const { prompt, max_tokens } = req.body || {};
    if (!prompt) {
      return res.status(400).json({ error: 'Missing prompt' });
    }

    // gpt-oss "pensa" antes de responder e isso consome tokens: garantimos um mínimo folgado.
    const mt = (max_tokens && Number(max_tokens) > 0) ? Math.min(Math.max(Number(max_tokens), 1500), 8000) : 1500;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_completion_tokens: mt,
        temperature: 0.2,
        reasoning_effort: 'low',
        include_reasoning: false
      })
    });

    const data = await groqRes.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: String(e) });
  }
}
