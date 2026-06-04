// Zentra — resumo diario enviado no WhatsApp (Twilio).
// Chamado por uma tarefa agendada (GET). Usa as env vars ja configuradas + ZENTRA_WA_TO.
const SUPA = 'https://raboikyezplxhxxropvf.supabase.co';
const WA_FROM = 'whatsapp:+14155238886'; // numero do sandbox Twilio

function H() { const k = process.env.SUPABASE_SERVICE_KEY; return { apikey: k, Authorization: 'Bearer ' + k }; }
async function q(path) {
    const r = await fetch(SUPA + '/rest/v1/' + path, { headers: H() });
    const j = await r.json().catch(() => []);
    return Array.isArray(j) ? j : [];
}
function ymd(d) { return d.toISOString().slice(0, 10); }
function br(s) { if (!s) return ''; const p = String(s).slice(0, 10).split('-'); return p[2] + '/' + p[1]; }

export default async function handler(req, res) {
    try {
        const uid = process.env.ZENTRA_USER_ID;
        const to = process.env.ZENTRA_WA_TO;
        if (!to) return res.status(500).json({ error: 'ZENTRA_WA_TO nao configurada' });
        const now = new Date();
        const today = ymd(now);
        const month = today.slice(0, 7);
        const uf = 'user_id=eq.' + uid;

        const [tasks, bills, gastos] = await Promise.all([
            q('tasks?select=text,prio,due,done&done=eq.false&' + uf),
            q('bills?select=name,val,cur,due,paid&paid=eq.false&' + uf),
            q('gastos?select=val,cur,data&data=gte.' + month + '-01&' + uf)
        ]);

        const pendentes = tasks.length;
        const urgentes = tasks.filter(t => t.prio === 'alta').length;
        const hoje = tasks.filter(t => t.due && String(t.due).slice(0, 10) === today);
        const atrasadas = tasks.filter(t => t.due && String(t.due).slice(0, 10) < today);
        const brlMes = gastos.filter(g => g.cur === 'BRL').reduce((s, g) => s + Number(g.val || 0), 0);
        const contas = bills.filter(b => b.due && String(b.due).slice(0, 10) <= ymd(new Date(now.getTime() + 7 * 864e5)))
                            .sort((a, b) => String(a.due).localeCompare(String(b.due)));

        const cap = (arr, n) => arr.slice(0, n);
        let m = '🌞 Bom dia, Gabi! Resumo Zentra (' + br(today) + ')\n\n';
        m += '📌 ' + urgentes + ' urgentes · ' + pendentes + ' pendentes · R$' + brlMes.toFixed(0) + ' gastos no mês\n';
        if (hoje.length) { m += '\n📅 Hoje (' + hoje.length + '):\n' + cap(hoje, 6).map(t => '• ' + t.text).join('\n') + '\n'; }
        if (atrasadas.length) { m += '\n⏰ Atrasadas (' + atrasadas.length + '):\n' + cap(atrasadas, 6).map(t => '• ' + t.text + ' (venceu ' + br(t.due) + ')').join('\n') + '\n'; }
        if (contas.length) { m += '\n💰 Contas a vencer (' + contas.length + '):\n' + cap(contas, 6).map(b => '• ' + b.name + ' ' + (b.cur || 'BRL') + ' ' + b.val + ' (vence ' + br(b.due) + ')').join('\n') + '\n'; }
        if (!hoje.length && !atrasadas.length && !contas.length) { m += '\nNada urgente pra hoje 🎉'; }

        // Envia via Twilio WhatsApp
        const sid = process.env.TWILIO_ACCOUNT_SID;
        const auth = 'Basic ' + Buffer.from(sid + ':' + process.env.TWILIO_AUTH_TOKEN).toString('base64');
        const body = new URLSearchParams({ From: WA_FROM, To: to, Body: m });
        const tw = await fetch('https://api.twilio.com/2010-04-01/Accounts/' + sid + '/Messages.json', {
            method: 'POST', headers: { Authorization: auth, 'Content-Type': 'application/x-www-form-urlencoded' }, body: body.toString()
        });
        const twj = await tw.json().catch(() => ({}));
        return res.status(200).json({ ok: tw.ok, twilio_status: twj.status || twj.code || tw.status, error: twj.message || null, preview: m });
    } catch (e) {
        return res.status(500).json({ error: String(e) });
    }
}
