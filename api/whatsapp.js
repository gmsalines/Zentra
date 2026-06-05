const SUPA = 'https://raboikyezplxhxxropvf.supabase.co';
function H() { const k = process.env.SUPABASE_SERVICE_KEY; return { apikey: k, Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' }; }
function reply(res, msg) {
    const safe = String(msg).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    res.setHeader('Content-Type', 'text/xml');
    res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>' + safe + '</Message></Response>');
}
function empty(res) { res.setHeader('Content-Type', 'text/xml'); res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>'); }
async function insert(table, row) {
    row.user_id = process.env.ZENTRA_USER_ID;
    const r = await fetch(SUPA + '/rest/v1/' + table, { method: 'POST', headers: Object.assign(H(), { Prefer: 'return=minimal' }), body: JSON.stringify(row) });
    if (!r.ok) { const t = await r.text(); throw new Error('DB ' + r.status + ': ' + t.slice(0, 120)); }
}
async function alreadyProcessed(sid) {
    if (!sid) return false;
    try { const r = await fetch(SUPA + '/rest/v1/wa_processed', { method: 'POST', headers: Object.assign(H(), { Prefer: 'return=minimal' }), body: JSON.stringify({ message_sid: sid }) }); return r.status === 409; } catch (e) { return false; }
}
function normCat(raw) {
    const v = ['brinta', 'cliente', 'pessoal', 'estudo'];
    let c = String(raw || 'pessoal').toLowerCase().trim();
    if (v.includes(c)) return c;
    const m = { trabalho: 'brinta', work: 'brinta', empresa: 'brinta', clientes: 'cliente', compras: 'pessoal', mercado: 'pessoal', casa: 'pessoal', familia: 'pessoal', saude: 'pessoal', estudos: 'estudo', estudar: 'estudo', faculdade: 'estudo', curso: 'estudo' };
    return m[c] || 'pessoal';
}
async function execAction(p) {
    const today = new Date().toISOString().slice(0, 10);
    if (p.action === 'add_task') { const cat = normCat(p.cat); await insert('tasks', { text: p.text, cat: cat, prio: p.prio || 'media', due: p.due || null, done: false }); return 'Tarefa (' + cat + '): ' + p.text; }
    if (p.action === 'add_gasto') { await insert('gastos', { descricao: p.descricao, val: p.val, cur: p.cur || 'BRL', cat: p.cat || 'Outro', banco: p.banco || null, data: today }); return 'Gasto: ' + p.descricao + ' ' + p.val + ' ' + (p.cur || 'BRL'); }
    if (p.action === 'add_treino') { await insert('registros', { tipo: 'academia', valor: p.tipo || 'musculacao', notas: (p.min ? p.min + 'min' : ''), data: today }); return 'Treino registrado'; }
    if (p.action === 'add_peso') { await insert('registros', { tipo: 'peso', valor: String(p.valor), data: today }); return 'Peso: ' + p.valor + ' kg'; }
    return null;
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
        const prompt = 'Voce e o assistente do app Zentra da Gabi. Hoje: ' + today + '. Quando o usuario pedir ACOES, responda APENAS com JSON, sem texto extra. Acoes possiveis: tarefa {"action":"add_task","text":"...","cat":"brinta|cliente|pessoal|estudo","prio":"alta|media|baixa","due":"YYYY-MM-DD ou null"}; gasto {"action":"add_gasto","descricao":"...","val":50,"cur":"BRL","cat":"Alimentacao"}; treino {"action":"add_treino","tipo":"musculacao","min":60}; peso {"action":"add_peso","valor":"65.0"}. Categoria (cat) da tarefa: use EXATAMENTE uma de brinta (trabalho/empresa Brinta), cliente, pessoal, estudo; na duvida pessoal. IMPORTANTE: se o usuario listar VARIAS coisas (varias linhas ou itens), responda um ARRAY JSON com um objeto por item, assim: [{...},{...},{...}]. Ignore cabecalhos como "Trabalho- add". Para conversa/pergunta, responda em texto normal. Usuario: ' + text;
        const lr = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.GROQ_API_KEY }, body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: [{ role: 'user', content: prompt }], max_tokens: 1500, temperature: 0.1 }) });
        const ld = await lr.json();
        const content = (ld && ld.choices && ld.choices[0] && ld.choices[0].message && ld.choices[0].message.content || '').trim();
        const cleaned = content.replace(/```json|```/g, '').trim();
        let actions = [];
        try { const j = JSON.parse(cleaned); if (Array.isArray(j)) actions = j.filter(function (x) { return x && x.action; }); else if (j && j.action) actions = [j]; } catch (e) {}
        if (!actions.length) { const ms = cleaned.match(/\{[\s\S]*?\}/g); if (ms) { ms.forEach(function (m) { try { const o = JSON.parse(m); if (o && o.action) actions.push(o); } catch (e) {} }); } }
        if (actions.length) {
            const results = [];
            for (const a of actions) { try { const r = await execAction(a); if (r) results.push(r); } catch (e) { results.push('Erro: ' + String(e).slice(0, 50)); } }
            let msg = results.length > 1 ? (results.length + ' itens adicionados:\n- ' + results.join('\n- ')) : (results[0] || 'Ok');
            return reply(res, msg + (numMedia > 0 ? '\n(audio: ' + text + ')' : ''));
        }
        return reply(res, content || ('Recebi: ' + text));
    } catch (e) {
        return reply(res, 'Erro ao processar: ' + String(e).slice(0, 100));
    }
}
