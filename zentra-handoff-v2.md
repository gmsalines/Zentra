# Zentra — Project Handoff v2

## Conceito
App de produtividade pessoal construído para Gabi. Hub central que combina tarefas, finanças e saúde. Inspirado na Cinderela — destino que já estava escrito, vida que muda como mágica.

**Tagline:** "Your missing wand."

---

## Infraestrutura

**Supabase (banco de dados):**
- Project URL: `https://raboikyezplxhxxropvf.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYm9pa3llenBseGh4eHJvcHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTQyNjIsImV4cCI6MjA5NTA5MDI2Mn0.7IID_hKsYXge6PK7n2JX0F10dVDMtbLJ068mWkH6Kpw`

**Vercel (hospedagem):**
- URL: `https://zentra-jet.vercel.app`
- Repositório GitHub: `https://github.com/gmsalines/Zentra`
- Deploy: automático ao subir novo `index.html` no GitHub (branch main)

---

## Identidade Visual

**Paleta (azul meia-noite):**
- Fundo: `#0A0E1A`
- Surface: `#060A12`
- Azul principal: `#6A8FD4`
- Azul claro: `#A8C4F0`
- Creme: `#E8EEF8`
- Musgo/água: `#7AB8E8`
- Terra/proteína: `#E87AB8`

**Tipografia:** -apple-system + Georgia serif

**Logo:** Relógio horizontal meia-noite (ponteiros para cima, faísca dourada) + ZENTRA em Georgia — aparece no header

**Nav emojis Cinderela:**
- 🕛 Início
- 🎠 Trabalho
- 👠 Pessoal
- 👛 Finanças
- ✨ Saúde

---

## Banco de Dados — Tabelas

```sql
tasks (id, text, cat, prio, due, done, created_at, completed_at, notes, updated_at)
bills (id, name, val, cur, due, paid, created_at, banco, forma_pagamento, paid_at)
gastos (id, descricao, val, cur, cat, data, created_at, banco)
registros (id, tipo, valor, data, notas, created_at, banco)
task_logs (id, task_id, note, created_at)
```

**Categorias tasks:** `brinta`, `cliente`, `pessoal`, `estudo`

**Tipos registros:**
- `peso` — valor=kg, data
- `academia` — valor=tipo treino, notas=parte do corpo · min · kcal, data
- `alimentacao` — valor=kcal, notas=descrição refeição, banco=proteína g, data
- `sono` — valor=horas, data
- `meta` — via localStorage

---

## Como Claude atualiza o app diretamente

```bash
# Adicionar tarefa
curl -X POST "https://raboikyezplxhxxropvf.supabase.co/rest/v1/tasks" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"text":"Nome da tarefa","cat":"brinta","prio":"alta","due":"2026-05-30","done":false}'

# Marcar como feita
curl -X PATCH "https://raboikyezplxhxxropvf.supabase.co/rest/v1/tasks?id=eq.[ID]" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"done":true,"completed_at":"2026-05-23T15:00:00Z"}'

# Registrar peso
curl -X POST "https://raboikyezplxhxxropvf.supabase.co/rest/v1/registros" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"tipo":"peso","valor":"68.5","data":"2026-05-23"}'

# Registrar treino
curl -X POST "https://raboikyezplxhxxropvf.supabase.co/rest/v1/registros" \
  -H "apikey: [ANON_KEY]" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Content-Type: application/json" \
  -d '{"tipo":"academia","valor":"musculacao","notas":"pernas · 60min · 400kcal","data":"2026-05-23"}'
```

---

## App — Estrutura das 5 Abas

### 🕛 Início
- Header com logo Zentra + nome Gabi + data
- Stats: urgentes, pendentes, contas a vencer, gastos BRL do mês
- Banner de tarefas em atraso
- Lista de tarefas/contas de hoje e próximos 3 dias

### 🎠 Trabalho
- Filtros: Todas / Produto / Clientes / Histórico
- Sub-abas: Foco (Pomodoro 25/5, 50/10, 90/15) e Horas (registro diário)
- Tarefas com prioridade, categoria, prazo, país, notas
- Botão limpar concluídas

### 👠 Pessoal
- Filtros: Todas / Vida / Estudo / Histórico
- Sub-abas: Hábitos (check diário, localStorage) e Metas (diária/semanal/mensal/anual/única)

### 👛 Finanças
- **Contas:** a pagar, multi-moeda, banco, forma de pagamento
- **Gastos:** multi-moeda (BRL/UYU/USD), categoria, banco
- **Orçamento:** taxas de câmbio + limites por categoria
- **Compras:** lista supermercado/geral com qtd e preço
- **Dívidas:** quem deve, valor, moeda, banco de recebimento (localStorage)

### ✨ Saúde
- **Peso:** registro + meta com barra de progresso
- **Treino:** tipo + parte do corpo (opcional) + minutos + calorias, contador semanal, dias acumulados, zerar semana
- **Alimentação:** registro por refeição, meta kcal + meta proteína g, barras de progresso
- **Sono:** registro + média 7 dias
- **Água:** em ml, botões +250/+350/+500ml, meta em ml (padrão 2000ml)
- **Medicamentos:** nome, dose, próxima aplicação, frequência (localStorage)

---

## Dados em localStorage (por dispositivo)

| Chave | Conteúdo |
|-------|----------|
| `zentra-acum` | Dias acumulados de treino |
| `zentra-smeta` | Metas de saúde (peso, sono, água, kcal, prot, treino) |
| `zentra-hab` | Lista de hábitos |
| `zentra-hab-YYYY-MM-DD` | Check diário de hábitos |
| `zentra-metas` | Metas pessoais |
| `zentra-horas` | Registro de horas trabalhadas |
| `zentra-meds` | Medicamentos |
| `zentra-taxas` | Taxas USD/UYU para BRL |
| `zentra-orc` | Orçamentos por categoria |
| `zentra-comp` | Lista de compras |
| `zentra-div` | Dívidas |
| `zentra-pomo-YYYY-MM-DD` | Ciclos pomodoro do dia |
| `zentra-agua-YYYY-MM-DD` | ml de água do dia |

⚠️ Esses dados são por dispositivo. Na Fase 3, migrar para Supabase.

---

## Contexto Pessoal da Gabi

- Mora no Uruguai, gerencia clientes BR + UY
- Trabalha 8:30–18:30, academia após o trabalho
- Mestrado em IA (módulos, TMF pendente)
- Mudança para São Paulo em julho/2026
- Contas: Nubank BR + Itaú UY
- Monjaro (aplicação semanal)
- Academia: 57 dias acumulados, meta 4x/semana, 200 dias no ano
- Clientes: Fernando, Eduardo, Marcia, Hanna

---

## Como atualizar o app

1. Baixa o `index.html` atual do GitHub (`github.com/gmsalines/Zentra`)
2. Sobe aqui para Claude modificar
3. Baixa o novo `index.html`
4. Substitui no GitHub → Vercel atualiza automaticamente

---

## Próximos Passos

**Fase 2:**
- [ ] Notificações WhatsApp via Make.com
- [ ] Migrar localStorage para Supabase
- [ ] Editar tarefas e gastos existentes
- [ ] Upload de extratos bancários

**Fase 3:**
- [ ] Login multi-usuário
- [ ] Google Calendar + Gmail
- [ ] App nativo iOS + Apple Health + Apple Watch
- [ ] Exportar PDF/Excel
