const SUPA = 'https://raboikyezplxhxxropvf.supabase.co';
function H() { const k = process.env.SUPABASE_SERVICE_KEY; return { apikey: k, Authorization: 'Bearer ' + k, 'Content-Type': 'application/json' }; }
function reply(res, msg) {
  const safe = String(msg).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response><Message>' + safe + '</Message></Response>');
}
function empty(res) { res.setHeader('Content-Type', 'text/xml'); res.status(200).send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>'); }

// ===== Idiomas (pt / es) =====
const T = {
  pt: {
    notLinked: 'Seu WhatsApp ainda não está conectado a nenhuma conta Zentra.\n\nAbra o app Zentra → ⚙️ (engrenagem) → Conectar WhatsApp, gere um código e me mande aqui.',
    codeInvalid: 'Código inválido ou expirado. Gere um novo código no app Zentra (⚙️ → Conectar WhatsApp).',
    linkFail: 'Não consegui conectar seu WhatsApp agora. Tente de novo em instantes.',
    linked: '✅ WhatsApp conectado à sua conta Zentra! Agora é só mandar áudio ou texto pra registrar tarefas, gastos, compras, treinos...\n\nPara trocar o idioma, escreva "español" ou "português".',
    langSet: '✅ Pronto! Vou responder em português.',
    noUnderstand: 'Não consegui entender. Manda de novo?',
    error: 'Erro ao processar: ',
    task: 'Tarefa', gasto: 'Gasto', treino: 'Treino registrado', peso: 'Peso', compra: 'Lista de compras',
    billNew: 'Conta a pagar', billPaid: 'Conta paga', askBill: 'Qual conta você quer pagar?',
    billNotFound: (x) => 'Não achei uma conta chamada "' + x + '" em Contas. Criei um lembrete em tarefas.',
    taskNotFound: (x) => 'Não encontrei tarefa com "' + x + '"',
    askEdit: (x) => 'Qual é o texto correto para "' + x + '"?',
    corrected: 'Corrigido', removed: 'Removida', items: 'itens', audio: 'áudio', pay: 'Pagar',
    cats: { brinta: 'trabalho', cliente: 'cliente', pessoal: 'pessoal', estudo: 'estudo' },
    langName: 'portugues'
  },
  es: {
    notLinked: 'Tu WhatsApp todavía no está conectado a ninguna cuenta de Zentra.\n\nAbrí la app Zentra → ⚙️ (engranaje) → Conectar WhatsApp, generá un código y mandámelo acá.',
    codeInvalid: 'Código inválido o vencido. Generá un código nuevo en la app Zentra (⚙️ → Conectar WhatsApp).',
    linkFail: 'No pude conectar tu WhatsApp ahora. Probá de nuevo en un rato.',
    linked: '✅ ¡WhatsApp conectado a tu cuenta de Zentra! Ya podés mandar audios o textos para registrar tareas, gastos, compras, entrenamientos...\n\nPara cambiar el idioma, escribí "español" o "português".',
    langSet: '✅ ¡Listo! Te voy a responder en español.',
    noUnderstand: 'No te entendí. ¿Me lo mandás de nuevo?',
    error: 'Error al procesar: ',
    task: 'Tarea', gasto: 'Gasto', treino: 'Entrenamiento registrado', peso: 'Peso', compra: 'Lista de compras',
    billNew: 'Cuenta por pagar', billPaid: 'Cuenta pagada', askBill: '¿Qué cuenta querés pagar?',
    billNotFound: (x) => 'No encontré una cuenta llamada "' + x + '" en Cuentas. Te creé un recordatorio en tareas.',
    taskNotFound: (x) => 'No encontré ninguna tarea con "' + x + '"',
    askEdit: (x) => '¿Cuál es el texto correcto para "' + x + '"?',
    corrected: 'Corregido', removed: 'Eliminada', items: 'ítems', audio: 'audio', pay: 'Pagar',
    cats: { brinta: 'trabajo', cliente: 'cliente', pessoal: 'personal', estudo: 'estudio' },
    langName: 'espanhol (rioplatense, usando "vos")'
  }
};
const NOT_LINKED_BOTH = T.es.notLinked + '\n\n— — —\n\n' + T.pt.notLinked;

// Detecta idioma pelo texto quando a pessoa ainda não escolheu (heurística simples).
function detectLang(text) {
  const t = ' ' + String(text || '').toLowerCase() + ' ';
  let es = 0, pt = 0;
  if (/[ñ¿¡]/.test(t)) es += 3;
  if (/[ãõç]/.test(t)) pt += 3;
  ['gasté', 'compré', 'pagué', 'entrené', ' hoy ', 'mañana', ' el ', ' los ', ' las ', ' una ', ' y ', ' pesos ', ' súper', ' para el ', ' qué ', 'cuánto', ' tengo ', ' necesito ', ' reunión', 'viernes', 'sábado', 'miércoles', 'jueves'].forEach(w => { if (t.includes(w)) es++; });
  ['gastei', 'comprei', 'paguei', 'treinei', ' hoje ', 'amanhã', ' o ', ' os ', ' uma ', ' e ', ' reais ', ' com ', ' pra ', ' você', ' quanto ', ' tenho ', ' preciso ', ' reunião', 'sexta', 'sábado', 'quarta', 'quinta', ' não '].forEach(w => { if (t.includes(w)) pt++; });
  return es > pt ? 'es' : 'pt';
}
// Comando explícito de idioma: "español", "idioma español", "português", "portugues"...
function langCommand(text) {
  const t = String(text || '').toLowerCase().trim().replace(/[.!]/g, '');
  if (/^(idioma |língua |lingua |language )?(español|espanol|espanhol|spanish|castellano)$/.test(t)) return 'es';
  if (/^(idioma |língua |lingua |language )?(português|portugues|portuguese|portugués)$/.test(t)) return 'pt';
  return null;
}

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
  const m = { trabalho: 'brinta', trabajo: 'brinta', work: 'brinta', empresa: 'brinta', produto: 'brinta', clientes: 'cliente', compras: 'pessoal', mercado: 'pessoal', casa: 'pessoal', familia: 'pessoal', saude: 'pessoal', salud: 'pessoal', personal: 'pessoal', vida: 'pessoal', estudos: 'estudo', estudio: 'estudo', estudar: 'estudo', estudiar: 'estudo', faculdade: 'estudo', facultad: 'estudo', curso: 'estudo' };
  return m[c] || 'pessoal';
}

// ===== Multiusuário: resolve o numero de WhatsApp remetente para um usuário do Zentra =====
async function resolveLink(fromPhone) {
  if (!fromPhone) return null;
  const r = await fetch(SUPA + '/rest/v1/whatsapp_links?phone=eq.' + encodeURIComponent(fromPhone) + '&select=user_id,lang', { headers: H() });
  if (!r.ok) return null;
  const rows = await r.json();
  return (Array.isArray(rows) && rows[0] && rows[0].user_id) ? rows[0] : null;
}
async function setLinkLang(fromPhone, lang) {
  await fetch(SUPA + '/rest/v1/whatsapp_links?phone=eq.' + encodeURIComponent(fromPhone), { method: 'PATCH', headers: Object.assign(H(), { Prefer: 'return=minimal' }), body: JSON.stringify({ lang: lang }) });
}

// Tenta tratar a mensagem como um código de vínculo (6 dígitos gerado no app).
// Retorna true se a mensagem era um código (vinculado ou não) e já respondeu.
async function tryLinkCode(res, fromPhone, text) {
  const code = String(text || '').trim();
  if (!/^\d{6}$/.test(code)) return false;
  const r = await fetch(SUPA + '/rest/v1/whatsapp_link_codes?code=eq.' + code + '&expires_at=gt.' + new Date().toISOString() + '&select=user_id,code,lang', { headers: H() });
  const rows = await r.json().catch(() => []);
  if (!Array.isArray(rows) || !rows[0]) {
    reply(res, T.es.codeInvalid + '\n\n' + T.pt.codeInvalid);
    return true;
  }
  const uid = rows[0].user_id;
  const lang = rows[0].lang === 'es' || rows[0].lang === 'pt' ? rows[0].lang : null;
  const L = T[lang || 'pt'];
  const link = await fetch(SUPA + '/rest/v1/whatsapp_links?on_conflict=phone', { method: 'POST', headers: Object.assign(H(), { Prefer: 'return=minimal,resolution=merge-duplicates' }), body: JSON.stringify({ user_id: uid, phone: fromPhone, lang: lang }) });
  if (!link.ok) { reply(res, L.linkFail); return true; }
  await fetch(SUPA + '/rest/v1/whatsapp_link_codes?code=eq.' + code, { method: 'DELETE', headers: H() });
  reply(res, L.linked);
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
  return findBest(await r.json(), 'text', findText);
}
async function findBill(uid, findText) {
  const r = await fetch(SUPA + '/rest/v1/bills?user_id=eq.' + uid + '&paid=eq.false&select=id,name,val,cur', { headers: H() });
  return findBest(await r.json(), 'name', findText);
}
async function execAction(p, uid, L) {
  const today = new Date().toISOString().slice(0, 10);
  if (p.action === 'add_task') {
    const cat = normCat(p.cat);
    await insert('tasks', { text: p.text, cat: cat, prio: p.prio || 'media', due: p.due || null, done: false }, uid);
    return L.task + ' (' + (L.cats[cat] || cat) + '): ' + p.text;
  }
  if (p.action === 'add_gasto') {
    await insert('gastos', { descricao: p.descricao, val: p.val, cur: p.cur || 'BRL', cat: p.cat || 'Outro', banco: p.banco || null, data: p.data || today }, uid);
    return L.gasto + ': ' + p.descricao + ' ' + p.val + ' ' + (p.cur || 'BRL');
  }
  if (p.action === 'add_treino') {
    const notasParts = [];
    if (p.min) notasParts.push(p.min + 'min');
    if (p.cal) notasParts.push(p.cal + 'cal');
    await insert('registros', { tipo: 'academia', valor: p.tipo || 'musculacao', notas: notasParts.join(', '), data: p.data || today }, uid);
    return L.treino + (p.data && p.data !== today ? ' (' + p.data + ')' : '');
  }
  if (p.action === 'add_peso') {
    await insert('registros', { tipo: 'peso', valor: String(p.valor), data: p.data || today }, uid);
    return L.peso + ': ' + p.valor + ' kg';
  }
  if (p.action === 'add_compra') {
    if (!p.nome) return null;
    await insert('compras', { nome: p.nome, qtd: p.qtd || 1, preco: p.preco || null, done: false }, uid);
    return L.compra + ': ' + p.nome + (p.qtd && p.qtd > 1 ? ' (x' + p.qtd + ')' : '');
  }
  if (p.action === 'add_conta') {
    if (!p.name) return null;
    await insert('bills', { name: p.name, val: Number(p.val) || 0, cur: p.cur || 'BRL', due: p.due || null, paid: false }, uid);
    return L.billNew + ': ' + p.name + ' ' + (p.cur || 'BRL') + ' ' + (p.val || '');
  }
  if (p.action === 'pay_bill') {
    if (!p.find) return L.askBill;
    const bill = await findBill(uid, p.find);
    if (!bill) {
      await insert('tasks', { text: L.pay + ': ' + p.find, cat: 'pessoal', prio: 'media', due: null, done: false }, uid);
      return L.billNotFound(p.find);
    }
    await fetch(SUPA + '/rest/v1/bills?id=eq.' + bill.id + '&user_id=eq.' + uid, { method: 'PATCH', headers: Object.assign(H(), { Prefer: 'return=minimal' }), body: JSON.stringify({ paid: true, paid_at: new Date().toISOString() }) });
    return L.billPaid + ': ' + bill.name + ' ' + (bill.cur || 'BRL') + ' ' + bill.val;
  }
  if (p.action === 'edit_task') {
    const task = await findTask(uid, p.find);
    if (!task) return L.taskNotFound(p.find);
    const updates = {};
    if (p.new_text) updates.text = p.new_text;
    if (p.new_cat) updates.cat = normCat(p.new_cat);
    if (!Object.keys(updates).length) return L.askEdit(task.text);
    await fetch(SUPA + '/rest/v1/tasks?id=eq.' + task.id + '&user_id=eq.' + uid, { method: 'PATCH', headers: Object.assign(H(), { Prefer: 'return=minimal' }), body: JSON.stringify(updates) });
    return L.corrected + ': "' + task.text + '" → "' + (p.new_text || task.text) + '"';
  }
  if (p.action === 'delete_task') {
    const task = await findTask(uid, p.find);
    if (!task) return L.taskNotFound(p.find);
    await fetch(SUPA + '/rest/v1/tasks?id=eq.' + task.id + '&user_id=eq.' + uid, { method: 'DELETE', headers: H() });
    return L.removed + ': "' + task.text + '"';
  }
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') { res.status(200).send('Zentra WhatsApp webhook ok'); return; }
  const b = req.body || {};
  const sid = b.MessageSid || b.SmsSid || b.SmsMessageSid || '';
  const fromPhone = b.From || '';
  let text = (b.Body || '').trim();
  let L = T.pt;
  try {
    if (await alreadyProcessed(sid)) { return empty(res); }

    // Multiusuário: identifica de quem é esse número de WhatsApp.
    const link = await resolveLink(fromPhone);
    if (!link) {
      const handled = await tryLinkCode(res, fromPhone, text);
      if (handled) return;
      return reply(res, NOT_LINKED_BOTH);
    }
    const uid = link.user_id;

    // A pessoa escolheu o idioma explicitamente?
    const cmd = langCommand(text);
    if (cmd) { await setLinkLang(fromPhone, cmd); return reply(res, T[cmd].langSet); }

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
      const cmd2 = langCommand(text);
      if (cmd2) { await setLinkLang(fromPhone, cmd2); return reply(res, T[cmd2].langSet); }
    }

    // Idioma: o escolhido pela pessoa; se ainda não escolheu, detecta pela mensagem.
    const lang = (link.lang === 'es' || link.lang === 'pt') ? link.lang : detectLang(text);
    L = T[lang];

    if (!text) return reply(res, L.noUnderstand);
    const today = new Date().toISOString().slice(0, 10);
    const prompt = `Voce e o assistente do app Zentra, usado por varias pessoas diferentes, cada uma com seu proprio jeito de escrever (em portugues ou espanhol). Hoje: ${today}. Quando o usuario pedir ACOES, responda APENAS com JSON, sem texto extra. Seja flexivel: as pessoas nao vao usar sempre as mesmas palavras dos exemplos abaixo — use bom senso pra entender a intencao, mesmo com erros de digitacao, abreviacoes, portunhol ou frases bem informais. Na duvida entre registrar algo ou nao fazer nada, prefira registrar (como tarefa, se nada mais especifico se encaixar). Mantenha os textos registrados (nome da tarefa, descricao do gasto, item de compra) no idioma original do usuario.

Acoes possiveis:
- Adicionar tarefa / lembrete: {"action":"add_task","text":"...","cat":"brinta|cliente|pessoal|estudo","prio":"alta|media|baixa","due":"YYYY-MM-DD ou null"}
- Adicionar gasto/despesa (qualquer moeda: BRL, UYU, USD, ARS, EUR, PYG...; "$" ou "pesos" sem pais = UYU; "R$"/"reais" = BRL; "US$"/"dolares" = USD) — SO para gasto ja feito ("gastei", "gasté", "paguei", "pagué", "compré"): {"action":"add_gasto","descricao":"...","val":50,"cur":"BRL","cat":"Alimentacao","data":"YYYY-MM-DD opcional"}
- Item de lista de compras (quando a pessoa fala "comprar X", "preciso de X", "falta X", "necesito X" sem ser uma tarefa de trabalho): {"action":"add_compra","nome":"...","qtd":1}
- Conta A PAGAR, ainda nao paga ("me falta pagar X 2143", "tengo que pagar", "tenho que pagar", "vence dia 10"), COM valor: {"action":"add_conta","name":"...","val":2143,"cur":"UYU","due":"YYYY-MM-DD ou null"}
- Marcar como paga uma conta ja cadastrada em Contas (quando a pessoa diz que JA pagou uma conta existente: "paguei a luz", "pagué UTE", ou "pagar X" sem valor): {"action":"pay_bill","find":"nome da conta"}
- Treino/exercicio (aceita data e calorias se a pessoa mencionar; se nao disser a data, hoje): {"action":"add_treino","tipo":"musculacao|cardio|corrida|...","min":60,"cal":300,"data":"YYYY-MM-DD"}
- Peso: {"action":"add_peso","valor":"65.0","data":"YYYY-MM-DD opcional"}
- Editar tarefa existente: {"action":"edit_task","find":"palavras-chave da tarefa a corrigir","new_text":"texto correto","new_cat":"nova categoria opcional"}
- Deletar tarefa: {"action":"delete_task","find":"palavras-chave da tarefa"}

REGRAS DE CATEGORIA para tarefa: brinta (qualquer coisa de trabalho/empresa), cliente, pessoal, estudo; na duvida pessoal.

QUANDO USAR edit_task: quando o usuario disser algo como "corrigir", "corregir", "errei", "me equivoqué", "o certo e", "mudar", "cambiar", "editar", "na verdade e", "queria dizer", "era", ou qualquer variacao com o mesmo sentido — significa editar uma tarefa ja existente, NAO criar uma nova.

QUANDO USAR delete_task: "deletar", "apagar", "borrar", "remover", "eliminar", "nao precisa mais", "ya no hace falta", "cancela", ou equivalente.

MULTIPLOS ITENS: Se o usuario listar varias coisas numa so mensagem (uma por linha ou separadas por virgula/e/y), responda um ARRAY JSON com uma entrada por item: [{...},{...}].

Ignore cabecalhos como "Trabalho-" ou "add". Para conversa/pergunta sem nenhuma acao clara, responda em texto normal, curto e amigavel, SEMPRE em ${L.langName}.

Usuario: ${text}`;

    const lr = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + process.env.GROQ_API_KEY }, body: JSON.stringify({ model: process.env.GROQ_MODEL || 'openai/gpt-oss-120b', messages: [{ role: 'user', content: prompt }], max_completion_tokens: 2000, temperature: 0.2, reasoning_effort: 'low', include_reasoning: false }) });
    const ld = await lr.json();
    const content = (ld && ld.choices && ld.choices[0] && ld.choices[0].message && ld.choices[0].message.content || '').trim();
    const cleaned = content.replace(/```json|```/g, '').trim();
    let actions = [];
    try { const j = JSON.parse(cleaned); if (Array.isArray(j)) actions = j.filter(function (x) { return x && x.action; }); else if (j && j.action) actions = [j]; } catch (e) {}
    if (!actions.length) { const ms = cleaned.match(/\{[\s\S]*?\}/g); if (ms) { ms.forEach(function (m) { try { const o = JSON.parse(m); if (o && o.action) actions.push(o); } catch (e) {} }); } }
    if (actions.length) {
      const results = [];
      for (const a of actions) { try { const r = await execAction(a, uid, L); if (r) results.push(r); } catch (e) { results.push(L.error + String(e).slice(0, 50)); } }
      const msg = results.length > 1 ? (results.length + ' ' + L.items + ':\n- ' + results.join('\n- ')) : (results[0] || 'Ok');
      return reply(res, msg + (numMedia > 0 ? '\n(' + L.audio + ': ' + text + ')' : ''));
    }
    return reply(res, content || L.noUnderstand);
  } catch (e) {
    return reply(res, L.error + String(e).slice(0, 100));
  }
}
