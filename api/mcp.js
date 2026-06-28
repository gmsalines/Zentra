// Zentra MCP Server — Vercel Serverless Function
// Endpoint: https://zentra-jet.vercel.app/api/mcp
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';

// ── Supabase client ───────────────────────────────────────────────────────────
const SUPA_URL = 'https://raboikyezplxhxxropvf.supabase.co';
const SUPA_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYm9pa3llenBseGh4eHJvcHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTQyNjIsImV4cCI6MjA5NTA5MDI2Mn0.7IID_hKsYXge6PK7n2JX0F10dVDMtbLJ068mWkH6Kpw';

const H = {
  apikey: SUPA_KEY,
  Authorization: `Bearer ${SUPA_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
};

async function db(table, method, filter, body) {
  let url = `${SUPA_URL}/rest/v1/${table}`;
  if (filter) url += `?${filter}`;
  const res = await fetch(url, { method, headers: H, ...(body ? { body: JSON.stringify(body) } : {}) });
  if (res.status === 204) return [];
  const text = await res.text();
  if (!res.ok) throw new Error(`DB error ${res.status}: ${text}`);
  try { return JSON.parse(text); } catch { return text; }
}

const today = () => new Date().toISOString().slice(0, 10);
const thisMonth = () => new Date().toISOString().slice(0, 7);
const lastDay = (ym) => { const [y, m] = ym.split('-').map(Number); return new Date(y, m, 0).toISOString().slice(0, 10); };

// ── Build server (singleton per warm instance) ────────────────────────────────
function buildServer() {
  const server = new McpServer({ name: 'zentra-mcp-server', version: '1.0.0' });

  // ─── TASKS ─────────────────────────────────────────────────────────────────
  server.registerTool('zentra_list_tasks', {
    title: 'List Tasks',
    description: 'Lista tarefas da Gabi. Categorias: brinta (trabalho), pessoal, estudo, cliente. Prioridade: alta, media, baixa.',
    inputSchema: z.object({
      cat: z.enum(['brinta', 'pessoal', 'estudo', 'all']).default('all').describe('Categoria'),
      prio: z.enum(['alta', 'media', 'baixa', 'all']).default('all').describe('Prioridade'),
      done: z.boolean().optional().describe('Status. Omitir = todas'),
      overdue: z.boolean().default(false).describe('Apenas atrasadas'),
      limit: z.number().int().min(1).max(50).default(20),
    }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ cat, prio, done, overdue, limit }) => {
    const f = ['select=*', `order=prio.asc,due.asc.nullslast`, `limit=${limit}`];
    if (cat !== 'all') f.push(`cat=eq.${cat}`);
    if (prio !== 'all') f.push(`prio=eq.${prio}`);
    if (done !== undefined) f.push(`done=eq.${done}`);
    if (overdue) f.push(`due=lt.${today()}`, 'done=eq.false');
    const tasks = await db('tasks', 'GET', f.join('&'));
    if (!tasks.length) return { content: [{ type: 'text', text: 'Nenhuma tarefa encontrada.' }] };
    const pe = { alta: '🔴', media: '🟡', baixa: '🟢' };
    const lines = tasks.map(t =>
      `${t.done ? '✅' : '⬜'} ${pe[t.prio] || '⚪'} [${t.cat}] ${t.text}${t.due ? ` · ${t.due}` : ''}${t.notes ? ` · ${t.notes}` : ''} (id:${t.id})`
    );
    return { content: [{ type: 'text', text: `📋 ${tasks.length} tarefa(s):\n\n${lines.join('\n')}` }] };
  });

  server.registerTool('zentra_add_task', {
    title: 'Add Task',
    description: 'Cria uma nova tarefa. Categorias: brinta, pessoal, estudo.',
    inputSchema: z.object({
      text: z.string().min(2).max(500).describe('Descrição da tarefa'),
      cat: z.enum(['brinta', 'pessoal', 'estudo']).describe('Categoria'),
      prio: z.enum(['alta', 'media', 'baixa']).default('media').describe('Prioridade'),
      due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().describe('Prazo YYYY-MM-DD'),
      notes: z.string().max(500).optional().describe('Notas'),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ text, cat, prio, due, notes }) => {
    const result = await db('tasks', 'POST', undefined, { text, cat, prio, due: due ?? null, notes: notes ?? null, done: false });
    const t = Array.isArray(result) ? result[0] : result;
    return { content: [{ type: 'text', text: `✅ Tarefa criada: "${text}" [${cat}/${prio}]${due ? ` para ${due}` : ''}\nID: ${t?.id ?? 'ok'}` }] };
  });

  server.registerTool('zentra_complete_task', {
    title: 'Complete Task',
    description: 'Marca tarefa como concluída. Use zentra_list_tasks para obter o ID.',
    inputSchema: z.object({
      id: z.string().uuid().describe('ID da tarefa'),
      done: z.boolean().default(true).describe('true = concluir, false = reabrir'),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ id, done }) => {
    await db('tasks', 'PATCH', `id=eq.${id}`, { done, completed_at: done ? new Date().toISOString() : null });
    return { content: [{ type: 'text', text: done ? '✅ Tarefa concluída!' : '↩️ Tarefa reaberta.' }] };
  });

  server.registerTool('zentra_update_task', {
    title: 'Update Task',
    description: 'Atualiza campos de uma tarefa. Só passa os campos que quer mudar.',
    inputSchema: z.object({
      id: z.string().uuid(),
      text: z.string().min(2).max(500).optional(),
      prio: z.enum(['alta', 'media', 'baixa']).optional(),
      due: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
      notes: z.string().max(500).nullable().optional(),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ id, ...fields }) => {
    const updates = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (!Object.keys(updates).length) return { content: [{ type: 'text', text: 'Nenhum campo para atualizar.' }] };
    await db('tasks', 'PATCH', `id=eq.${id}`, { ...updates, updated_at: new Date().toISOString() });
    return { content: [{ type: 'text', text: `✏️ Tarefa atualizada.` }] };
  });

  // ─── FINANCES ──────────────────────────────────────────────────────────────
  server.registerTool('zentra_add_expense', {
    title: 'Add Expense',
    description: 'Registra um gasto. Bancos: Nubank (BRL), Itaú (UYU). Categorias: Alimentação, Transporte, Academia, Saúde, Lazer, Estudo, Casa, Outro.',
    inputSchema: z.object({
      descricao: z.string().min(2).max(200),
      val: z.number().positive(),
      cur: z.enum(['BRL', 'UYU', 'USD']),
      cat: z.enum(['Alimentação', 'Transporte', 'Academia', 'Saúde', 'Lazer', 'Estudo', 'Casa', 'Outro']),
      banco: z.enum(['Nubank', 'Itaú', 'Inter', 'C6', 'Outro']).optional(),
      data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ descricao, val, cur, cat, banco, data }) => {
    await db('gastos', 'POST', undefined, { descricao, val, cur, cat, banco: banco ?? null, data: data ?? today() });
    return { content: [{ type: 'text', text: `💸 Gasto registrado: ${descricao} — ${cur} ${val.toFixed(2)} [${cat}]` }] };
  });

  server.registerTool('zentra_financial_summary', {
    title: 'Financial Summary',
    description: 'Resumo financeiro do mês: gastos por categoria, contas pendentes, totais por moeda.',
    inputSchema: z.object({
      month: z.string().regex(/^\d{4}-\d{2}$/).optional().describe('Mês YYYY-MM (padrão: mês atual)'),
      usd_rate: z.number().positive().default(5.70),
      uyu_rate: z.number().positive().default(0.14),
    }).strict(),
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ month, usd_rate, uyu_rate }) => {
    const m = month ?? thisMonth();
    const [gastos, bills] = await Promise.all([
      db('gastos', 'GET', `select=*&data=gte.${m}-01&data=lte.${lastDay(m)}`),
      db('bills', 'GET', 'select=*&paid=eq.false&order=due.asc'),
    ]);
    const byCur = {}, byCat = {};
    let totalBRL = 0;
    gastos.forEach(g => {
      const v = Number(g.val);
      byCur[g.cur] = (byCur[g.cur] ?? 0) + v;
      const brl = g.cur === 'BRL' ? v : g.cur === 'USD' ? v * usd_rate : v * uyu_rate;
      byCat[g.cat] = (byCat[g.cat] ?? 0) + brl;
      totalBRL += brl;
    });
    const curStr = Object.entries(byCur).map(([c, v]) => `${c} ${v.toFixed(2)}`).join(' · ');
    const catStr = Object.entries(byCat).sort((a, b) => b[1] - a[1]).map(([c, v]) => `  ${c}: R$ ${v.toFixed(0)}`).join('\n');
    const billsStr = bills.length ? bills.slice(0, 5).map(b => `  • ${b.name} — ${b.cur} ${b.val}${b.due ? ` (vence ${b.due})` : ''}`).join('\n') : '  Nenhuma pendente 🎉';
    return { content: [{ type: 'text', text: `📊 Resumo ${m}\n\n💸 ${curStr} · Total R$ ${totalBRL.toFixed(0)}\n\nPor categoria:\n${catStr || '  Sem dados'}\n\n📋 Contas:\n${billsStr}` }] };
  });

  server.registerTool('zentra_pay_bill', {
    title: 'Pay Bill',
    description: 'Marca conta como paga. Use zentra_financial_summary para ver contas pendentes.',
    inputSchema: z.object({
      id: z.string().uuid(),
      paid: z.boolean().default(true),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  }, async ({ id, paid }) => {
    await db('bills', 'PATCH', `id=eq.${id}`, { paid, paid_at: paid ? new Date().toISOString() : null });
    return { content: [{ type: 'text', text: paid ? '✅ Conta paga!' : '↩️ Pagamento desfeito.' }] };
  });

  // ─── HEALTH ────────────────────────────────────────────────────────────────
  server.registerTool('zentra_log_health', {
    title: 'Log Health',
    description: 'Registra dado de saúde. Tipos: peso (kg), agua (ml), sono (horas), treino (min), proteina (g). Meta proteína: 120g/dia. Medicamento semanal: Monjaro.',
    inputSchema: z.object({
      tipo: z.enum(['peso', 'agua', 'sono', 'treino', 'proteina', 'kcal', 'humor']),
      valor: z.number().positive(),
      data: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      notas: z.string().max(200).optional(),
    }).strict(),
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  }, async ({ tipo, valor, data, notas }) => {
    await db('registros', 'POST', undefined, { tipo, valor, data: data ?? today(), notas: notas ?? null });
    const units = { peso: 'kg', agua: 'ml', sono: 'h', treino: 'min', proteina: 'g', kcal: 'kcal', humor: '/10' };
    return { content: [{ type: 'text', text: `💚 ${tipo}: ${valor}${units[tipo] ?? ''} registrado!` }] };
  });

  return server;
}

let _server = null;
function getServer() {
  if (!_server) _server = buildServer();
  return _server;
}

// ── Vercel handler ────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // CORS para Claude.ai e ChatGPT
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') { res.status(200).end(); return; }
  if (req.method === 'GET') { res.json({ name: 'zentra-mcp-server', status: 'ok', version: '1.0.0' }); return; }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return; }

  try {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });

    res.on('close', () => transport.close());

    const server = getServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error('MCP error:', err);
    if (!res.headersSent) res.status(500).json({ error: String(err) });
  }
}
