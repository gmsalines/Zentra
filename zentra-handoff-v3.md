# Zentra — Project Handoff v3

## Conceito
Hub de produtividade pessoal da Gabi. Tarefas, finanças, saúde e chat com IA.
Inspirado na Cinderela — destino que já estava escrito, vida que muda como mágica.
**Tagline:** "Your missing wand."

---

## Infraestrutura

**Supabase:**
- URL: `https://raboikyezplxhxxropvf.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYm9pa3llenBseGh4eHJvcHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTQyNjIsImV4cCI6MjA5NTA5MDI2Mn0.7IID_hKsYXge6PK7n2JX0F10dVDMtbLJ068mWkH6Kpw`

**Vercel + GitHub:**
- URL: `https://zentra-jet.vercel.app`
- Repo: `https://github.com/gmsalines/Zentra`
- Deploy: automático ao subir novo `index.html` no GitHub (branch main)

**Groq (chat IA):**
- Key: `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`
- Modelo: `llama-3.3-70b-versatile`

---

## Identidade Visual

**Paleta azul meia-noite:**
- Fundo: `#0A0E1A` | Surface: `#0F1422` | Surface2: `#060A12`
- Azul: `#6A8FD4` | Azul claro: `#A8C4F0` | Creme: `#E8EEF8`
- Água: `#7AB8E8` | Rosa: `#E87AB8` | Red: `#E85A6A`

**Nav emojis Cinderela:** 🕛 Início · 🎠 Trabalho · 👠 Pessoal · 👛 Finanças · ✨ Saúde

**Chat IA:** botão ✨ flutuante, painel tipo WhatsApp

---

## Banco de Dados

```sql
tasks (id, text, cat, prio, due, done, created_at, completed_at, notes, updated_at)
bills (id, name, val, cur, due, paid, created_at, banco, forma_pagamento, paid_at)
gastos (id, descricao, val, cur, cat, data, created_at, banco)
registros (id, tipo, valor, data, notas, created_at)
task_logs (id, task_id, note, created_at)
```

**Categorias tasks:** `brinta`, `pessoal`, `estudo`
⚠️ Categoria `cliente` ainda existe no DB mas display vai em Pessoal com filtro "Clientes"

---

## localStorage (por dispositivo)

| Chave | Conteúdo |
|-------|----------|
| `zentra-acum` | Dias acumulados academia |
| `zentra-smeta` | Metas saúde (peso, sono, agua, kcal, treino) |
| `zentra-hab` | Lista de hábitos |
| `zentra-hab-YYYY-MM-DD` | Check diário hábitos |
| `zentra-metas` | Metas pessoais |
| `zentra-horas` | Horas trabalhadas |
| `zentra-meds` | Medicamentos |
| `zentra-taxas` | Taxas USD/UYU→BRL |
| `zentra-orc` | Orçamentos por categoria |
| `zentra-comp` | Lista de compras |
| `zentra-div` | Dívidas |
| `zentra-pomo-YYYY-MM-DD` | Ciclos pomodoro |
| `zentra-agua-YYYY-MM-DD` | ml água do dia |

---

## Como Claude atualiza o Supabase diretamente

```python
import urllib.request, json

KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYm9pa3llenBseGh4eHJvcHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTQyNjIsImV4cCI6MjA5NTA5MDI2Mn0.7IID_hKsYXge6PK7n2JX0F10dVDMtbLJ068mWkH6Kpw"
BASE = "https://raboikyezplxhxxropvf.supabase.co/rest/v1"
H = {"apikey": KEY, "Authorization": f"Bearer {KEY}", "Content-Type": "application/json", "Prefer": "return=minimal"}

# Adicionar tarefa
data = json.dumps({"text":"...", "cat":"brinta|pessoal|estudo", "prio":"alta|media|baixa", "due":"2026-05-30", "done":False}).encode()
urllib.request.urlopen(urllib.request.Request(BASE+"/tasks", data=data, headers=H, method="POST"))

# Marcar como feita
data = json.dumps({"done":True, "completed_at": "2026-05-24T10:00:00Z"}).encode()
urllib.request.urlopen(urllib.request.Request(BASE+"/tasks?id=eq.ID", data=data, headers=H, method="PATCH"))
```

---

## Como atualizar o app

1. Baixa o `index.html` atual do GitHub
2. Sobe aqui para Claude modificar
3. Baixa o novo `index.html`
4. Substitui no GitHub → Vercel atualiza automaticamente

---

## Estado atual do app (v3)

### ✅ Implementado
- 5 abas com tema Cinderela
- Tarefas com prioridade, prazo, notas, editar (✏️), deletar
- Filtro Clientes na aba Pessoal
- Hábitos movidos para Saúde
- Histórico de tarefas por mês
- Finanças: contas, gastos, orçamento, compras, dívidas
- Multi-moeda BRL/UYU/USD com taxas configuráveis
- Saúde: peso, treino, alimentação, sono, água (ml), medicamentos, hábitos
- Pomodoro 25/5 e 50/10
- Registro de horas trabalhadas
- Metas pessoais
- Chat ✨ com Groq (linguagem natural → ações no app)
- Deploy automático GitHub → Vercel

### ⚠️ Problemas conhecidos
- Lista de compras no localStorage (não sincroniza entre dispositivos)
- Chat pode não interpretar comandos muito complexos

---

## Próximos Passos

**Fase 2 — esta semana:**
- [ ] Migrar lista de compras para Supabase
- [ ] Editar gastos e contas existentes
- [ ] Orçamento com % real de gastos por categoria
- [ ] Gráficos de resumo financeiro

**Fase 3 — fim de semana:**
- [ ] Login multi-usuário (Supabase Auth)
- [ ] Compartilhar com beta testers
- [ ] Google Calendar integration
- [ ] Notificações WhatsApp via Make.com

**Fase 4 — produto:**
- [ ] 3 idiomas (PT, ES, EN)
- [ ] Taxa de câmbio automática via API
- [ ] Seções personalizadas (livros, restaurantes, etc.)
- [ ] App nativo iOS + Apple Health (U$99/ano Apple Developer)

---

## Contexto da Gabi

- Mora no Uruguai, mudança para SP em julho/2026
- Trabalha 8:30–18:30, academia após o trabalho (57 dias acumulados)
- Mestrado em IA — módulos 5–8 + TMF pendente
- Clientes pessoais: Fernando, Eduardo, Marcia, Hanna, Florencia
- BRINTA tasks: Arba, Control Efinanceiras, Municipalidad de Córdoba, VEPS, Validacion transacciones, ISS Dlocal, Activo fijo Naranja, Certificados digitales, ISS Recarga, Skill notas exterior, Guia caju, DIMP nova versão, Gravação sem aparecer, Rappi SIRTAC
- Contas: Nubank BR + Itaú UY
- Monjaro (aplicação semanal)
- Meta proteína: 120g/dia
