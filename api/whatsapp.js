const SUPA = 'https://raboikyezplxhxxropvf.supabase.co';
function H() { const k = process.env.SUPABASE_SERVICE_KEY; return { apikey: k, Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' }; }
function reply(res, msg) {
  const safe = String(msg).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>' + safe + '</Message></Response>');
}
function empty(res) { res.setHeader('Content-Type', 'text/xml'); res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>'); }
async function insert(table, row, uid) {
  row.user_id = uid;
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

// ===== Multiusuário: resolve o numero de WhatsApp remetente para um user_id do Zentra =====
async function resolveUserByPhone(fromPhone) {
  if (!fromPhone) return null;
  const r = await fetch(SUPA + '/rest/v1/whatsapp_links?phone=eq.' + encodeURIComponent(fromPhone) + '&select=user_id', { headers: H() });
  if (!r.ok) return null;
  const rows = await r.json();
  return (Array.isArray(rows) && rows[0] && rows[0].user_id) || null;
}

// Tenta tratar a mensagem como um código de vínculo (6 dígitos gerado no app).
// Retorna true se a mensagem era um código (vinculado com sucesso ou não) e já respondeu — nesse caso o chamador deve parar.
async function tryLinkCode(req_res, fromPhone, text) {
  const code = String(text || '').trim();
  if (!/^\d{6}$/.test(code)) return false;
  const r = await fetch(SUPA + '/rest/v1/whatsapp_link_codes?code=eq.' + code + '&expires_at=gt.' + new Date().toISOString() + '&select=user_id,code', { headers: H() });
  const rows = await r.json().catch(() => []);
  if (!Array.isArray(rows) || !rows[0]) {
    reply(req_res, 'Código inválido ou expirado. Gere um novo código no app Zentra (⚙️ → Conectar WhatsApp).');
    return true;
  }
  const uid = rows[0].user_id;
  const link = await fetch(SUPA + '/rest/v1/whatsapp_links', { method: 'POST', headers: Object.assign(H(), { Prefer: 'return=minimal,resolution=merge-duplicates' }), body: JSON.stringify({ user_id: uid, phone: fromPhone }) });
  if (!link.ok) {
    const t = await link.text();
    reply(req_res, 'Não consegui conectar seu WhatsApp agora. Tenta de novo em instantes. (' + t.slice(0, 80) + ')');
    return true;
  }
  await fetch(SUPA + '/rest/v1/whatsapp_link_codes?code=eq.' + code, { method: 'DELETE', headers: H() });
  reply(req_res, '✅ WhatsApp conectado à sua conta Zentra! Agora é só mandar áudio ou texto pra registrar tarefas, gastos, treinos...');
  return true;
}

async function findBest(rows, textField, findText) {
  if (!Array.isArray(rows) || !rows.length) return null;
  const fl = String(findText || '').toLowerCase().trim();
  const words = fl.split(/\s+/).filter(w => w.length > 2);
  let best = null, bestScore = -1;
  for (const row of rows) {
    const tl = String(row[textField] || '').toLowerCase();
    let score = 0;
    for (const w of words) { if (tl.includes(w)) score++; }
    if (fl && tl.includes(fl)) score += 5;
    if (score > bestScore) { bestScore = score; best = row; }
  }
  return bestScore > 0 ? best : null;
}
async function findTask(uid, findText) {
  const r = await fetch(SUPA + '/rest/v1/tasks?user_id=eq.' + uid + '&done=eq.false&select=id,text,cat', { headers: H() });
  const allTasks = await r.json();
  return findBest(allTasks, 'text', findText);
}
async function findBill(uid, findText) {
  const r = await fetch(SUPA + '/rest/v1/bills?user_id=eq.' + uid + '&paid=eq.false&select=id,name,val,cur', { headers: H() });
  const allBills = await r.json();
  return findBest(allBills, 'name', findText);
}
async function execAction(p, uid) {
  const today = new Date().toISOString().slice(0, 10);
  if (p.action === 'add_task') {
    const cat = normCat(p.cat);
    await insert('tasks', { text: p.text, cat: cat, prio: p.prio || 'media', due: p.due || null, done: false }, uid);
    return 'Tarefa (' + cat + '): ' + p.text;
  }
  if (p.action === 'add_gasto') {
    await insert('gastos', { descricao: p.descricao, val: p.val, cur: p.cur || 'BRL', cat: p.cat || 'Outro', banco: p.banco || null, data: today }, uid);
    return 'Gasto: ' + p.descricao + ' ' + p.val + ' ' + (p.cur || 'BRL');
  }
  if (p.action === 'add_treino') {
    const notasParts = [];
    if (p.min) notasParts.push(p.min + 'min');
    if (p.cal) notasParts.push(p.cal + 'cal');
    await insert('registros', { tipo: 'academia', valor: p.tipo || 'musculacao', notas: notasParts.join(', '), data: p.data || today }, uid);
    return 'Treino registrado' + (p.data && p.data !== today ? ' (' + p.data + ')' : '');
  }
  if (p.action === 'add_peso') {
    await insert('registros', { tipo: 'peso', valor: String(p.valor), data: p.data || today }, uid);
    return 'Peso: ' + p.valor + ' kg';
  }
  if (p.action === 'add_compra') {
    if (!p.nome) return null;
    await insert('compras', { nome: p.nome, qtd: p.qtd || 1, preco: p.preco || null, done: false }, uid);
    return 'Lista de compras: ' + p.nome + (p.qtd && p.qtd > 1 ? ' (x' + p.qtd + ')' : '');
  }
  if (p.action === 'pay_bill') {
    if (!p.find) return 'Qual conta você quer pagar?';
    const bill = await findBill(uid, p.find);
    if (!bill) {
      // Não achou conta existente com esse nome — cria uma tarefa pra não perder o pedido.
      await insert('tasks', { text: 'Pagar: ' + p.find, cat: 'pessoal', prio: 'media', due: null, done: false }, uid);
      return 'Não achei uma conta chamada "' + p.find + '" em Contas. Criei um lembrete em tarefas.';
    }
    await fetch(SUPA + '/rest/v1/bills?id=eq.' + bill.id + '&user_id=eq.' + uid, { method: 'PATCH', headers: Object.assign(H(), { Prefer: 'return=minimal' }), body: JSON.stringify({ paid: true, paid_at: new Date().toISOString() }) });
    return 'Conta paga: ' + bill.name + ' ' + (bill.cur || 'BRL') + ' ' + bill.val;
  }
  if (p.action === 'edit_task') {
    const task = await findTask(uid, p.find);
    if (!task) return 'Nao encontrei tarefa com "' + p.find + '"';
    const updates = {};
    if (p.new_text) updates.text = p.new_text;
    if (p.new_cat) updates.cat = normCat(p.new_cat);
    if (!Object.keys(updates).length) return 'Qual e o texto correto para "' + task.text + '"?';
    await fetch(SUPA + '/rest/v1/tasks?id=eq.' + task.id + '&user_id=eq.' + uid, { method: 'PATCH', headers: Object.assign(H(), { Prefer: 'return=minimal' }), body: JSON.stringify(updates) });
    return 'Corrigido: "' + task.text + '" → "' + (p.new_text || task.text) + '"';
  }
  if (p.action === 'delete_task') {
    const task = await findTask(uid, p.find);
    if (!task) return 'Nao encontrei tarefa com "' + p.find + '"';
    await fetch(SUPA + '/rest/v1/tasks?id=eq.' + task.id + '&user_id=eq.' + uid, { method: 'DELETE', headers: H() });
    return 'Removida: "' + task.text + '"';
  }
  return null;
}
export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(200).send('Zentra WhatsApp webhook ok'); return; }
  const b = req.body || {};
  const sid = b.MessageSid || b.SmsSid || b.SmsMessageSid || '';
  const fromPhone = b.From || '';
  let text = (b.Body || '').trim();
  try {
    if (await alreadyProcessed(sid)) { return empty(res); }

    // Multiusuário: identifica de quem é esse número de WhatsApp.
    let uid = await resolveUserByPhone(fromPhone);
    if (!uid) {
      // Ainda não vinculado: talvez a mensagem seja o código de 6 dígitos do app.
      const handled = await tryLinkCode(res, fromPhone, text);
      if (handled) return;
      return reply(res, 'Seu WhatsApp ainda não está conectado a nenhuma conta Zentra.\n\nAbra o app Zentra → ⚙️ (engrenagem) → Conectar WhatsApp, gere um código e me manda aqui.');
    }

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
    const prompt = `Voce e o assistente do app Zentra, usado por varias pessoas diferentes, cada uma com seu proprio jeito de escrever. Hoje: ${today}. Quando o usuario pedir ACOES, responda APENAS com JSON, sem texto extra. Seja flexivel: as pessoas nao vao usar sempre as mesmas palavras dos exemplos abaixo — use bom senso pra entender a intencao, mesmo com erros de digitacao, abreviacoes, portunhol ou frases bem informais. Na duvida entre registrar algo ou nao fazer nada, prefira registrar (como tarefa, se nada mais especifico se encaixar).

Acoes possiveis:
- Adicionar tarefa / lembrete: {"action":"add_task","text":"...","cat":"brinta|cliente|pessoal|estudo","prio":"alta|media|baixa","due":"YYYY-MM-DD ou null"}
- Adicionar gasto/despesa (qualquer moeda: BRL, UYU, USD, ARS, EUR, PYG...): {"action":"add_gasto","descricao":"...","val":50,"cur":"BRL","cat":"Alimentacao"}
- Item de lista de compras (quando a pessoa fala "comprar X", "preciso de X", "falta X" sem ser uma tarefa de trabalho): {"action":"add_compra","nome":"...","qtd":1}
- Pagar uma conta ja cadastrada em Contas (quando a pessoa fala "pagar X", "paguei X"): {"action":"pay_bill","find":"nome da conta"}
- Treino/exercicio (aceita data e calorias se a pessoa mencionar; se nao disser a data, hoje): {"action":"add_treino","tipo":"musculacao|cardio|corrida|...","min":60,"cal":300,"data":"YYYY-MM-DD"}
- Peso: {"action":"add_peso","valor":"65.0","data":"YYYY-MM-DD opcional"}
- Editar tarefa existente: {"action":"edit_task","find":"palavras-chave da tarefa a corrigir","new_text":"texto correto","new_cat":"nova categoria opcional"}
- Deletar tarefa: {"action":"delete_task","find":"palavras-chave da tarefa"}

REGRAS DE CATEGORIA para tarefa: brinta (trabalho/empresa), cliente, pessoal, estudo; na duvida pessoal.

QUANDO USAR edit_task: sempre que o usuario disser algo como "corrigir", "errei", "o certo e", "mudar", "editar", "na verdade e", "queria dizer", "era", ou qualquer variacao com o mesmo sentido — significa editar uma tarefa ja existente, NAO criar uma nova. O campo "find" deve ter as palavras-chave para achar a tarefa, e "new_text" o texto correto.

QUANDO USAR delete_task: "deletar", "apagar", "remover", "nao precisa mais", "cancela", ou equivalente.

MULTIPLOS ITENS: Se o usuario listar varias coisas numa so mensagem (uma por linha ou separadas por virgula/e), responda um ARRAY JSON com uma entrada por item: [{...},{...}].

Ignore cabecalhos como "Trabalho-" ou "add". Para conversa/pergunta sem nenhuma acao clara, responda em texto normal.

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
      for (const a of actions) { try { const r = await execAction(a, uid); if (r) results.push(r); } catch (e) { results.push('Erro: ' + String(e).slice(0, 50)); } }
      let msg = results.length > 1 ? (results.length + ' itens:\n- ' + results.join('\n- ')) : (results[0] || 'Ok');
      return reply(res, msg + (numMedia > 0 ? '\n(audio: ' + text + ')' : ''));
    }
    return reply(res, content || ('Recebi: ' + text));
  } catch (e) {
    return reply(res, 'Erro ao processar: ' + String(e).slice(0, 100));
  }
}
