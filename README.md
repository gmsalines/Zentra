<div align="center">

# 🕛 Zentra

### *Your missing wand* — seu painel pessoal de produtividade, finanças e saúde.

Organize sua vida num só lugar — e registre tudo só **mandando um áudio no WhatsApp**.

[**▶ Acessar o app**](https://zentra-jet.vercel.app/index.html)

</div>

---

## ✨ O que é

O **Zentra** é um web app pessoal (instalável como aplicativo no celular) que reúne **tarefas, finanças e saúde** numa interface única e elegante. O diferencial: além de usar pela tela, você pode **registrar tudo por voz no WhatsApp** — manda um áudio tipo *"adicionar tarefa reunião sexta, prioridade alta"* e a Zentra transcreve, entende e registra sozinha.

Feito do zero como ferramenta de uso diário, com foco em **baixa fricção** e em quem vive no WhatsApp.

---

## 💭 Por que o Zentra existe

A vida adulta é uma corrida contra o relógio: tarefas do trabalho, contas a pagar, treino, água, sono, metas — tudo espalhado em mil apps, anotações soltas e abas do navegador. A certa altura, *se organizar* virou mais um trabalho.

O Zentra nasceu dessa frustração: a vontade de reunir tudo num lugar só e, acima de tudo, tornar o registro **quase sem esforço**. Em vez de abrir o app e digitar, você manda um áudio no WhatsApp — *"gastei 50 no mercado"*, *"treinei hoje"* — e ele entende, organiza e guarda sozinho. A ideia central é simples: **organizar a vida não devia custar tanto esforço.**

---

## 🪄 Por que Cinderela

A inspiração não é a princesa — é a **virada à meia-noite**. Na história, a vida muda num instante, como mágica, com a ajuda de uma varinha. O Zentra é essa ideia aplicada à rotina: a *varinha que faltava* para transformar o caos do dia a dia em ordem, com um toque de mágica (automação + IA) fazendo o trabalho pesado.

Esse conceito guia toda a identidade do produto:

- O **logo** é um relógio à meia-noite se dissolvendo em partículas mágicas — o instante da transformação.
- A tagline é **"Your missing wand"** — a varinha que faltava.
- Os ícones de navegação são pequenos acenos ao conto: relógio, carruagem, sapatinho, bolsa e varinha/estrela.

A premissa por trás de tudo: o destino já estava escrito — só faltava a ferramenta certa para a vida mudar como mágica.

---

## 🚀 Funcionalidades

### 📋 Tarefas
- Áreas de **Trabalho** e **Pessoal** com categorias, prioridades, prazos e histórico de concluídas
- **Áreas personalizadas**: crie suas próprias abas com campos sob medida (texto, número, data)
- Modo **foco (pomodoro)** e registro de horas

### 💰 Finanças
- Contas a pagar, gastos, orçamento por categoria, lista de compras e dívidas
- **Investimentos** (aplicado × atual, com rendimento) e **metas financeiras** com barra de progresso
- **Importação de extrato** (CSV, Excel ou PDF) — a IA extrai os lançamentos automaticamente
- Gráficos de gastos por categoria e evolução mensal (multi-moeda: BRL / UYU / USD)

### 🩺 Saúde
- Peso (com meta), treinos (contador semanal e dias acumulados), alimentação (calorias e proteína), água, sono, medicamentos e hábitos

### 🤖 Assistente com IA
- **Chat no app**: escreva em linguagem natural e ele registra a ação certa
- **WhatsApp**: envie **áudio ou texto** → transcrição + interpretação + registro automático
- **Resumo diário** enviado no WhatsApp toda manhã (tarefas, contas a vencer, gastos)

### 🎨 Experiência
- **Instalável** no celular (PWA) — abre em tela cheia, com ícone próprio
- **Multi-idioma** (PT / ES / EN), temas de cor e ícones personalizáveis
- **Linha do tempo** unificada de tudo que aconteceu
- Dados **sincronizados na nuvem** entre celular e computador, com login e isolamento por usuário

---

## 🛠️ Stack

| Camada | Tecnologia |
|---|---|
| **Front-end** | HTML, CSS e JavaScript (single-file), PWA |
| **Back-end** | Vercel Serverless Functions (Node.js) |
| **Banco & Auth** | Supabase (PostgreSQL + Row Level Security) |
| **IA** | Groq — `llama-3.3-70b` (interpretação) e `whisper-large-v3` (transcrição de áudio) |
| **WhatsApp** | Twilio |
| **Gráficos / Arquivos** | Chart.js · SheetJS · pdf.js |
| **Hospedagem / CI** | Vercel (deploy automático a partir do GitHub) |

---

## 🧠 Como funciona o registro por WhatsApp

```
Áudio/texto no WhatsApp
        │
        ▼
   Twilio (webhook)  →  /api/whatsapp
        │
        ├─ baixa o áudio → Whisper (Groq) → transcrição
        ▼
   Llama (Groq) interpreta → JSON de ação
        │
        ▼
   Supabase grava (tarefa / gasto / treino / peso…)
        │
        ▼
   Responde a confirmação no WhatsApp
```

---

## 🔒 Privacidade & segurança

- Autenticação por e-mail e senha (Supabase Auth)
- **Row Level Security**: cada usuário só acessa os próprios dados
- Chaves de API e segredos ficam apenas no servidor (variáveis de ambiente), nunca no front-end

---

## 📌 Status

Projeto em **evolução contínua**, usado no dia a dia. Próximos passos em estudo: cadastro aberto, notificações de saída mais ricas e validação com usuários reais.

---

<div align="center">

Feito com 💜 por **Gabriela Martinez Salines**

</div>
