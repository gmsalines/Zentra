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
async function findTask(findText) {
  const uid = process.env.ZENTRA_USER_ID;
  const r = await fetch(SUPA + '/rest/v1/tasks?user_id=eq.' + uid + '&done=eq.false&select=id,text,cat', { headers: H() });
  const allTasks = await r.json();
  if (!Array.isArray(allTasks) || !allTasks.length) return null;
  const fl = String(findText || '').toLowerCase().trim();
  const words = fl.split(/\s+/).filter(w => w.length > 2);
  let best = null, bestScore = -1;
  for (const t of allTasks) {
    const tl = (t.text || '').toLowerCase();
    let score = 0;
    for (const w of words) { if (tl.includes(w)) score++; }
    if (tl.includes(fl)) score += 5;
    if (score > bestScore) { bestScore = score; best = t; }
  }
  return bestScore > 0 ? best : null;
}
async function execAction(p) {
  const today = new Date().toISOString().slice(0, 10);
  if (p.action === 'add_task') {
    const cat = normCat(p.cat);
    await insert('tasks', { text: p.text, cat: cat, prio: p.prio || 'media', due: p.due || null, done: false });
    return 'Tarefa (' + cat + '): ' + p.text;
  }
  if (p.action === 'add_gasto') {
    await insert('gastos', { descricao: p.descricao, val: p.val, cur: p.cur || 'BRL', cat: p.cat || 'Outro', banco: p.banco || null, data: today });
    return 'Gasto: ' + p.descricao + ' ' + p.val + ' ' + (p.cur || 'BRL');
  }
  if (p.action === 'add_treino') {
    await insert('registros', { tipo: 'academia', valor: p.tipo || 'musculacao', notas: (p.min ? p.min + 'min' : ''), data: today });
    return 'Treino registrado';
  }
  if (p.action === 'add_peso') {
    await insert('registros', { tipo: 'peso', valor: String(p.valor), data: today });
    return 'Peso: ' + p.valor + ' kg';
  }
  if (p.action === 'edit_task') {
    const task = await findTask(p.find);
    if (!task) return 'Nao encontrei tarefa com "' + p.find + '"';
    const updates = {};
    if (p.new_text) updates.text = p.new_text;
    if (p.new_cat) updates.cat = normCat(p.new_cat);
    if (!Object.keys(updates).length) return 'Qual e o texto correto para "' + task.text + '"?';
    const uid = process.env.ZENTRA_USER_ID;
    await fetch(SUPA + '/rest/v1/tasks?id=eq.' + task.id + '&user_id=eq.' + uid, { method: 'PATCH', headers: Object.assign(H(), { Prefer: 'return=minimal' }), body: JSON.stringify(updates) });
    return 'Corrigido: "' + task.text + '" → "' + (p.new_text || task.text) + '"';
  }
  if (p.action === 'delete_task') {
    const task = await findTask(p.find);
    if (!task) return 'Nao encontrei tarefa com "' + p.find + '"';
    const uid = process.env.ZENTRA_USER_ID;
    await fetch(SUPA + '/rest/v1/tasks?id=eq.' + task.id + '&user_id=eq.' + uid, { method: 'DELETE', headers: H() });
    return 'Removida: "' + task.text + '"';
  }
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
    const prompt = `Voce e o assistente do app Zentra da Gabi. Hoje: ${today}. Quando o usuario pedir ACOES, responda APENAS com JSON, sem texto extra.

Acoes possiveis:
- Adicionar tarefa: {"action":"add_task","text":"...","cat":"brinta|cliente|pessoal|estudo","prio":"alta|media|baixa","due":"YYYY-MM-DD ou null"}
- Adicionar gasto: {"action":"add_gasto","descricao":"...","val":50,"cur":"BRL","cat":"Alimentacao"}
- Treino: {"action":"add_treino","tipo":"musculacao","min":60}
- Peso: {"action":"add_peso","valor":"65.0"}
- Editar tarefa existente: {"action":"edit_task","find":"palavras-chave da tarefa a corrigir","new_text":"texto correto","new_cat":"nova categoria opcional"}
- Deletar tarefa: {"action":"delete_task","find":"palavras-chave da tarefa"}

REGRAS DE CATEGORIA para tarefa: brinta (trabalho/empresa Brinta), cliente, pessoal, estudo; na duvida pessoal.

QUANDO USAR edit_task: sempre que o usuario disser "corregir", "corrigir", "errei", "o certo e", "cambiar", "mudar", "editar", "na verdade e", "queria dizer", "corrija", "fix", "era" — isso significa editar uma tarefa ja existente, NAO criar uma nova. O campo "find" deve ter as palavras-chave para achar a tarefa, e "new_text" o texto correto.

QUANDO USAR delete_task: "deletar", "apagar", "remover", "nao precisa mais", "cancela".

MULTIPLOS ITENS: Se o usuario listar varias coisas, responda um ARRAY JSON: [{...},{...}].

Ignore cabecalhos como "Trabalho-" ou "add". Para conversa/pergunta, responda em texto normal.

Usuario: ${text}`;

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
      let msg = results.length > 1 ? (results.length + ' itens:\n- ' + results.join('\n- ')) : (results[0] || 'Ok');
      return reply(res, msg + (numMedia > 0 ? '\n(audio: ' + text + ')' : ''));
    }
    return reply(res, content || ('Recebi: ' + text));
  } catch (e) {
    return reply(res, 'Erro ao processar: ' + String(e).slice(0, 100));
  }
}
