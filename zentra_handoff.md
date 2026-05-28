# Zentra — Project Handoff

## Contexto
App de produtividade pessoal construído para Gabi. Hub central que combina tarefas, finanças e saúde. Conceito inspirado na Cinderela — destino que já estava escrito, vida que muda como mágica.

---

## Infraestrutura

**Supabase (banco de dados):**
- Project URL: `https://raboikyezplxhxxropvf.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYm9pa3llenBseGh4eHJvcHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTQyNjIsImV4cCI6MjA5NTA5MDI2Mn0.7IID_hKsYXge6PK7n2JX0F10dVDMtbLJ068mWkH6Kpw`

**Netlify (hospedagem):**
- URL: `https://classy-gelato-6aa866.netlify.app`
- Deploy: drag and drop zip na área "Production deploys"

---

## Banco de Dados — Tabelas

```sql
tasks (id, text, cat, prio, due, done, created_at, completed_at, notes, updated_at)
bills (id, name, val, cur, due, paid, created_at, banco, forma_pagamento, paid_at)
gastos (id, descricao, val, cur, cat, data, created_at, banco)
registros (id, tipo, valor, data, notas, created_at)
task_logs (id, task_id, note, created_at)
```

**Categorias de tasks:**
- `brinta` — tarefas do produto BRINTA
- `cliente` — tarefas de clientes (Fernando, Eduardo, Marcia, Hanna)
- `pessoal` — vida pessoal
- `estudo` — mestrado em IA, módulos, TMF

---

## App — Estrutura Atual

**5 abas (conceito Cinderela):**
1. **Início** — Relógio da Meia-noite (dashboard com urgentes do dia)
2. **Trabalho** — A Abóbora que vira Carruagem (tarefas BRINTA + clientes)
3. **Pessoal** — O Sapatinho de Cristal (vida + estudo)
4. **Finanças** — A Bolsa Dourada (gastos + contas a pagar, multi-moeda BRL/UYU/USD)
5. **Saúde** — A Fada Madrinha (peso, academia, alimentação, sono)

**Funcionalidades implementadas:**
- Tarefas com prioridade (alta/média/baixa), prazo, categoria
- Histórico de tarefas concluídas por mês
- Botão "Limpar concluídas" só nas tarefas (finanças nunca apagam)
- Contas a pagar com banco + forma de pagamento + data de pagamento
- Gastos com banco + categoria + multi-moeda
- Registros de saúde com histórico
- Conexão direta com Claude — Claude pode inserir/atualizar/deletar dados via API do Supabase

**Tarefas já cadastradas no banco:**
- Fernando impuestos, Eduardo BPS, Marcia BPS, Recálculo Marcia (Cliente, Alta)
- NFTS, Rappi transacciones SIRTAC (BRINTA, Alta)
- Fernando BPS, Fernando IRPF, Hablar ITAU, Hanna IVA (Cliente, Média)
- Gravação sem aparecer, Guia caju, DIMP nova versão (BRINTA, Média)
- Módulo 5 trabalho, Módulo 6 trabalho (Estudo, Alta, vence 22/05)
- Reforma tributária estudar (Estudo, Média)
- TMF começar (Estudo, Média)
- Mudar para São Paulo (Pessoal, Alta, jul/2026)

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
```

---

## Identidade Visual — Zentra

**Nome:** Zentra (Z de destino + centralizar + Cinderela)
**Tagline:** "Your missing wand."
**Conceito:** O destino já estava escrito — a vida pode mudar como mágica

**Paleta:**
- Noite: `#060E07`
- Floresta: `#1A4A2A`
- Esmeralda: `#5DCF85`
- Jade: `#3DAA65`
- Menta: `#C8F0D8`
- Ouro: `#FFE066`
- Âmbar: `#EF9F27`

**Tipografia:**
- Nome da marca: Georgia serif
- Interface: -apple-system sans-serif

**Logo — status:** Em definição. Última direção aprovada: Z como constelação (pontos de luz conectados que formam o Z — o nome já estava escrito nas estrelas).

**Descartado:**
- Relógio com ponteiros (muito IA/genérico)
- Abóbora (formato inadequado)
- Varinha (não funcionou visualmente)
- Paleta roxa (trocada por esmeralda)

---

## Próximos Passos

**Imediato:**
- [ ] Finalizar o logo — Z como constelação
- [ ] Aplicar identidade visual completa no app
- [ ] Redesenhar ícones das abas com tema Cinderela

**Fase 2:**
- [ ] Orçamentos por categoria com barras de progresso
- [ ] Gráficos de gastos (por categoria, evolução mensal)
- [ ] Notificações de vencimento (WhatsApp via Make.com)

**Fase 3 (produto comercial):**
- [ ] Login com email/senha (multi-usuário)
- [ ] Integração Google Calendar
- [ ] Integração Gmail
- [ ] Integração WhatsApp
- [ ] Integração ChatGPT/outros AIs
- [ ] Exportar relatório PDF/Excel
- [ ] App nativo iOS (App Store, U$99/ano Apple Developer)

---

## Contexto Pessoal da Gabi

- Trabalha das 8:30–18:30
- Academia 1h15 após o trabalho
- Estudo: 1h manhã (7h) + 2h noite (20:30)
- Módulos 5 e 6 do mestrado em IA com entrega sexta 22/05
- Reforma tributária: 3 aulas de 3h pra estudar
- TMF (trabalho final do mestrado) — não começou ainda
- Mudança para São Paulo em julho/2026
- Mora atualmente no Uruguai, gerencia clientes BR+UY
- Contas: Nubank BR + Itaú UY
- Monjaro (aplicação semanal)
- Whey: Growth Basic Whey 1kg chocolate (iniciante)
- Sopa de frango com abóbora e cenoura + torta de milho com carne moída planejadas pro fim de semana
