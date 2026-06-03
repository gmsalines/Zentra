const SUPA = 'https://raboikyezplxhxxropvf.supabase.co';
function reply(res, msg) {
    const safe = String(msg).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>' + safe + '</Message></Response>');
}
function empty(res) {
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
}
// Grava no Supabase. Se o banco recusar, LANCA erro (nao finge sucesso).
async function insert(table, row) {
    const key = process.env.SUPABASE_SERVICE_KEY;
    row.user_id = process.env.ZENTRA_USER_ID;
    const r = await fetch(SUPA + '/rest/v1/' + table, { method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify(row) });
    if (!r.ok) { const t = await r.text(); throw new Error('DB ' + r.status + ': ' + t.slice(0, 140)); }
}
// Idempotencia: grava o MessageSid; se ja existe (409), e reenvio do Twilio -> ignora.
async function alreadyProcessed(sid) {
    if (!sid) return false;
    const key = process.env.SUPABASE_SERVICE_KEY;
    try {
        const r = await fetch(SUPA + '/rest/v1/wa_processed', { method: 'POST', headers: { apikey: key, Authorization: 'Bearer ' + key, 'Content-Type': 'application/json', Prefer: 'return=minimal' }, body: JSON.stringify({ message_sid: sid }) });
        return r.status === 409;
    } catch (e) { return false; }
}
// Categorias validas do app. O app so mostra tarefas dessas; mapeia o resto.
function normCat(raw) {
    const valid = ['brinta', 'cliente', 'pessoal', 'estudo'];
    let c = String(raw || 'pessoal').toLowerCase().trim();
    if (valid.includes(c)) return c;
    const map = { trabalho: 'brinta', work: 'brinta', empresa: 'brinta', clientes: 'cliente', compras: 'pessoal', mercado: 'pessoal', casa: 'pessoal', saude: 'pessoal', estudos: 'estudo', estudar: 'estudo', faculdade: 'estudo' };
    return map[c] || 'pessoal';
}
async function execAction(p) {
    const today = new Date().toISOString().slice(0, 10);
    if (p.action === 'add_task') { const cat = normCat(p.cat); await insert('tasks', { text: p.text, cat: cat, prio: p.prio || 'media', due: p.due || null, done: false }); return 'Tarefa adicionada (' + cat + '): ' + p.text; }
    if (p.action === 'add_gasto') { await insert('gastos', { descricao: p.descricao, val: p.val, cur: p.cur || 'BRL', cat: p.cat || 'Outro', banco: p.banco || null, data: today }); return 'Gasto: ' + p.descricao + ' ' + p.val + ' ' + (p.cur || 'BRL'); }
    if (p.action === 'add_treino') { await insert('registros', { tipo: 'academia', valor: p.tipo || 'musculacao', notas: (p.min ? p.min + 'min' : ''), data: today }); return 'Treino registrado' + (p.min ? ' (' + p.min + 'min)' : ''); }
    if (p.action === 'add_peso') { await insert('registros', { tipo: 'peso', valor: String(p.valor), data: today }); return 'Peso: ' + p.valor + ' kg'; }
    return 'Ok';
}
export default async function handler(req, res) {
    if (req.method !== 'POST') { res.status(200).send('Zentra WhatsApp webhook ok'); return; }
    const b = req.body || {};
    const sid = b.MessageSid || b.SmsSid || b.SmsMessageSid || '';
    let text = (b.Body || '').trim();
    try {
        if (await alreadyProcessed(sid)) { return empty(res); }
        const numMedia = parseInt(b.NumMedia || '0', 10);
        if (numMedia > 0 && (b.MediaContentType0 || '').indexOf('audio') === 0) {
            const auth = 'Basic ' + Buffer.from(process.env.TWILIO_ACCOUNT_SID + ':' + process.env.TWILIO_AUTH_TOKEN).toString('base64');
            const mr = await fetch(b.MediaUrl0, { headers: { Authorization: auth } });
            const buf = Buffer.from(await mr.arrayBuffer());
            const fd = new FormData();
            fd.append('file', new Blob([buf], { type: b.MediaContentType0 || 'audio/ogg' }), 'audio.ogg');
            fd.append('model', 'whisper-large-v3');
            const tr = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', { method: 'POST', headers: { Authorization: 'Bearer ' + process.env.GROQ_API_KEY }, body: fd });
            const trd = await tr.json();
            text = (trd.text || '').trim();
        }
        if (!text) return reply(res, 'Nao consegui entender. Manda de novo?');
        const today = new Date().toISOString().slice(0, 10);
        const prompt = 'Voce e o assistente do app Zentra da Gabi. Hoje: ' + today + '. Quando o usuario pedir uma ACAO, responda APENAS com JSON (sem texto extra): - Tarefa: {"action":"add_task","text":"...","cat":"brinta|cliente|pessoal|estudo","prio":"alta|media|baixa","due":"YYYY-MM-DD ou null"} - Gasto: {"action":"add_gasto","descricao":"...","val":50,"cur":"BRL","cat":"Alimentacao","banco":"Nubank"} - Treino: {"action":"add_treino","tipo":"musculacao","min":60} - Peso: {"action":"add_peso","valor":"65.0"} REGRA DA CATEGORIA (cat) da tarefa: use EXATAMENTE uma destas quatro, nunca invente outra. brinta = trabalho/empresa Brinta e trabalho generico. cliente = quando mencionar um cliente especifico. pessoal = vida pessoal, compras, casa, mercado, familia. estudo = estudos, curso, faculdade. Se nao tiver certeza, use pessoal. Para perguntas/conversa, responda em texto normal. Usuario: ' + text;
        const lr = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.GROQ_API_KEY }, body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 300, temperature: 0.1 }) });
        const ld = await lr.json();
        let content = (ld && ld.choices && ld.choices[0] && ld.choices[0].message && ld.choices[0].message.content || '').trim();
        let parsed = null;
        try { parsed = JSON.parse(content.replace(/```json|```/g, '').trim()); } catch (e) {}
        if (parsed && parsed.action) {
            const msg = await execAction(parsed);
            return reply(res, msg + (numMedia > 0 ? ' (audio: ' + text + ')' : ''));
        }
        return reply(res, content || ('Recebi: ' + text));
    } catch (e) {
        return reply(res, 'Erro ao processar: ' + String(e).slice(0, 120));
    }
}
