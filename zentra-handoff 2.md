# Zentra — Project Handoff v2

## Conceito
App de produtividade pessoal construído para Gabi. Hub central que combina tarefas, finanças e saúde. Identidade visual inspirada na Cinderela — destino que já estava escrito, vida que muda como mágica.

**Tagline:** "Your missing wand."

---

## Infraestrutura

**Supabase (banco de dados):**
- Project URL: `https://raboikyezplxhxxropvf.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYm9pa3llenBseGh4eHJvcHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTQyNjIsImV4cCI6MjA5NTA5MDI2Mn0.7IID_hKsYXge6PK7n2JX0F10dVDMtbLJ068mWkH6Kpw`

**Netlify (hospedagem):**
- URL: `https://classy-gelato-6aa866.netlify.app`
- Deploy: drag and drop do arquivo `zentra-deploy.zip` na área "Production deploys"
- ⚠️ Testar sempre localmente (abrir index.html no browser) antes de subir para economizar créditos

---

## Identidade Visual

**Paleta (tons terra):**
- Fundo: `#2E2A25` (ardósia quente)
- Surface: `#262218`
- Ouro: `#C9923A` / `#E8A84C`
- Creme: `#F0E0C4`
- Musgo: `#8A9E6A`
- Terracota: `#C4724A`

**Tipografia:** Georgia serif (sistema, sem Google Fonts)

**Logo:** Relógio horizontal da meia-noite (ponteiros para cima) se dissolvendo em partículas mágicas à direita + ZENTRA em Georgia

**Nav:** 5 ícones SVG customizados — relógio, carruagem, sapatinho, bolsa, varinha/estrela

---

## Banco de Dados — Tabelas

```sql
tasks (id, text, cat, prio, due, done, created_at, completed_at, notes, updated_at)
bills (id, name, val, cur, due, paid, created_at, banco, forma_pagamento, paid_at)
gastos (id, descricao, val, cur, cat, data, created_at, banco)
registros (id, tipo, valor, data, notas, created_at)
task_logs (id, task_id, note, created_at)
```

**Categorias de tasks:** `brinta`, `cliente`, `pessoal`, `estudo`

**Tipos de registros:** `peso`, `academia`, `alimentacao`, `sono`, `agua`, `ciclo`, `medicamentos`, `meta`, `horas`

---

## App — Estrutura das Abas

### 1. Início
- Saudação com nome Gabi + data atual
- Banner de tarefas vencidas
- Stats: urgentes, pendentes, contas, gastos BRL do mês
- Lista de urgentes do dia
- Próximos 3 dias
- Link "limpar tarefas" com modal: concluídas / vencidas / tudo + filtro por período/data

### 2. Trabalho
- Filtros: Todas / Produto / Clientes / Histórico / Horas / Foco
- Tarefas com prioridade (alta/média/baixa), categoria, país (América Latina), data início + entrega
- **Horas:** registrar horas trabalhadas por dia com total acumulado
- **Foco (Pomodoro):** timer 25/5 ou 50/10 min com contador de ciclos

### 3. Pessoal
- Filtros: Todas / Vida / Estudo / Histórico / Hábitos / Metas
- **Hábitos:** lista diária para marcar (localStorage)
- **Metas:** diária, semanal, mensal, anual, única — com data de entrega

### 4. Finanças
- **Contas:** a pagar com banco, forma de pagamento, marcar como pago
- **Gastos:** multi-moeda (BRL/UYU/USD) com taxas de câmbio configuráveis, total em BRL
- **Resumo:** total do mês vs anterior, barras por categoria, gráfico 4 meses
- **Orçamento:** limites por categoria com barra de progresso
- **Compras:** lista de supermercado e geral com qtd, preço estimado e total
- **Dívidas:** quem deve, valor, moeda, banco de recebimento, equivalente BRL, marcar como recebido

### 5. Saúde
- Grid de cards — cada card abre tela dedicada com ← para voltar
- **Peso:** último peso + gráfico de evolução + meta de peso alvo
- **Treino:** contador semanal (seg-dom, máx 7) + dias acumulados + tipo (musculação/cardio/funcional/outro) + duração + calorias queimadas + resumo mensal por tipo + botão zerar semana
- **Alimentação:** metas de calorias/proteína/carbs/gordura + registro por refeição com kcal + barra de progresso diária
- **Sono:** última noite + média 7 dias + meta de horas
- **Água:** contador de copos com meta diária e barra de progresso
- **Ciclo:** histórico menstrual
- **Medicamentos:** nome, dose, próxima aplicação (Monjaro, etc.) + histórico

---

## Dados Armazenados Localmente (localStorage)

Alguns dados ficam no dispositivo (não no Supabase):
- Hábitos diários e check do dia: `zentra-habitos`, `zentra-habitos-done-YYYY-MM-DD`
- Dias acumulados de treino: `zentra-academia-acum`
- Metas de saúde (peso, sono, água, academia): `zentra-saude-metas`
- Metas de alimentação: `zentra-ali-metas`
- Taxas de câmbio: `zentra-taxas`
- Orçamentos por categoria: `zentra-orcamento`
- Lista de compras: `zentra-compras`
- Contador de água do dia: `zentra-agua-YYYY-MM-DD`

⚠️ Esses dados são perdidos se o usuário limpar o browser ou trocar de dispositivo. Na Fase 3, migrar tudo para o Supabase.

---

## Como Claude Atualiza o App

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

## Contexto Pessoal da Gabi

- Trabalha das 8:30–18:30, mora no Uruguai, gerencia clientes BR+UY
- Academia 1h15 após o trabalho — 57 dias acumulados, meta 4x/semana, 200 dias no ano
- Estudo: mestrado em IA (módulos, TMF)
- Mudança para São Paulo em julho/2026
- Contas: Nubank BR + Itaú UY
- Monjaro (aplicação semanal)
- Clientes: Fernando, Eduardo, Marcia, Hanna

---

## Próximos Passos

**Fase 2:**
- [ ] Notificações WhatsApp via Make.com (contas vencendo, tarefas urgentes)
- [ ] Migrar localStorage para Supabase
- [ ] Opção de editar tarefas e gastos existentes
- [ ] Upload de extratos bancários (PDF/Excel)

**Fase 3 (produto comercial):**
- [ ] Login com email/senha (multi-usuário)
- [ ] Integração Google Calendar e Gmail
- [ ] App nativo iOS — Apple Health + Apple Watch (HealthKit)
- [ ] Exportar relatório PDF/Excel
- [ ] App Store (U$99/ano Apple Developer)
