import React, { useState, useRef, useEffect, createContext, useContext } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip,
} from "recharts";
import {
  Briefcase, Heart, DollarSign, Home as HomeIcon, ShoppingBag, BookOpen,
  Plus, MessageCircle, LayoutGrid, Clock, ArrowLeft, Send, Bell, Target,
  Pill, RefreshCw, ChevronRight, Dumbbell, Droplets, Check, Flame,
  Activity, Sparkles, User, Moon, Sun, MoreHorizontal, Edit2, GripVertical,
  SlidersHorizontal, CheckCircle2, ArrowRight, Minus, Globe, Palette,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type Screen = "onboard1" | "onboard_style" | "onboard2" | "home" | "chat" | "spaces" | "space_detail" | "history";
type ThemeKey = "cinderela" | "neutro" | "onyx" | "indigo";
type LangKey = "pt" | "es" | "en";
type Filter = "today" | "week" | "month";

// ─── Themes ───────────────────────────────────────────────────────────────────
const THEMES: Record<ThemeKey, Record<string, string>> = {
  cinderela: {
    "c-bg": "#06091A", "c-surface": "#0D1128",
    "c-silver": "#C8D4EC", "c-silver-mid": "#7B8DAD", "c-silver-faint": "#364260",
    "c-text": "#E6ECF8", "c-text-mid": "#8A9BBF", "c-text-faint": "#4A5A7A",
    "c-border": "rgba(164,184,216,0.1)", "c-glow": "rgba(120,160,240,0.12)",
    "c-accent": "#BF88A8",
    "c-glass-bg": "rgba(255,255,255,0.036)", "c-glass-border": "rgba(164,184,216,0.1)",
    "c-nav-bg": "rgba(6,9,26,0.88)",
    "c-chart": "#7B9FD4", "c-chart-alt": "#7BAA8C",
    "c-top-glow": "rgba(50,80,180,0.09)",
    "c-nebula-1": "rgba(80,110,230,0.14)", "c-nebula-2": "rgba(160,90,210,0.09)", "c-nebula-3": "rgba(50,80,200,0.09)",
    "c-btn-border": "rgba(164,184,216,0.26)", "c-btn-glow": "rgba(120,160,240,0.1)",
    "c-btn-bg-start": "rgba(164,184,216,0.15)", "c-btn-bg-end": "rgba(90,120,210,0.1)",
    "c-star": "rgba(210,225,255,0.8)",
  },
  neutro: {
    "c-bg": "#0C110A", "c-surface": "#121A0F",
    "c-silver": "#B8D4B0", "c-silver-mid": "#6B8A65", "c-silver-faint": "#2E4228",
    "c-text": "#E4EDE2", "c-text-mid": "#7A9A75", "c-text-faint": "#3A5235",
    "c-border": "rgba(140,180,130,0.1)", "c-glow": "rgba(100,160,90,0.1)",
    "c-accent": "#88B878",
    "c-glass-bg": "rgba(255,255,255,0.03)", "c-glass-border": "rgba(140,180,130,0.1)",
    "c-nav-bg": "rgba(12,17,10,0.92)",
    "c-chart": "#88B878", "c-chart-alt": "#7AA894",
    "c-top-glow": "rgba(40,100,40,0.08)",
    "c-nebula-1": "rgba(60,120,50,0.12)", "c-nebula-2": "rgba(100,160,80,0.08)", "c-nebula-3": "rgba(40,100,40,0.07)",
    "c-btn-border": "rgba(140,180,130,0.28)", "c-btn-glow": "rgba(100,160,90,0.08)",
    "c-btn-bg-start": "rgba(140,180,130,0.15)", "c-btn-bg-end": "rgba(60,100,50,0.1)",
    "c-star": "rgba(200,230,190,0.7)",
  },
  onyx: {
    "c-bg": "#0E0A07", "c-surface": "#160F08",
    "c-silver": "#E8B86D", "c-silver-mid": "#A07840", "c-silver-faint": "#4A3018",
    "c-text": "#F0E8DC", "c-text-mid": "#A89070", "c-text-faint": "#5A4030",
    "c-border": "rgba(196,136,42,0.12)", "c-glow": "rgba(196,136,42,0.08)",
    "c-accent": "#C4882A",
    "c-glass-bg": "rgba(255,255,255,0.028)", "c-glass-border": "rgba(196,136,42,0.1)",
    "c-nav-bg": "rgba(14,10,7,0.92)",
    "c-chart": "#C4882A", "c-chart-alt": "#8B6030",
    "c-top-glow": "rgba(100,60,20,0.08)",
    "c-nebula-1": "rgba(140,80,20,0.12)", "c-nebula-2": "rgba(180,100,30,0.08)", "c-nebula-3": "rgba(100,60,20,0.07)",
    "c-btn-border": "rgba(196,136,42,0.32)", "c-btn-glow": "rgba(196,136,42,0.1)",
    "c-btn-bg-start": "rgba(196,136,42,0.15)", "c-btn-bg-end": "rgba(120,70,20,0.1)",
    "c-star": "rgba(240,200,140,0.7)",
  },
  indigo: {
    "c-bg": "#0A0814", "c-surface": "#110E1C",
    "c-silver": "#C4B5FD", "c-silver-mid": "#8B7AC4", "c-silver-faint": "#3D2E6E",
    "c-text": "#F0ECFF", "c-text-mid": "#9080C8", "c-text-faint": "#4A3878",
    "c-border": "rgba(139,92,246,0.14)", "c-glow": "rgba(139,92,246,0.1)",
    "c-accent": "#F97316",
    "c-glass-bg": "rgba(255,255,255,0.032)", "c-glass-border": "rgba(139,92,246,0.12)",
    "c-nav-bg": "rgba(10,8,20,0.92)",
    "c-chart": "#8B5CF6", "c-chart-alt": "#F97316",
    "c-top-glow": "rgba(80,40,180,0.1)",
    "c-nebula-1": "rgba(100,50,220,0.14)", "c-nebula-2": "rgba(160,90,246,0.09)", "c-nebula-3": "rgba(80,40,200,0.08)",
    "c-btn-border": "rgba(139,92,246,0.3)", "c-btn-glow": "rgba(139,92,246,0.12)",
    "c-btn-bg-start": "rgba(139,92,246,0.16)", "c-btn-bg-end": "rgba(80,40,180,0.1)",
    "c-star": "rgba(200,180,255,0.75)",
  },
};

// ─── Translations ─────────────────────────────────────────────────────────────
const T = {
  pt: {
    onb1_headline: ["Porque sua mente", "já carrega", "demais."],
    onb1_sub: "Um espaço elegante para cada tarefa, rotina e pensamento que você carrega.",
    onb1_cta: "Começar",
    onb1_privacy: "Sem conta · Sempre privado",
    onb_style_title: ["Escolha seu", "estilo"],
    onb_style_sub: "Personalize o Zentra do seu jeito.",
    theme_title: "Visual",
    themes: { cinderela: "Cinderela", neutro: "Neutro", onyx: "Onyx", indigo: "Índigo" },
    theme_desc: { cinderela: "Azul meia-noite · Prata", neutro: "Sage · Verde pedra", onyx: "Couro · Âmbar", indigo: "Violeta · Inclusivo" },
    lang_title: "Idioma",
    onb_style_cta: "Continuar",
    spaces_title: ["Escolha seus", "espaços"],
    spaces_sub: "Organize em torno do que realmente importa para você.",
    spaces_add: "Adicionar espaço personalizado...",
    spaces_cta: "Configurar meu Zentra",
    nav: { today: "Início", chat: "Chat", spaces: "Espaços", history: "Histórico" },
    greet: (h: number) => h < 12 ? "Bom dia" : h < 17 ? "Boa tarde" : "Boa noite",
    tasks_done: (d: number, t: number) => `${d} de ${t} tarefas concluídas`,
    section: { today: "Hoje", upcoming: "Em breve", reminders: "Lembretes" },
    spaces_label: { work: "Trabalho", health: "Saúde", finance: "Finanças", home: "Casa", shopping: "Compras", books: "Livros", brinta: "Trabalho", cliente: "Clientes", pessoal: "Pessoal", estudo: "Estudo", saude: "Saúde", financas: "Finanças", casa: "Casa", compras: "Compras", reminder: "Lembrete" },
    chat_placeholder: "O que você tem em mente?",
    chat_sub: "Me conta o que aconteceu.",
    chat_date: "Hoje",
    history_title: ["Seu", "histórico"],
    history_week_label: "Conclusões semanais",
    history_week_change: "+24% esta semana",
    history_filter: { today: "Hoje", week: "Esta semana", month: "Mês" },
    history_completed: (n: number) => `${n} concluídos`,
    your_spaces: ["Seus", "espaços"],
    organize: "Organizar",
    done_btn: "Pronto",
    add_space: "Criar espaço personalizado",
    chat_understand: ["Zentra", "entende"],
    history_your: ["Seu", "histórico"],
  },
  es: {
    onb1_headline: ["Porque tu mente", "ya lleva", "demasiado."],
    onb1_sub: "Un espacio elegante para cada tarea, rutina y pensamiento que llevas.",
    onb1_cta: "Comenzar",
    onb1_privacy: "Sin cuenta · Siempre privado",
    onb_style_title: ["Elige tu", "estilo"],
    onb_style_sub: "Personaliza Zentra a tu manera.",
    theme_title: "Visual",
    themes: { cinderela: "Cenicienta", neutro: "Neutro", onyx: "Onyx", indigo: "Índigo" },
    theme_desc: { cinderela: "Azul medianoche · Plata", neutro: "Sage · Verde piedra", onyx: "Cuero · Ámbar", indigo: "Violeta · Inclusivo" },
    lang_title: "Idioma",
    onb_style_cta: "Continuar",
    spaces_title: ["Elige tus", "espacios"],
    spaces_sub: "Organízate en torno a lo que realmente importa.",
    spaces_add: "Agregar espacio personalizado...",
    spaces_cta: "Configurar mi Zentra",
    nav: { today: "Inicio", chat: "Chat", spaces: "Espacios", history: "Historial" },
    greet: (h: number) => h < 12 ? "Buenos días" : h < 17 ? "Buenas tardes" : "Buenas noches",
    tasks_done: (d: number, t: number) => `${d} de ${t} tareas completadas`,
    section: { today: "Hoy", upcoming: "Próximas", reminders: "Recordatorios" },
    spaces_label: { work: "Trabajo", health: "Salud", finance: "Finanzas", home: "Hogar", shopping: "Compras", books: "Libros", brinta: "Trabajo", cliente: "Clientes", pessoal: "Personal", estudo: "Estudio", saude: "Salud", financas: "Finanzas", casa: "Hogar", compras: "Compras", reminder: "Recordatorio" },
    chat_placeholder: "¿Qué tienes en mente?",
    chat_sub: "Cuéntame qué pasó.",
    chat_date: "Hoy",
    history_title: ["Tu", "historial"],
    history_week_label: "Completadas esta semana",
    history_week_change: "+24% esta semana",
    history_filter: { today: "Hoy", week: "Esta semana", month: "Mes" },
    history_completed: (n: number) => `${n} completadas`,
    your_spaces: ["Tus", "espacios"],
    organize: "Organizar",
    done_btn: "Listo",
    add_space: "Crear espacio personalizado",
    chat_understand: ["Zentra", "entiende"],
    history_your: ["Tu", "historial"],
  },
  en: {
    onb1_headline: ["Because your mind", "already carries", "too much."],
    onb1_sub: "One elegant space for every task, routine, and thought you carry.",
    onb1_cta: "Begin your clarity",
    onb1_privacy: "No account · Always private",
    onb_style_title: ["Choose your", "style"],
    onb_style_sub: "Make Zentra yours.",
    theme_title: "Visual",
    themes: { cinderela: "Cinderella", neutro: "Neutral", onyx: "Onyx", indigo: "Indigo" },
    theme_desc: { cinderela: "Midnight blue · Silver", neutro: "Sage · Stone green", onyx: "Leather · Amber", indigo: "Violet · Inclusive" },
    lang_title: "Language",
    onb_style_cta: "Continue",
    spaces_title: ["Choose your", "spaces"],
    spaces_sub: "Organize around what actually matters to you.",
    spaces_add: "Add a custom space...",
    spaces_cta: "Set up my Zentra",
    nav: { today: "Home", chat: "Chat", spaces: "Spaces", history: "History" },
    greet: (h: number) => h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening",
    tasks_done: (d: number, t: number) => `${d} of ${t} tasks complete`,
    section: { today: "Today", upcoming: "Upcoming", reminders: "Reminders" },
    spaces_label: { work: "Work", health: "Health", finance: "Finance", home: "Home", shopping: "Shopping", books: "Books", brinta: "Work", cliente: "Clients", pessoal: "Personal", estudo: "Study", saude: "Health", financas: "Finance", casa: "Home", compras: "Shopping", reminder: "Reminder" },
    chat_placeholder: "What's on your mind?",
    chat_sub: "Just tell me what happened.",
    chat_date: "Today",
    history_title: ["Your", "history"],
    history_week_label: "Weekly completions",
    history_week_change: "+24% this week",
    history_filter: { today: "Today", week: "This Week", month: "Month" },
    history_completed: (n: number) => `${n} completed`,
    your_spaces: ["Your", "spaces"],
    organize: "Organize",
    done_btn: "Done",
    add_space: "Create a custom space",
    chat_understand: ["Zentra", "understands"],
    history_your: ["Your", "history"],
  },
};

// ─── Backend config ───────────────────────────────────────────────────────────
const SB_URL  = "https://raboikyezplxhxxropvf.supabase.co";
const SB_KEY  = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJhYm9pa3llenBseGh4eHJvcHZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk1MTQyNjIsImV4cCI6MjA5NTA5MDI2Mn0.7IID_hKsYXge6PK7n2JX0F10dVDMtbLJ068mWkH6Kpw";
const GROQ_KEY = import.meta.env.VITE_GROQ_KEY ?? "";
const GROQ_MODEL = "llama-3.3-70b-versatile";

const SB_H = { "apikey": SB_KEY, "Authorization": `Bearer ${SB_KEY}`, "Content-Type": "application/json", "Prefer": "return=representation" };

async function sbGet(table: string, qs = ""): Promise<any[]> {
  const res = await fetch(`${SB_URL}/rest/v1/${table}?${qs}`, { headers: SB_H });
  if (!res.ok) return [];
  return res.json();
}
async function sbPost(table: string, body: object): Promise<any> {
  const res = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: SB_H, body: JSON.stringify(body) });
  if (!res.ok) return null;
  const arr = await res.json();
  return arr[0] ?? null;
}
async function sbPatch(table: string, qs: string, body: object): Promise<void> {
  await fetch(`${SB_URL}/rest/v1/${table}?${qs}`, { method: "PATCH", headers: { ...SB_H, Prefer: "return=minimal" }, body: JSON.stringify(body) });
}

// Space → colour mapping for tasks coming from DB
const SPACE_COLOR: Record<string, string> = {
  brinta: "#6E8AC8", cliente: "#7BAA8C", pessoal: "#BF88A8", estudo: "#9880C4",
  work: "#6E8AC8", health: "#BF88A8", finance: "#7BAA8C", home: "#BFA070", shopping: "#9880C4", books: "#C4882A",
};

// ─── Prefs Context ────────────────────────────────────────────────────────────
interface Prefs { theme: ThemeKey; lang: LangKey; spaces: string[]; }
const PrefsCtx = createContext<{ prefs: Prefs; setPrefs: (p: Prefs) => void }>({
  prefs: { theme: "cinderela", lang: "pt", spaces: ["work", "health", "finance", "home", "shopping", "books"] },
  setPrefs: () => {},
});
const usePrefs = () => useContext(PrefsCtx);
const useT = () => { const { prefs } = usePrefs(); return T[prefs.lang]; };

// ─── Design tokens (CSS vars) ─────────────────────────────────────────────────
const f = { display: "'Marcellus', Georgia, serif", ui: "'Outfit', system-ui, sans-serif" };
const c = {
  bg: "var(--c-bg)", silver: "var(--c-silver)", silverMid: "var(--c-silver-mid)",
  silverFaint: "var(--c-silver-faint)", text: "var(--c-text)", textMid: "var(--c-text-mid)",
  textFaint: "var(--c-text-faint)", border: "var(--c-border)", glow: "var(--c-glow)",
  accent: "var(--c-accent)", chart: "var(--c-chart)", chartAlt: "var(--c-chart-alt)",
};

// ─── Spaces data ──────────────────────────────────────────────────────────────
const SPACE_DATA = [
  { id: "work",     icon: Briefcase,  color: "#6E8AC8", hint: "2 meetings today",      pct: 35 },
  { id: "health",   icon: Heart,      color: "#BF88A8", hint: "3 tasks remaining",     pct: 68 },
  { id: "finance",  icon: DollarSign, color: "#7BAA8C", hint: "1 bill due soon",       pct: 45 },
  { id: "home",     icon: HomeIcon,   color: "#BFA070", hint: "Clean kitchen",         pct: 22 },
  { id: "shopping", icon: ShoppingBag,color: "#9880C4", hint: "4 items listed",        pct: 80 },
  { id: "books",    icon: BookOpen,   color: "#68ADB8", hint: "The Midnight Library",  pct: 55 },
];

// ─── Glass card style ─────────────────────────────────────────────────────────
const glass: React.CSSProperties = {
  background: "var(--c-glass-bg)",
  backdropFilter: "blur(22px) saturate(160%)",
  WebkitBackdropFilter: "blur(22px) saturate(160%)",
  border: "1px solid var(--c-glass-border)",
  boxShadow: "0 2px 24px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
};
const glassHigh: React.CSSProperties = {
  ...glass,
  boxShadow: "0 4px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06)",
};

// ─── Sparkle field ────────────────────────────────────────────────────────────
const SPARKS: [number, number, number, number][] = [
  [9,7,1.4,0],[87,11,1,1.5],[32,21,1.8,0.9],[74,33,1,2.3],
  [17,50,1.4,1.2],[93,57,0.9,0.6],[47,68,1.8,2.0],[64,80,1,3.2],
  [7,84,1.4,0.4],[80,89,0.9,2.8],[56,17,1,1.7],[23,74,1.8,1.0],
  [41,44,0.9,2.5],[70,14,1.4,0.8],[14,62,1,1.4],[52,92,1.4,3.5],
];

function StarField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {SPARKS.map(([x,y,sz,delay],i) => (
        <motion.div key={i} className="absolute rounded-full"
          style={{ left:`${x}%`, top:`${y}%`, width:sz, height:sz, background:"var(--c-star)" }}
          animate={{ opacity:[0.05,0.6,0.05], scale:[0.7,2,0.7] }}
          transition={{ duration:3.2+(i%4)*0.7, delay, repeat:Infinity, ease:"easeInOut" }}
        />
      ))}
    </div>
  );
}

// ─── Nebula glow ──────────────────────────────────────────────────────────────
function Nebula() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <motion.div className="absolute rounded-full"
        style={{ width:420, height:420, top:"5%", left:"50%", x:"-50%",
          background:"radial-gradient(circle, var(--c-nebula-1) 0%, transparent 70%)", filter:"blur(40px)" }}
        animate={{ scale:[1,1.18,1], opacity:[0.6,1,0.6] }}
        transition={{ duration:7, repeat:Infinity, ease:"easeInOut" }}
      />
      <motion.div className="absolute rounded-full"
        style={{ width:300, height:300, top:"35%", right:"-8%",
          background:"radial-gradient(circle, var(--c-nebula-2) 0%, transparent 70%)", filter:"blur(50px)" }}
        animate={{ scale:[1,1.22,1], opacity:[0.35,0.75,0.35] }}
        transition={{ duration:9, repeat:Infinity, ease:"easeInOut", delay:2.5 }}
      />
      <motion.div className="absolute rounded-full"
        style={{ width:260, height:260, bottom:"18%", left:"-6%",
          background:"radial-gradient(circle, var(--c-nebula-3) 0%, transparent 70%)", filter:"blur(38px)" }}
        animate={{ scale:[1,1.12,1], opacity:[0.4,0.85,0.4] }}
        transition={{ duration:8, repeat:Infinity, ease:"easeInOut", delay:1.2 }}
      />
    </div>
  );
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
function TopBar({ tinted=false }: { tinted?: boolean }) {
  const textColor = tinted ? "rgba(230,236,248,0.9)" : c.text;
  const dimColor  = tinted ? "rgba(230,236,248,0.5)"  : c.silverMid;
  return (
    <div className="relative flex items-end justify-between px-6" style={{ height:58 }}>
      <div className="absolute top-[11px] left-1/2 -translate-x-1/2 rounded-full z-20"
        style={{ width:122, height:34, background:"#000" }} />
      <span style={{ fontFamily:f.ui, fontSize:"15px", fontWeight:600, color:textColor, paddingBottom:4 }}>9:41</span>
      <div className="flex items-center gap-1.5 pb-1">
        {[1.5,2.5,3.5,4.5].map((h,i) => (
          <div key={i} className="w-[3px] rounded-[1px]"
            style={{ height:h*1.4, background:dimColor, opacity:i<2?0.45:1 }} />
        ))}
        <div className="w-[18px] h-[10px] rounded-[3px] border flex items-center px-[2px] ml-0.5"
          style={{ borderColor:dimColor }}>
          <div className="h-[5px] rounded-[1px]" style={{ width:"65%", background:dimColor }} />
        </div>
      </div>
    </div>
  );
}

// ─── Shared components ────────────────────────────────────────────────────────
function GlassCard({ children, className="", style={}, onClick, high=false }:
  { children:React.ReactNode; className?:string; style?:React.CSSProperties; onClick?:()=>void; high?:boolean }) {
  return (
    <div className={`rounded-2xl ${className}`}
      style={{ ...(high?glassHigh:glass), cursor:onClick?"pointer":undefined, ...style }}
      onClick={onClick}>
      {children}
    </div>
  );
}

function Chip({ label, color }: { label:string; color:string }) {
  return (
    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0"
      style={{ fontFamily:f.ui, color, background:`${color}16`, border:`1px solid ${color}28` }}>
      {label}
    </span>
  );
}

function Eyebrow({ children }: { children:React.ReactNode }) {
  return (
    <p className="mb-3" style={{ fontFamily:f.ui, fontSize:"10px", letterSpacing:"0.18em",
      color:c.silverFaint, textTransform:"uppercase", fontWeight:500 }}>
      {children}
    </p>
  );
}

// ─── Bottom nav ───────────────────────────────────────────────────────────────
function BottomNav({ screen, setScreen }: { screen:Screen; setScreen:(s:Screen)=>void }) {
  const t = useT();
  const NAV = [
    { id:"home",    icon:HomeIcon,     label:t.nav.today   },
    { id:"chat",    icon:MessageCircle,label:t.nav.chat    },
    { id:"spaces",  icon:LayoutGrid,   label:t.nav.spaces  },
    { id:"history", icon:Clock,        label:t.nav.history },
  ];
  const active = (id:string) => screen===id || (screen==="space_detail" && id==="spaces");
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 flex justify-around items-center px-2 pb-6 pt-3"
      style={{ background:"var(--c-nav-bg)", backdropFilter:"blur(28px) saturate(160%)",
        WebkitBackdropFilter:"blur(28px)", borderTop:"1px solid var(--c-border)" }}>
      {NAV.map(({ id, icon:Icon, label }) => {
        const on = active(id);
        return (
          <button key={id} className="flex flex-col items-center gap-[5px] py-0.5 px-4 relative"
            onClick={() => setScreen(id as Screen)}>
            <div className="w-9 h-9 rounded-[14px] flex items-center justify-center transition-all duration-200"
              style={{ background:on?"rgba(200,212,236,0.1)":"transparent" }}>
              <Icon size={18} style={{ color:on?c.silver:c.silverFaint, strokeWidth:on?2:1.6 }} />
            </div>
            {on && (
              <motion.div layoutId="navDot" className="absolute -bottom-1 w-1 h-1 rounded-full"
                style={{ background:c.silver }} transition={{ type:"spring", stiffness:500, damping:30 }} />
            )}
            <span style={{ fontFamily:f.ui, fontSize:"10px", fontWeight:on?500:400,
              color:on?c.silver:c.silverFaint, letterSpacing:"0.01em" }}>
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 1 — Onboarding hero
// ═══════════════════════════════════════════════════════════════════════════════
function Onboard1({ onNext }: { onNext:()=>void }) {
  const t = useT();
  return (
    <div className="relative h-full flex flex-col overflow-hidden" style={{ background:c.bg }}>
      <Nebula />
      <StarField />
      <div className="absolute bottom-[28%] left-0 right-0 h-[1px] pointer-events-none"
        style={{ background:"linear-gradient(90deg,transparent,rgba(164,184,216,0.06),transparent)" }} />
      <div className="relative z-10 flex flex-col h-full items-center justify-between px-8 pt-20 pb-12">
        {/* Logo */}
        <motion.div initial={{ opacity:0, y:-16, scale:0.92 }} animate={{ opacity:1, y:0, scale:1 }}
          transition={{ duration:1, ease:[0.22,1,0.36,1] }} className="flex flex-col items-center gap-3">
          <div className="relative w-[68px] h-[68px] rounded-[22px] flex items-center justify-center"
            style={{ background:"linear-gradient(145deg,var(--c-btn-bg-start) 0%,var(--c-btn-bg-end) 100%)",
              border:"1px solid var(--c-btn-border)",
              boxShadow:"0 0 36px var(--c-btn-glow), inset 0 1px 0 rgba(255,255,255,0.08)" }}>
            <Sparkles size={28} style={{ color:c.silver, strokeWidth:1.3 }} />
            <div className="absolute inset-0 rounded-[22px] pointer-events-none"
              style={{ background:"radial-gradient(circle at 40% 30%,rgba(255,255,255,0.06) 0%,transparent 60%)" }} />
          </div>
          <span style={{ fontFamily:f.display, fontSize:"16px", letterSpacing:"0.22em",
            color:c.silverMid, textTransform:"uppercase" }}>Zentra</span>
        </motion.div>

        {/* Hero */}
        <motion.div initial={{ opacity:0, y:28 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:1, delay:0.32, ease:[0.22,1,0.36,1] }}
          className="text-center flex flex-col gap-5 max-w-[300px]">
          <h1 style={{ fontFamily:f.display, fontSize:"33px", fontWeight:400,
            lineHeight:"1.36", color:c.text, letterSpacing:"0.01em" }}>
            {t.onb1_headline[0]}<br />
            <span style={{ color:c.silverMid, fontStyle:"italic" }}>{t.onb1_headline[1]}</span><br />
            {t.onb1_headline[2]}
          </h1>
          <p style={{ fontFamily:f.ui, fontSize:"14px", lineHeight:"1.75", color:c.textMid, fontWeight:300 }}>
            {t.onb1_sub}
          </p>
        </motion.div>

        {/* CTA */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
          transition={{ duration:0.9, delay:0.62, ease:[0.22,1,0.36,1] }}
          className="w-full flex flex-col gap-3">
          <motion.button onClick={onNext} className="w-full py-4 rounded-2xl"
            style={{ fontFamily:f.ui, fontSize:"15px", fontWeight:500, color:c.text, letterSpacing:"0.02em",
              background:"linear-gradient(135deg,var(--c-btn-bg-start) 0%,var(--c-btn-bg-end) 100%)",
              border:"1px solid var(--c-btn-border)",
              boxShadow:"0 0 36px var(--c-btn-glow), inset 0 1px 0 rgba(255,255,255,0.07)" }}
            whileTap={{ scale:0.97 }}>
            {t.onb1_cta}
          </motion.button>
          <p className="text-center" style={{ fontFamily:f.ui, fontSize:"11px", fontWeight:300, color:c.textFaint }}>
            {t.onb1_privacy}
          </p>
        </motion.div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 2 — Choose Style (Theme + Language)
// ═══════════════════════════════════════════════════════════════════════════════
const THEME_PREVIEW: Record<ThemeKey, { bg:string; silver:string; accent:string }> = {
  cinderela: { bg:"#06091A", silver:"#C8D4EC", accent:"#BF88A8" },
  neutro:    { bg:"#0C110A", silver:"#B8D4B0", accent:"#88B878" },
  onyx:      { bg:"#0E0A07", silver:"#E8B86D", accent:"#C4882A" },
  indigo:    { bg:"#0A0814", silver:"#C4B5FD", accent:"#F97316" },
};

const LANG_FLAGS: Record<LangKey, string> = { pt:"PT", es:"ES", en:"EN" };
const LANG_NAMES: Record<LangKey, string> = { pt:"Português", es:"Español", en:"English" };

function OnboardStyle({ onNext }: { onNext:()=>void }) {
  const { prefs, setPrefs } = usePrefs();
  const t = useT();

  const setTheme = (th: ThemeKey) => setPrefs({ ...prefs, theme: th });
  const setLang  = (lg: LangKey)  => setPrefs({ ...prefs, lang: lg });

  return (
    <div className="relative h-full flex flex-col overflow-hidden" style={{ background:c.bg }}>
      <StarField />
      <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background:"radial-gradient(ellipse 100% 80% at 50% 0%,var(--c-top-glow) 0%,transparent 100%)" }} />
      <div className="relative z-10 flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth:"none" }}>
        <div style={{ paddingBottom:44 }}>
          <TopBar />
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7 }} className="px-6 pt-3 pb-5">
            <h2 style={{ fontFamily:f.display, fontSize:"28px", fontWeight:400,
              color:c.text, lineHeight:1.3, letterSpacing:"0.01em" }}>
              {t.onb_style_title[0]}<br />
              <span style={{ color:c.silverMid, fontStyle:"italic" }}>{t.onb_style_title[1]}</span>
            </h2>
            <p className="mt-2" style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:300, color:c.textMid }}>
              {t.onb_style_sub}
            </p>
          </motion.div>

          {/* Theme selector */}
          <div className="px-5 mb-6">
            <p className="mb-3" style={{ fontFamily:f.ui, fontSize:"10px", letterSpacing:"0.18em",
              color:c.silverFaint, textTransform:"uppercase", fontWeight:500 }}>
              {t.theme_title}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {(Object.keys(THEMES) as ThemeKey[]).map((th, i) => {
                const prev = THEME_PREVIEW[th];
                const on   = prefs.theme === th;
                return (
                  <motion.div key={th} initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
                    transition={{ delay:i*0.07 }}
                    onClick={() => setTheme(th)}
                    className="relative rounded-2xl cursor-pointer overflow-hidden"
                    style={{ border:`1.5px solid ${on?prev.silver+"50":"rgba(200,212,236,0.08)"}`,
                      background:prev.bg, padding:"14px 14px 12px",
                      boxShadow:on?`0 0 20px ${prev.accent}20`:"none",
                      transition:"all 0.2s" }}>
                    {/* Mini palette dots */}
                    <div className="flex gap-1.5 mb-3">
                      {[prev.silver, prev.accent, prev.bg=="#06091A"?"#6E8AC8":"#7BAA8C"].map((col,j) => (
                        <div key={j} className="w-3.5 h-3.5 rounded-full border border-white/10"
                          style={{ background:col }} />
                      ))}
                    </div>
                    <p style={{ fontFamily:f.display, fontSize:"14px", fontWeight:400, color:prev.silver }}>
                      {t.themes[th]}
                    </p>
                    <p style={{ fontFamily:f.ui, fontSize:"10px", fontWeight:300, color:prev.silver+"80", marginTop:2 }}>
                      {t.theme_desc[th]}
                    </p>
                    {on && (
                      <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background:prev.silver }}>
                        <Check size={10} strokeWidth={3} style={{ color:prev.bg }} />
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Language selector */}
          <div className="px-5 mb-7">
            <p className="mb-3" style={{ fontFamily:f.ui, fontSize:"10px", letterSpacing:"0.18em",
              color:c.silverFaint, textTransform:"uppercase", fontWeight:500 }}>
              {t.lang_title}
            </p>
            <div className="flex gap-3">
              {(["pt","es","en"] as LangKey[]).map(lg => {
                const on = prefs.lang === lg;
                return (
                  <motion.button key={lg} onClick={() => setLang(lg)}
                    className="flex-1 py-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all duration-200"
                    style={{ background:on?"var(--c-btn-bg-start)":"rgba(255,255,255,0.025)",
                      border:on?"1px solid var(--c-btn-border)":"1px solid var(--c-glass-border)" }}
                    whileTap={{ scale:0.95 }}>
                    <span style={{ fontFamily:f.display, fontSize:"18px", fontWeight:400, letterSpacing:"0.05em" }}>{LANG_FLAGS[lg]}</span>
                    <span style={{ fontFamily:f.ui, fontSize:"11px", fontWeight:on?500:300,
                      color:on?c.text:c.textFaint }}>
                      {LANG_NAMES[lg]}
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* CTA */}
          <div className="px-5">
            <motion.button onClick={onNext} className="w-full py-4 rounded-2xl"
              style={{ fontFamily:f.ui, fontSize:"15px", fontWeight:500, color:c.text,
                background:"linear-gradient(135deg,var(--c-btn-bg-start) 0%,var(--c-btn-bg-end) 100%)",
                border:"1px solid var(--c-btn-border)",
                boxShadow:"0 0 30px var(--c-btn-glow)" }}
              whileTap={{ scale:0.97 }}>
              {t.onb_style_cta}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 3 — Choose spaces
// ═══════════════════════════════════════════════════════════════════════════════
function Onboard2({ onDone }: { onDone:()=>void }) {
  const { prefs, setPrefs } = usePrefs();
  const t = useT();
  const [sel, setSel] = useState(prefs.spaces);
  const toggle = (id:string) => setSel(p => p.includes(id)?p.filter(x=>x!==id):[...p,id]);

  const finish = () => {
    const updated = { ...prefs, spaces:sel };
    setPrefs(updated);
    localStorage.setItem("zentra-prefs", JSON.stringify(updated));
    onDone();
  };

  const spaceLabel = (id:string) => (t.spaces_label as any)[id] ?? id;
  

  return (
    <div className="relative h-full flex flex-col overflow-hidden" style={{ background:c.bg }}>
      <StarField />
      <div className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{ background:"radial-gradient(ellipse 100% 80% at 50% 0%,var(--c-top-glow) 0%,transparent 100%)" }} />
      <div className="relative z-10 flex flex-col h-full overflow-y-auto" style={{ scrollbarWidth:"none" }}>
        <div style={{ paddingBottom:44 }}>
          <TopBar />
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            transition={{ duration:0.7 }} className="px-6 pt-3 pb-6">
            <h2 style={{ fontFamily:f.display, fontSize:"28px", fontWeight:400,
              color:c.text, lineHeight:1.3, letterSpacing:"0.01em" }}>
              {t.spaces_title[0]}<br />
              <span style={{ color:c.silverMid, fontStyle:"italic" }}>{t.spaces_title[1]}</span>
            </h2>
            <p className="mt-2" style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:300, color:c.textMid }}>
              {t.spaces_sub}
            </p>
          </motion.div>

          <div className="px-5 grid grid-cols-3 gap-3 mb-5">
            {SPACE_DATA.map((s,i) => {
              const Icon = s.icon; const on = sel.includes(s.id);
              return (
                <motion.div key={s.id} initial={{ opacity:0, y:18 }} animate={{ opacity:1, y:0 }}
                  transition={{ duration:0.5, delay:i*0.06 }} onClick={() => toggle(s.id)}
                  className="relative flex flex-col items-center gap-2 py-4 rounded-2xl cursor-pointer"
                  style={{ background:on?`${s.color}13`:"rgba(255,255,255,0.025)",
                    border:on?`1px solid ${s.color}35`:"1px solid var(--c-glass-border)",
                    boxShadow:on?`0 0 20px ${s.color}12`:"none", transition:"all 0.2s ease" }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ background:on?`${s.color}1C`:"rgba(255,255,255,0.04)",
                      border:`1px solid ${on?s.color+"28":"var(--c-glass-border)"}` }}>
                    <Icon size={18} style={{ color:on?s.color:c.silverFaint, strokeWidth:1.5 }} />
                  </div>
                  <span style={{ fontFamily:f.ui, fontSize:"12px", fontWeight:on?500:400,
                    color:on?c.text:c.textFaint }}>
                    {spaceLabel(s.id)}
                  </span>
                  {on && (
                    <motion.div initial={{ scale:0 }} animate={{ scale:1 }}
                      className="absolute top-2 right-2 w-4 h-4 rounded-full flex items-center justify-center"
                      style={{ background:s.color }}>
                      <Check size={9} strokeWidth={3} style={{ color:"#fff" }} />
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <div className="px-5 mb-7">
            <GlassCard className="px-4 py-3 flex items-center gap-3 cursor-pointer">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ border:`1px dashed ${c.silverFaint}` }}>
                <Plus size={14} style={{ color:c.silverFaint }} />
              </div>
              <span style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:300, color:c.textFaint }}>
                {t.spaces_add}
              </span>
            </GlassCard>
          </div>

          <div className="px-5">
            <motion.button onClick={finish} className="w-full py-4 rounded-2xl"
              style={{ fontFamily:f.ui, fontSize:"15px", fontWeight:500, color:c.text,
                background:"linear-gradient(135deg,var(--c-btn-bg-start) 0%,var(--c-btn-bg-end) 100%)",
                border:"1px solid var(--c-btn-border)",
                boxShadow:"0 0 30px var(--c-btn-glow)" }}
              whileTap={{ scale:0.97 }}>
              {t.spaces_cta}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 4 — Home
// ═══════════════════════════════════════════════════════════════════════════════
// Tasks are loaded from Supabase in HomeScreen

type TaskRow = { id: string; text: string; cat: string; prio: string; due: string|null; done: boolean; notes: string|null };

function HomeScreen({ setScreen }: { setScreen:(s:Screen)=>void }) {
  const t = useT();
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const hour = new Date().getHours();

  const todayISO = new Date().toISOString().slice(0,10);

  useEffect(() => {
    // Load today's + overdue pending tasks
    sbGet("tasks", `done=eq.false&or=(due.lte.${todayISO},due.is.null)&order=prio.asc&limit=20`)
      .then(rows => setTasks(rows))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const done    = tasks.filter(r => r.done).length;
  const total   = tasks.length;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  const toggle = async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newDone = !task.done;
    setTasks(p => p.map(r => r.id === id ? { ...r, done: newDone } : r));
    await sbPatch("tasks", `id=eq.${id}`, {
      done: newDone,
      completed_at: newDone ? new Date().toISOString() : null,
    });
  };

  const spaceColor = (cat: string) => SPACE_COLOR[cat] ?? c.silverMid;
  const spaceLabel = (id:string) => (t.spaces_label as any)[id] ?? id;
  

  const todayTasks = tasks.filter(r => r.due === todayISO || !r.due);
  const upcomingTasks = tasks.filter(r => r.due && r.due > todayISO).slice(0, 4);

  return (
    <div className="relative h-full flex flex-col" style={{ background:c.bg }}>
      <StarField />
      <div className="absolute top-0 left-0 right-0 h-48 pointer-events-none"
        style={{ background:"radial-gradient(ellipse 100% 70% at 50% 0%,var(--c-top-glow) 0%,transparent 100%)" }} />
      <div className="relative z-10 flex flex-col h-full overflow-y-auto pb-28" style={{ scrollbarWidth:"none" }}>
        <TopBar />

        {/* Greeting */}
        <div className="px-5 pb-4">
          <GlassCard className="p-5" high
            style={{ background:"linear-gradient(135deg,var(--c-btn-bg-start) 0%,var(--c-btn-bg-end) 100%)",
              border:"1px solid var(--c-btn-border)",
              boxShadow:"0 4px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)" }}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p style={{ fontFamily:f.ui, fontSize:"12px", fontWeight:300, color:c.textMid }}>
                  {new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}
                </p>
                <h1 style={{ fontFamily:f.display, fontSize:"24px", fontWeight:400,
                  color:c.text, marginTop:2, letterSpacing:"0.01em" }}>
                  {t.greet(hour)},{" "}
                  <span style={{ color:c.silverMid, fontStyle:"italic" }}>Gabi</span>
                </h1>
                <p className="mt-2" style={{ fontFamily:f.ui, fontSize:"12px", fontWeight:300, color:c.textFaint }}>
                  {t.tasks_done(done, tasks.length)}
                </p>
              </div>
              {/* Radial progress */}
              <div className="relative w-12 h-12 flex-shrink-0">
                <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
                  <circle cx="22" cy="22" r="18" fill="none" stroke="var(--c-border)" strokeWidth="3" />
                  <motion.circle cx="22" cy="22" r="18" fill="none" stroke={c.silver} strokeWidth="3"
                    strokeLinecap="round" strokeDasharray={`${2*Math.PI*18}`}
                    initial={{ strokeDashoffset:2*Math.PI*18 }}
                    animate={{ strokeDashoffset:2*Math.PI*18*(1-pct/100) }}
                    transition={{ duration:1, delay:0.3, ease:"easeOut" }} />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span style={{ fontFamily:f.ui, fontSize:"11px", fontWeight:600, color:c.silver }}>
                    {pct}%
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-4 h-[1.5px] rounded-full overflow-hidden" style={{ background:"var(--c-border)" }}>
              <motion.div className="h-full rounded-full"
                style={{ background:"linear-gradient(90deg,var(--c-silver-mid),var(--c-silver))" }}
                initial={{ width:0 }} animate={{ width:`${pct}%` }}
                transition={{ duration:1, delay:0.2, ease:"easeOut" }} />
            </div>
          </GlassCard>
        </div>

        {/* Today tasks */}
        <div className="px-5 mb-5">
          <Eyebrow>{t.section.today}</Eyebrow>
          {loading && (
            <div className="flex justify-center py-6">
              {[0,0.15,0.3].map(d => (
                <motion.div key={d} className="w-1.5 h-1.5 rounded-full mx-1"
                  style={{ background: c.silverMid }}
                  animate={{ scale:[1,1.5,1], opacity:[0.3,1,0.3] }}
                  transition={{ duration:0.9, delay:d, repeat:Infinity }} />
              ))}
            </div>
          )}
          {!loading && todayTasks.length === 0 && (
            <GlassCard className="px-4 py-4 text-center">
              <p style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:300, color:c.textFaint }}>
                ✨ All clear for today
              </p>
            </GlassCard>
          )}
          <div className="flex flex-col gap-2.5">
            {todayTasks.map((task,i) => {
              const col = spaceColor(task.cat);
              return (
                <motion.div key={task.id} initial={{ opacity:0, x:-14 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:i*0.05, duration:0.5, ease:"easeOut" }}>
                  <GlassCard className="px-4 py-3.5 flex items-center gap-3"
                    style={{ opacity:task.done?0.48:1, transition:"opacity 0.2s" }}
                    onClick={() => toggle(task.id)}>
                    <div className="w-[20px] h-[20px] rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-250"
                      style={{ background:task.done?col:"transparent",
                        border:`1.5px solid ${task.done?col:c.silverFaint}` }}>
                      {task.done && <Check size={10} strokeWidth={2.5} style={{ color:"#fff" }} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p style={{ fontFamily:f.ui, fontSize:"14px", fontWeight:400,
                        color:task.done?c.textFaint:c.text,
                        textDecoration:task.done?"line-through":"none",
                        overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {task.text}
                      </p>
                      {task.due && (
                        <p style={{ fontFamily:f.ui, fontSize:"11px", fontWeight:300, color:c.textFaint, marginTop:1 }}>
                          {task.due < todayISO ? "⚠ overdue" : task.due}
                        </p>
                      )}
                    </div>
                    <Chip label={spaceLabel(task.cat)} color={col} />
                  </GlassCard>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Upcoming */}
        {upcomingTasks.length > 0 && (
          <div className="mb-5">
            <div className="px-5"><Eyebrow>{t.section.upcoming}</Eyebrow></div>
            <div className="flex gap-3 pl-5 pr-5 overflow-x-auto" style={{ scrollbarWidth:"none" }}>
              {upcomingTasks.map(item => {
                const col = spaceColor(item.cat);
                const spaceInfo = SPACE_DATA.find(s => s.id === item.cat);
                return (
                  <GlassCard key={item.id} className="flex-shrink-0 p-4"
                    style={{ width:170, border:`1px solid ${col}1A` }}>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center mb-3"
                      style={{ background:`${col}18`, border:`1px solid ${col}28` }}>
                      {spaceInfo && React.createElement(spaceInfo.icon, { size:13, style:{ color:col, strokeWidth:1.5 } })}
                    </div>
                    <p style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:500, color:c.text, lineHeight:1.3 }}>
                      {item.text}
                    </p>
                    <p className="mt-1" style={{ fontFamily:f.ui, fontSize:"10px", fontWeight:300, color:col }}>
                      {item.due}
                    </p>
                  </GlassCard>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* FAB */}
      <motion.button className="absolute z-20 rounded-full flex items-center justify-center"
        style={{ bottom:100, right:22, width:52, height:52,
          background:"linear-gradient(145deg,var(--c-btn-bg-start) 0%,var(--c-btn-bg-end) 100%)",
          border:"1px solid var(--c-btn-border)",
          boxShadow:"0 4px 24px rgba(0,0,0,0.4), 0 0 24px var(--c-btn-glow)" }}
        whileTap={{ scale:0.87 }} whileHover={{ scale:1.06 }}>
        <Plus size={22} style={{ color:c.silver, strokeWidth:1.8 }} />
      </motion.button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 5 — Chat
// ═══════════════════════════════════════════════════════════════════════════════

const GROQ_SYSTEM = `Você é a assistente de IA do Zentra, app de produtividade pessoal da Gabriela (Gabi).
Gabi é brasileira, mora no Uruguai, se muda para São Paulo em julho de 2026.
Ela tem tarefas, contas, gastos e registros de saúde.
Hoje é ${new Date().toISOString().slice(0,10)}.

REGRA MAIS IMPORTANTE: SEMPRE responda no mesmo idioma que a Gabi escreveu.
- Se ela escreveu em português → responda em português
- Se ela escreveu em espanhol → responda em espanhol
- Se ela escreveu em inglês → responda em inglês
NUNCA responda em inglês se ela escreveu em português. NUNCA escreva "Done!" — isso é proibido.

Categorias de tarefas (use o id exato no campo "cat"):
- brinta = trabalho
- cliente = clientes
- pessoal = pessoal
- estudo = estudos
- saude = saúde
- financas = finanças
- casa = casa
- compras = compras

Quando a usuária mandar uma mensagem, responda com APENAS JSON válido (sem markdown):
{
  "reply": "resposta curta e amigável NO MESMO IDIOMA que a usuária escreveu",
  "action": {
    "type": "add_task" | "complete_task" | "log_health" | "add_expense" | "none",
    "data": {}
  },
  "badge": { "space": "saude|brinta|financas|pessoal|estudo|casa|compras|cliente|reminder", "note": "descrição curta do que foi feito, NO MESMO IDIOMA da usuária" }
}

Formatos do campo data por tipo de ação:
- add_task: { text, cat ("brinta"|"cliente"|"pessoal"|"estudo"|"saude"|"financas"|"casa"|"compras"), prio ("alta"|"media"|"baixa"), due (data ISO ou null) }
- complete_task: { text_hint (parte do nome da tarefa) }
- log_health: { tipo ("academia"|"peso"|"alimentacao"|"sono"|"agua"), valor, notas, data (data ISO) }
- add_expense: { descricao, val (número), cur ("BRL"|"UYU"|"USD"), cat, banco ("nubank"|"itau") }
- none: {}

Exemplos de respostas corretas em português:
- "presente lari" → add_task, cat: "compras", reply: "Anotei! Presente para a Lari adicionado nas compras 🎁"
- "academia hoje musculação 380cal" → log_health, tipo: "academia", reply: "Treino registrado! 💪 380cal de musculação hoje."
- "pagar conta luz" → add_task, cat: "financas", reply: "Conta de luz adicionada nas finanças!"

Seja calorosa, prática e breve (1-2 frases).`;

type ChatMsg = {
  id: number;
  role: "user" | "ai";
  text: string;
  badge?: { space: string; color: string; note: string };
};

const BADGE_COLORS: Record<string, string> = {
  health:"#BF88A8", work:"#6E8AC8", finance:"#7BAA8C",
  personal:"#BFA070", reminder:"#9880C4", shopping:"#9880C4",
};

const CHAT_CHIPS = ["academia feita","anotar compra","quanto gastei esse mês","nova tarefa"];

function ChatScreen() {
  const t = useT();
  const { prefs } = usePrefs();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const executeAction = async (type: string, data: any) => {
    const today = new Date().toISOString().slice(0,10);
    if (type === "add_task") {
      await sbPost("tasks", { text: data.text, cat: data.cat ?? "pessoal", prio: data.prio ?? "media", due: data.due ?? null, done: false });
    } else if (type === "log_health") {
      await sbPost("registros", { tipo: data.tipo, valor: String(data.valor ?? ""), notas: data.notas ?? null, data: data.data ?? today });
    } else if (type === "add_expense") {
      await sbPost("gastos", { descricao: data.descricao, val: data.val, cur: data.cur ?? "BRL", cat: data.cat ?? "outro", data: today, banco: data.banco ?? "nubank" });
    } else if (type === "complete_task") {
      const hint = (data.text_hint ?? "").toLowerCase();
      const rows = await sbGet("tasks", `done=eq.false&text=ilike.*${encodeURIComponent(hint)}*&limit=1`);
      if (rows.length > 0) {
        await sbPatch("tasks", `id=eq.${rows[0].id}`, { done: true, completed_at: new Date().toISOString() });
      }
    }
  };

  const send = async (val?: string) => {
    const text = (val ?? input).trim();
    if (!text) return;
    setInput("");
    setMsgs(p => [...p, { id: Date.now(), role: "user", text }]);
    setThinking(true);

    try {
      const langHint = prefs.lang === "pt"
        ? "IMPORTANTE: Responda SOMENTE em português brasileiro. Nunca em inglês."
        : prefs.lang === "es"
        ? "IMPORTANTE: Responde SOLO en español. Nunca en inglés."
        : "IMPORTANT: Respond ONLY in English.";
      const msgWithLang = `${langHint}\n\n${text}`;
      const history = msgs.slice(-8).map(m => ({ role: m.role === "user" ? "user" : "assistant", content: m.text }));
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: { "Authorization": `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [{ role: "system", content: GROQ_SYSTEM }, ...history, { role: "user", content: msgWithLang }],
          temperature: 0.4,
          max_tokens: 400,
        }),
      });
      const json = await res.json();
      const raw = json.choices?.[0]?.message?.content ?? "{}";
      let parsed: any = {};
      try { parsed = JSON.parse(raw); } catch { parsed = { reply: raw, action: { type:"none" }, badge: { space:"reminder", note:"✨" } }; }

      if (parsed.action?.type && parsed.action.type !== "none") {
        await executeAction(parsed.action.type, parsed.action.data ?? {});
      }

      const badgeSpace = parsed.badge?.space ?? "reminder";
      const aiMsg: ChatMsg = {
        id: Date.now() + 1,
        role: "ai",
        text: parsed.reply ?? (prefs.lang === "pt" ? "Feito!" : prefs.lang === "es" ? "¡Listo!" : "Done!"),
        badge: { space: badgeSpace, color: BADGE_COLORS[badgeSpace] ?? "#7BAA8C", note: parsed.badge?.note ?? "" },
      };
      setMsgs(p => [...p, aiMsg]);
    } catch {
      setMsgs(p => [...p, { id: Date.now() + 1, role: "ai", text: "Connection error — check your internet." }]);
    } finally {
      setThinking(false);
    }
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior:"smooth" }); }, [msgs,thinking]);

  return (
    <div className="relative h-full flex flex-col" style={{ background:c.bg }}>
      <StarField />
      <div className="relative z-10 flex flex-col h-full">
        <TopBar />
        <div className="px-6 pt-1 pb-4">
          <div className="flex items-center gap-2">
            <h1 style={{ fontFamily:f.display, fontSize:"22px", fontWeight:400, color:c.text }}>
              {t.chat_understand[0]}{" "}
              <span style={{ color:c.silverMid, fontStyle:"italic" }}>{t.chat_understand[1]}</span>
            </h1>
            <motion.div className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background:c.chartAlt, marginBottom:2 }}
              animate={{ opacity:[0.4,1,0.4] }} transition={{ duration:2, repeat:Infinity, ease:"easeInOut" }} />
          </div>
          <p style={{ fontFamily:f.ui, fontSize:"12px", fontWeight:300, color:c.textFaint, marginTop:1 }}>
            {t.chat_sub}
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-3 flex flex-col gap-4" style={{ scrollbarWidth:"none" }}>
          <div className="flex justify-center mb-1">
            <GlassCard className="px-4 py-1.5">
              <span style={{ fontFamily:f.ui, fontSize:"11px", fontWeight:300, color:c.textFaint }}>
                {t.chat_date} · {new Date().toLocaleDateString()}
              </span>
            </GlassCard>
          </div>

          {msgs.length === 0 && (
            <div className="flex justify-center py-8">
              <p style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:300, color:c.textFaint, textAlign:"center" }}>
                ✨ Pode falar comigo em português, español ou English
              </p>
            </div>
          )}
          {msgs.map((msg, i) => (
            <motion.div key={msg.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i < 3 ? i * 0.06 : 0, duration:0.4 }}
              className={`flex flex-col gap-1.5 ${msg.role === "user" ? "items-end" : "items-start"}`}>
              <div className="max-w-[82%] px-4 py-2.5 rounded-2xl"
                style={{
                  background: msg.role === "user" ? "rgba(200,212,236,0.09)" : "rgba(255,255,255,0.04)",
                  border: msg.role === "user" ? "1px solid rgba(200,212,236,0.13)" : "1px solid var(--c-glass-border)",
                  borderBottomRightRadius: msg.role === "user" ? 4 : undefined,
                  borderBottomLeftRadius: msg.role === "ai" ? 4 : undefined,
                }}>
                <p style={{ fontFamily:f.ui, fontSize:"14px", fontWeight:400, color:c.text }}>{msg.text}</p>
              </div>
              {msg.role === "ai" && msg.badge?.note && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl rounded-tl-sm"
                  style={{ maxWidth:"90%", background:`${msg.badge.color}0D`, border:`1px solid ${msg.badge.color}20` }}>
                  <Check size={11} strokeWidth={2.5} style={{ color:msg.badge.color, flexShrink:0 }} />
                  <span style={{ fontFamily:f.ui, fontSize:"11px", fontWeight:400, color:msg.badge.color }}>
                    {msg.badge.note}
                  </span>
                  <Chip label={(t.spaces_label as any)[msg.badge.space] ?? msg.badge.space} color={msg.badge.color} />
                </div>
              )}
            </motion.div>
          ))}

          <AnimatePresence>
            {thinking && (
              <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-4 }}
                className="flex items-center gap-2 px-3 py-2.5 rounded-2xl self-start"
                style={{ background:"rgba(200,212,236,0.06)", border:"1px solid var(--c-glass-border)" }}>
                {[0,0.18,0.36].map(d => (
                  <motion.div key={d} className="w-1.5 h-1.5 rounded-full" style={{ background:c.silverMid }}
                    animate={{ scale:[1,1.6,1], opacity:[0.4,1,0.4] }}
                    transition={{ duration:0.9, delay:d, repeat:Infinity }} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={endRef} />
        </div>

        <div className="px-5 pb-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth:"none" }}>
          {CHAT_CHIPS.map(s => (
            <button key={s} onClick={() => send(s)} className="flex-shrink-0 px-3 py-1.5 rounded-full"
              style={{ fontFamily:f.ui, fontSize:"12px", fontWeight:300, color:c.silverMid,
                background:"var(--c-glass-bg)", border:"1px solid var(--c-glass-border)", whiteSpace:"nowrap" }}>
              {s}
            </button>
          ))}
        </div>

        <div className="px-4 pb-28 pt-1">
          <GlassCard className="flex items-center gap-3 px-4 py-3.5"
            style={{ border:"1px solid var(--c-btn-border)", boxShadow:"0 0 24px var(--c-btn-glow)" }}>
            <input value={input} onChange={e=>setInput(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&send()} placeholder={t.chat_placeholder}
              className="flex-1 bg-transparent outline-none"
              style={{ fontFamily:f.ui, fontSize:"14px", fontWeight:300, color:c.text }} />
            <motion.button onClick={()=>send()} className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background:input.trim()?"var(--c-glass-bg)":"transparent",
                border:`1px solid ${input.trim()?"var(--c-glass-border)":"transparent"}`,
                transition:"all 0.2s" }}
              whileTap={{ scale:0.87 }}>
              <Send size={14} style={{ color:input.trim()?c.silver:c.textFaint, strokeWidth:1.8 }} />
            </motion.button>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 6 — Spaces grid
// ═══════════════════════════════════════════════════════════════════════════════
function SpacesScreen({ setScreen, openSpace }:
  { setScreen:(s:Screen)=>void; openSpace:(id:string)=>void }) {
  const { prefs } = usePrefs();
  const t = useT();
  const [editMode, setEditMode] = useState(false);
  const activeSpaces = SPACE_DATA.filter(s => prefs.spaces.includes(s.id));
  const spaceLabel = (id:string) => (t.spaces_label as any)[id] ?? id;
  

  return (
    <div className="relative h-full flex flex-col" style={{ background:c.bg }}>
      <StarField />
      <div className="relative z-10 flex flex-col h-full overflow-y-auto pb-28" style={{ scrollbarWidth:"none" }}>
        <TopBar />
        <div className="flex items-center justify-between px-6 pt-1 pb-5">
          <h1 style={{ fontFamily:f.display, fontSize:"26px", fontWeight:400, color:c.text, letterSpacing:"0.01em" }}>
            {t.your_spaces[0]}{" "}
            <span style={{ color:c.silverMid, fontStyle:"italic" }}>{t.your_spaces[1]}</span>
          </h1>
          <button onClick={() => setEditMode(!editMode)}
            className="px-3 py-1.5 rounded-full flex items-center gap-1.5"
            style={{ background:editMode?"rgba(200,212,236,0.15)":"rgba(200,212,236,0.05)",
              border:`1px solid ${editMode?"var(--c-btn-border)":"var(--c-glass-border)"}`,
              transition:"all 0.2s" }}>
            {editMode
              ? <Check size={13} style={{ color:c.text }} />
              : <SlidersHorizontal size={13} style={{ color:c.silverMid }} />}
            <span style={{ fontFamily:f.ui, fontSize:"12px", fontWeight:400, color:editMode?c.text:c.silverMid }}>
              {editMode ? t.done_btn : t.organize}
            </span>
          </button>
        </div>

        <div className="px-5 flex flex-col gap-3">
          {activeSpaces.map((s,i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
                transition={{ delay:i*0.05, duration:0.4 }}>
                <GlassCard className="px-4 py-3.5 flex items-center gap-4 relative"
                  style={{ border:`1px solid ${s.color}18`,
                    background:`linear-gradient(90deg,${s.color}08 0%,transparent 100%)`,
                    cursor:editMode?"grab":"pointer" }}
                  onClick={() => !editMode && openSpace(s.id)}>
                  {editMode && (
                    <motion.div initial={{ scale:0 }} animate={{ scale:1 }} className="flex-shrink-0 mr-1">
                      <GripVertical size={16} style={{ color:c.silverFaint }} />
                    </motion.div>
                  )}
                  <div className="w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0"
                    style={{ background:`${s.color}16`, border:`1px solid ${s.color}28` }}>
                    <Icon size={19} style={{ color:s.color, strokeWidth:1.5 }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ fontFamily:f.ui, fontSize:"15px", fontWeight:500, color:c.text }}>
                      {spaceLabel(s.id)}
                    </p>
                    <p style={{ fontFamily:f.ui, fontSize:"12px", fontWeight:300, color:c.textFaint, marginTop:2,
                      overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {s.hint}
                    </p>
                  </div>
                  {!editMode && (
                    <div className="flex-shrink-0 flex items-center gap-3">
                      <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center"
                        style={{ border:`1px solid ${s.color}20` }}>
                        <span style={{ fontFamily:f.ui, fontSize:"10px", fontWeight:600, color:s.color }}>
                          {s.pct}%
                        </span>
                      </div>
                      <ChevronRight size={16} style={{ color:c.silverFaint }} />
                    </div>
                  )}
                  {editMode && (
                    <motion.div initial={{ scale:0 }} animate={{ scale:1 }}>
                      <button className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ background:"rgba(232,90,106,0.1)", border:"1px solid rgba(232,90,106,0.2)", color:"#E85A6A" }}>
                        <Minus size={14} />
                      </button>
                    </motion.div>
                  )}
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        <div className="px-5 mt-4">
          <GlassCard className="p-4 flex items-center justify-center gap-2 cursor-pointer"
            style={{ border:`1px dashed ${c.silverFaint}` }}>
            <Plus size={15} style={{ color:c.silverMid }} />
            <span style={{ fontFamily:f.ui, fontSize:"14px", fontWeight:400, color:c.silverMid }}>
              {t.add_space}
            </span>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 7 — Space Detail
// ═══════════════════════════════════════════════════════════════════════════════
type SpaceBlock = { id:string; title:string; type:"goal"|"list"|"reminders"|"routine"|"tracker"; data:any };
const SPACE_BLOCKS: Record<string, SpaceBlock[]> = {
  health: [
    { id:"g1", title:"Daily Steps", type:"goal",
      data:{ current:6240, target:8000, unit:"steps", label:"Steps" } },
    { id:"r1", title:"Medications", type:"reminders",
      data:[{ id:"m1", label:"Vitamin D", done:true, time:"8:00 AM" },{ id:"m2", label:"Magnesium", done:false, time:"9:00 PM" }] },
    { id:"rt1", title:"Morning Routine", type:"routine",
      data:[{ id:"rt1_1", label:"Drink water", done:true },{ id:"rt1_2", label:"Stretching", done:true },{ id:"rt1_3", label:"Journal", done:false }] },
    { id:"l1", title:"Recent Workouts", type:"list",
      data:[{ id:"w1", label:"Yoga Flow", subtitle:"45 min · 280 kcal", date:"Today" },{ id:"w2", label:"Pilates", subtitle:"30 min · 150 kcal", date:"Yesterday" }] },
    { id:"t1", title:"Weight Tracking", type:"tracker",
      data:{ current:"62.4 kg", change:"-0.5 kg", label:"This month" } },
  ],
  finance: [
    { id:"g1", title:"Monthly Budget", type:"goal",
      data:{ current:1200, target:2000, unit:"$", label:"Spent" } },
    { id:"r1", title:"Upcoming Bills", type:"reminders",
      data:[{ id:"b1", label:"Water Bill", done:false, time:"May 28" },{ id:"b2", label:"Internet", done:false, time:"Jun 1" }] },
    { id:"l1", title:"Recent Expenses", type:"list",
      data:[{ id:"e1", label:"Whole Foods", subtitle:"Groceries", date:"Today", value:"-$84.20" },{ id:"e2", label:"Uber", subtitle:"Transport", date:"Yesterday", value:"-$15.50" }] },
    { id:"t1", title:"Investments", type:"tracker",
      data:{ current:"$14,250", change:"+2.4%", label:"Total return" } },
  ],
};

function BlockWrapper({ title, color, children }: { title:string; color:string; children:React.ReactNode }) {
  return (
    <GlassCard className="p-4" style={{ border:`1px solid ${color}1A`, background:"rgba(255,255,255,0.02)" }}>
      <div className="flex items-center justify-between mb-3.5">
        <h3 style={{ fontFamily:f.ui, fontSize:"14px", fontWeight:500, color:c.text }}>{title}</h3>
        <button className="opacity-50 hover:opacity-100 transition-opacity p-1">
          <MoreHorizontal size={14} style={{ color:c.silverMid }} />
        </button>
      </div>
      {children}
    </GlassCard>
  );
}

function SpaceDetailScreen({ spaceId, goBack }: { spaceId:string; goBack:()=>void }) {
  const t = useT();
  const space = SPACE_DATA.find(s=>s.id===spaceId)!;
  const [blockData, setBlockData] = useState<SpaceBlock[]>(SPACE_BLOCKS[spaceId] ?? []);
  const [liveLoaded, setLiveLoaded] = useState(false);
  const [tasks, setTasks] = useState<any[]>([]);
  const SPACE_TO_CAT: Record<string,string> = { shopping:"compras", work:"brinta", home:"casa", books:"estudo", personal:"pessoal" };
  const spaceLabel = (id:string) => (t.spaces_label as any)[id] ?? id;
  

  // Load real Supabase data for health + finance spaces
  useEffect(() => {
    if (liveLoaded) return;
    const today = new Date().toISOString().slice(0,10);

    const cat = SPACE_TO_CAT[spaceId];
    if (cat) {
      sbGet("tasks", `cat=eq.${cat}&done=eq.false&order=prio.asc&limit=20`)
        .then(rows => { setTasks(rows); setLiveLoaded(true); })
        .catch(() => setLiveLoaded(true));
      return;
    }

    if (spaceId === "health") {
      Promise.all([
        sbGet("registros", `tipo=eq.academia&order=data.desc&limit=5`),
        sbGet("registros", `tipo=eq.peso&order=data.desc&limit=2`),
        sbGet("registros", `tipo=eq.agua&data=eq.${today}&limit=1`),
      ]).then(([workouts, weights, agua]) => {
        setBlockData(prev => prev.map(b => {
          if (b.id === "l1" && workouts.length > 0) {
            return { ...b, data: workouts.map((w:any) => ({
              id: w.id, label: w.valor || "Treino", subtitle: w.notas ?? "", date: w.data,
            })) };
          }
          if (b.id === "t1" && weights.length > 0) {
            const latest = weights[0];
            const prev2 = weights[1];
            const change = prev2 ? ((parseFloat(latest.valor) - parseFloat(prev2.valor)).toFixed(1)) : null;
            return { ...b, data: { current:`${latest.valor} kg`, change: change ? `${change >= "0" ? "+" : ""}${change} kg` : "—", label:"vs last log" } };
          }
          if (b.id === "g1" && agua.length > 0) {
            // agua stored as ml
            return { ...b, data: { ...b.data, current: Math.round(parseFloat(agua[0].valor) / 250) } };
          }
          return b;
        }));
        setLiveLoaded(true);
      }).catch(() => setLiveLoaded(true));
    }

    if (spaceId === "finance") {
      Promise.all([
        sbGet("bills", `paid=eq.false&order=due.asc&limit=5`),
        sbGet("gastos", `order=created_at.desc&limit=5`),
      ]).then(([bills, expenses]) => {
        setBlockData(prev => prev.map(b => {
          if (b.id === "r1" && bills.length > 0) {
            return { ...b, data: bills.map((bill:any) => ({
              id: bill.id, label: bill.name,
              done: bill.paid,
              time: bill.due ?? "—",
            })) };
          }
          if (b.id === "l1" && expenses.length > 0) {
            return { ...b, data: expenses.map((e:any) => ({
              id: e.id,
              label: e.descricao,
              subtitle: e.cat ?? "gasto",
              date: e.data ?? "",
              value: `-${e.cur} ${parseFloat(e.val).toFixed(2)}`,
            })) };
          }
          return b;
        }));
        setLiveLoaded(true);
      }).catch(() => setLiveLoaded(true));
    }
  }, [spaceId]);

  const toggleItem = async (blockId:string, itemId:string) => {
    // Optimistic toggle
    setBlockData(prev => prev.map(b => {
      if (b.id !== blockId) return b;
      if (b.type==="reminders"||b.type==="routine") {
        return { ...b, data:b.data.map((it:any)=>it.id===itemId?{...it,done:!it.done}:it) };
      }
      return b;
    }));
    // Persist bills
    if (spaceId === "finance") {
      const block = blockData.find(b => b.id === blockId);
      if (block?.type === "reminders") {
        const item = block.data.find((it:any) => it.id === itemId);
        if (item) {
          await sbPatch("bills", `id=eq.${itemId}`, {
            paid: !item.done,
            paid_at: !item.done ? new Date().toISOString() : null,
          });
        }
      }
    }
  };

  if (!space) return null;
  const Icon = space.icon;

  return (
    <div className="relative h-full flex flex-col" style={{ background:c.bg }}>
      <StarField />
      <div className="relative z-10 flex flex-col h-full overflow-y-auto pb-10" style={{ scrollbarWidth:"none" }}>
        <TopBar />
        {/* Header */}
        <div className="px-5 pb-4 pt-1">
          <div className="flex items-center gap-3 mb-4">
            <motion.button onClick={goBack} whileTap={{ scale:0.9 }}
              className="w-9 h-9 rounded-2xl flex items-center justify-center"
              style={{ background:"rgba(200,212,236,0.06)", border:"1px solid var(--c-glass-border)" }}>
              <ArrowLeft size={16} style={{ color:c.silverMid }} />
            </motion.button>
          </div>
          <GlassCard className="p-5" high
            style={{ background:`linear-gradient(135deg,${space.color}0C 0%,${space.color}04 100%)`,
              border:`1px solid ${space.color}22` }}>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 rounded-[18px] flex items-center justify-center"
                style={{ background:`${space.color}1C`, border:`1px solid ${space.color}30` }}>
                <Icon size={24} style={{ color:space.color, strokeWidth:1.5 }} />
              </div>
              <div>
                <h1 style={{ fontFamily:f.display, fontSize:"24px", fontWeight:400, color:c.text, letterSpacing:"0.01em" }}>
                  {spaceLabel(spaceId)}
                </h1>
                <p style={{ fontFamily:f.ui, fontSize:"12px", fontWeight:300, color:c.textFaint, marginTop:2 }}>
                  {space.hint}
                </p>
              </div>
            </div>
            <div className="h-[2px] rounded-full overflow-hidden" style={{ background:`${space.color}18` }}>
              <motion.div className="h-full rounded-full" style={{ background:space.color }}
                initial={{ width:0 }} animate={{ width:`${space.pct}%` }}
                transition={{ duration:1, ease:"easeOut" }} />
            </div>
            <div className="flex justify-between mt-1.5">
              <span style={{ fontFamily:f.ui, fontSize:"10px", fontWeight:300, color:c.textFaint }}>Progress</span>
              <span style={{ fontFamily:f.ui, fontSize:"10px", fontWeight:600, color:space.color }}>{space.pct}%</span>
            </div>
          </GlassCard>
        </div>

        {/* Blocks */}
        <div className="px-5 flex flex-col gap-4">
          {SPACE_TO_CAT[spaceId] ? (
            tasks.length === 0 ? (
              <GlassCard className="p-8 flex flex-col items-center gap-3">
                <Icon size={20} style={{ color:space.color, strokeWidth:1.5 }} />
                <p style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:300, color:c.textFaint, textAlign:"center" }}>
                  Nenhuma tarefa ainda. Use o chat para adicionar!
                </p>
              </GlassCard>
            ) : tasks.map((task:any) => (
              <GlassCard key={task.id} className="px-4 py-3 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ border:`1.5px solid ${space.color}60` }}>
                </div>
                <p style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:400, color:c.text, flex:1 }}>
                  {task.text}
                </p>
              </GlassCard>
            ))
          ) : blockData.length === 0 ? (
            <GlassCard className="p-8 flex flex-col items-center gap-3">
              <Icon size={20} style={{ color:space.color, strokeWidth:1.5 }} />
              <p style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:300, color:c.textFaint, textAlign:"center" }}>
                Nenhuma tarefa ainda.
              </p>
            </GlassCard>
          ) : blockData.map((block) => (
            <motion.div key={block.id} initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }}
              transition={{ duration:0.4 }}>
              {/* Goal block */}
              {block.type==="goal" && (
                <BlockWrapper title={block.title} color={space.color}>
                  <div className="flex justify-between items-end mb-2">
                    <span style={{ fontFamily:f.display, fontSize:"28px", fontWeight:400, color:space.color }}>
                      {block.data.current.toLocaleString()}
                    </span>
                    <span style={{ fontFamily:f.ui, fontSize:"12px", fontWeight:300, color:c.textFaint }}>
                      / {block.data.target.toLocaleString()} {block.data.unit}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background:`${space.color}16` }}>
                    <motion.div className="h-full rounded-full" style={{ background:space.color }}
                      initial={{ width:0 }} animate={{ width:`${Math.min(block.data.current/block.data.target*100,100)}%` }}
                      transition={{ duration:1, ease:"easeOut" }} />
                  </div>
                </BlockWrapper>
              )}

              {/* Reminders / routine block */}
              {(block.type==="reminders"||block.type==="routine") && (
                <BlockWrapper title={block.title} color={space.color}>
                  <div className="flex flex-col gap-2">
                    {block.data.map((item:any) => (
                      <div key={item.id} className="flex items-center gap-3 cursor-pointer"
                        onClick={() => toggleItem(block.id, item.id)}>
                        <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-200"
                          style={{ background:item.done?space.color:"transparent",
                            border:`1.5px solid ${item.done?space.color:c.silverFaint}` }}>
                          {item.done && <Check size={9} strokeWidth={3} style={{ color:"#fff" }} />}
                        </div>
                        <p style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:400,
                          color:item.done?c.textFaint:c.text,
                          textDecoration:item.done?"line-through":"none", flex:1 }}>
                          {item.label}
                        </p>
                        {item.time && (
                          <span style={{ fontFamily:f.ui, fontSize:"10px", fontWeight:300, color:c.textFaint }}>
                            {item.time}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </BlockWrapper>
              )}

              {/* List block */}
              {block.type==="list" && (
                <BlockWrapper title={block.title} color={space.color}>
                  <div className="flex flex-col gap-2.5">
                    {block.data.map((item:any) => (
                      <div key={item.id} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center"
                          style={{ background:`${space.color}14`, border:`1px solid ${space.color}20` }}>
                          <Activity size={13} style={{ color:space.color, strokeWidth:1.5 }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:500, color:c.text }}>{item.label}</p>
                          <p style={{ fontFamily:f.ui, fontSize:"11px", fontWeight:300, color:c.textFaint }}>{item.subtitle}</p>
                        </div>
                        <div className="flex flex-col items-end">
                          <span style={{ fontFamily:f.ui, fontSize:"10px", fontWeight:300, color:c.textFaint }}>{item.date}</span>
                          {item.value && <span style={{ fontFamily:f.ui, fontSize:"12px", fontWeight:500, color:space.color }}>{item.value}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </BlockWrapper>
              )}

              {/* Tracker block */}
              {block.type==="tracker" && (
                <BlockWrapper title={block.title} color={space.color}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p style={{ fontFamily:f.display, fontSize:"28px", fontWeight:400, color:c.text }}>
                        {block.data.current}
                      </p>
                      <p style={{ fontFamily:f.ui, fontSize:"11px", fontWeight:300, color:c.textFaint }}>
                        {block.data.label}
                      </p>
                    </div>
                    <div className="px-3 py-1.5 rounded-full"
                      style={{ background:`${space.color}14`, border:`1px solid ${space.color}28` }}>
                      <span style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:600, color:space.color }}>
                        {block.data.change}
                      </span>
                    </div>
                  </div>
                </BlockWrapper>
              )}
            </motion.div>
          ))}

          {/* Add block */}
          <GlassCard className="p-4 flex items-center justify-center gap-2 cursor-pointer"
            style={{ border:`1px dashed ${c.silverFaint}` }}>
            <Plus size={15} style={{ color:c.silverMid }} />
            <span style={{ fontFamily:f.ui, fontSize:"14px", fontWeight:400, color:c.silverMid }}>
              Add a block
            </span>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SCREEN 8 — History
// ═══════════════════════════════════════════════════════════════════════════════
const WEEK_DATA = [
  { day:"Mon",tasks:4 },{ day:"Tue",tasks:7 },{ day:"Wed",tasks:3 },
  { day:"Thu",tasks:9 },{ day:"Fri",tasks:6 },{ day:"Sat",tasks:5 },{ day:"Sun",tasks:8 },
];
type TimelineItem = { id:string; time:string; label:string; space:string; color:string; isoDate:string };

function HistoryScreen() {
  const t = useT();
  const [filter, setFilter] = useState<Filter>("week");
  const [items, setItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const today = new Date();
    const todayISO = today.toISOString().slice(0,10);
    const weekAgo  = new Date(today); weekAgo.setDate(today.getDate()-7);
    const monthAgo = new Date(today); monthAgo.setDate(today.getDate()-30);
    const cutoff = monthAgo.toISOString().slice(0,10);

    Promise.all([
      sbGet("tasks", `done=eq.true&completed_at=gte.${cutoff}T00:00:00Z&order=completed_at.desc&limit=40`),
      sbGet("registros", `data=gte.${cutoff}&order=data.desc&limit=40`),
      sbGet("bills", `paid=eq.true&paid_at=gte.${cutoff}T00:00:00Z&order=paid_at.desc&limit=20`),
    ]).then(([tasks, regs, bills]) => {
      const all: TimelineItem[] = [];

      tasks.forEach((task:any) => {
        const d = (task.completed_at ?? "").slice(0,10);
        all.push({
          id: `t-${task.id}`, isoDate: d,
          time: fmtDate(d), label: task.text,
          space: task.cat ?? "pessoal", color: SPACE_COLOR[task.cat] ?? c.silverMid,
        });
      });
      regs.forEach((r:any) => {
        const d = r.data ?? "";
        const labelMap: Record<string,string> = { academia:"Treino", peso:"Peso registrado", alimentacao:"Alimentação", sono:"Sono", agua:"Água" };
        const note = r.notas ? ` — ${r.notas}` : r.valor ? ` ${r.valor}` : "";
        all.push({
          id: `r-${r.id}`, isoDate: d,
          time: fmtDate(d), label: `${labelMap[r.tipo] ?? r.tipo}${note}`,
          space: "health", color: "#BF88A8",
        });
      });
      bills.forEach((b:any) => {
        const d = (b.paid_at ?? "").slice(0,10);
        all.push({
          id: `b-${b.id}`, isoDate: d,
          time: fmtDate(d), label: `Pago: ${b.name}`,
          space: "finance", color: "#7BAA8C",
        });
      });

      all.sort((a,b) => b.isoDate.localeCompare(a.isoDate));
      setItems(all);
    }).catch(()=>{}).finally(()=>setLoading(false));
  }, []);

  function fmtDate(iso:string) {
    if (!iso) return "";
    const todayISO = new Date().toISOString().slice(0,10);
    const yestISO  = new Date(Date.now()-86400000).toISOString().slice(0,10);
    if (iso === todayISO) return "Hoje";
    if (iso === yestISO)  return "Ontem";
    return iso.slice(5).replace("-","/");
  }

  const todayISO   = new Date().toISOString().slice(0,10);
  const weekAgoISO = new Date(Date.now()-7*86400000).toISOString().slice(0,10);

  const filtered = items.filter(item => {
    if (filter==="today") return item.isoDate === todayISO;
    if (filter==="week")  return item.isoDate >= weekAgoISO;
    return true;
  });

  const spaceLabel = (id:string) => (t.spaces_label as any)[id] ?? id;
  

  return (
    <div className="relative h-full flex flex-col" style={{ background:c.bg }}>
      <StarField />
      <div className="relative z-10 flex flex-col h-full overflow-y-auto pb-28" style={{ scrollbarWidth:"none" }}>
        <TopBar />
        <div className="px-6 pt-1 pb-4">
          <h1 style={{ fontFamily:f.display, fontSize:"26px", fontWeight:400, color:c.text, letterSpacing:"0.01em" }}>
            {t.history_title[0]}{" "}
            <span style={{ color:c.silverMid, fontStyle:"italic" }}>{t.history_title[1]}</span>
          </h1>
        </div>

        <div className="flex gap-2 px-5 mb-5">
          {(["today","week","month"] as Filter[]).map(ff => (
            <button key={ff} onClick={() => setFilter(ff)}
              className="px-4 py-1.5 rounded-full transition-all duration-200"
              style={{
                fontFamily:f.ui, fontSize:"12px", fontWeight:400,
                color:filter===ff?c.silver:c.textFaint,
                background:filter===ff?"var(--c-glass-bg)":"transparent",
                border:`1px solid ${filter===ff?"var(--c-glass-border)":"transparent"}`,
              }}>
              {(t.history_filter as any)[ff]}
            </button>
          ))}
        </div>

        <div className="px-5 mb-5">
          <GlassCard className="p-4">
            <p style={{ fontFamily:f.ui, fontSize:"11px", fontWeight:500, color:c.textFaint, letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:12 }}>
              Tasks completadas
            </p>
            <ResponsiveContainer width="100%" height={80}>
              <AreaChart data={WEEK_DATA} margin={{ top:0, right:0, left:-30, bottom:0 }}>
                <defs>
                  <linearGradient id="cg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--c-silver-mid)" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="var(--c-silver-mid)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize:9, fill:"var(--c-text-faint)", fontFamily:f.ui }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize:9, fill:"var(--c-text-faint)", fontFamily:f.ui }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background:"var(--c-surface)", border:"1px solid var(--c-glass-border)", borderRadius:8, fontSize:11, fontFamily:f.ui, color:"var(--c-text)" }} />
                <Area type="monotone" dataKey="tasks" stroke="var(--c-silver-mid)" strokeWidth={1.5} fill="url(#cg)" />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </div>

        <div className="px-5">
          <Eyebrow>{t.section.today}</Eyebrow>

          {loading && (
            <div className="flex justify-center py-6">
              {[0,0.15,0.3].map(dd => (
                <motion.div key={dd} className="w-1.5 h-1.5 rounded-full mx-1"
                  style={{ background:c.silverMid }}
                  animate={{ scale:[1,1.5,1], opacity:[0.3,1,0.3] }}
                  transition={{ duration:0.9, delay:dd, repeat:Infinity }} />
              ))}
            </div>
          )}

          {!loading && filtered.length === 0 && (
            <GlassCard className="px-4 py-4 text-center">
              <p style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:300, color:c.textFaint }}>
                Nenhuma atividade neste período
              </p>
            </GlassCard>
          )}

          <div className="relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-[1px]" style={{ background:"var(--c-border)" }} />
            <div className="flex flex-col gap-3 pl-1">
              {filtered.map((item, i) => (
                <motion.div key={item.id} initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                  transition={{ delay:i*0.04, duration:0.4 }}
                  className="flex items-start gap-4">
                  <div className="w-9 h-9 rounded-2xl flex-shrink-0 flex items-center justify-center z-10"
                    style={{ background:`${item.color}18`, border:`1px solid ${item.color}28` }}>
                    <div className="w-2 h-2 rounded-full" style={{ background:item.color }} />
                  </div>
                  <GlassCard className="flex-1 px-4 py-3">
                    <div className="flex items-start justify-between gap-2">
                      <p style={{ fontFamily:f.ui, fontSize:"13px", fontWeight:500, color:c.text, flex:1 }}>
                        {item.label}
                      </p>
                      <Chip label={spaceLabel(item.space)} color={item.color} />
                    </div>
                    <p style={{ fontFamily:f.ui, fontSize:"10px", fontWeight:300, color:c.textFaint, marginTop:3 }}>
                      {item.time}
                    </p>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ROOT APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function App() {
  const stored = (() => { try { return JSON.parse(localStorage.getItem("zentra-prefs") ?? "{}"); } catch { return {}; } })();
  const [prefs, setPrefs] = useState<Prefs>({
    theme:  stored.theme  ?? "cinderela",
    lang:   stored.lang   ?? "pt",
    spaces: stored.spaces ?? ["work","health","finance","home","shopping","books"],
  });
  const [screen, setScreen]       = useState<Screen>(stored.theme ? "home" : "onboard1");
  const [activeSpaceId, setActiveSpaceId] = useState("health");

  useEffect(() => {
    const vars = THEMES[prefs.theme];
    Object.entries(vars).forEach(([k, v]) => document.documentElement.style.setProperty(`--${k}`, v));
  }, [prefs.theme]);

  const updatePrefs = (p: Prefs) => {
    setPrefs(p);
    localStorage.setItem("zentra-prefs", JSON.stringify(p));
  };

  const isMain = ["home","chat","spaces","history"].includes(screen);

  return (
    <PrefsCtx.Provider value={{ prefs, setPrefs: updatePrefs }}>
      <div className="min-h-screen flex items-center justify-center"
        style={{ background:"#020408", fontFamily:f.ui }}>
        <Nebula />
        <div className="relative" style={{ width:393, height:852, flexShrink:0 }}>
          <div className="absolute -inset-[1px] rounded-[52px] pointer-events-none z-10"
            style={{ background:"linear-gradient(145deg,rgba(200,212,236,0.16) 0%,rgba(164,184,216,0.04) 40%,rgba(200,212,236,0.1) 100%)" }} />
          <div className="absolute inset-0 rounded-[51px] overflow-hidden"
            style={{ background:c.bg, boxShadow:"0 60px 140px rgba(0,0,0,0.9),0 20px 60px rgba(0,0,0,0.5),0 0 80px rgba(14,30,100,0.18)" }}>
            <AnimatePresence mode="wait">
              <motion.div key={screen} className="absolute inset-0"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                transition={{ duration:0.25, ease:"easeInOut" }}>
                {screen==="onboard1"     && <Onboard1     onNext={() => setScreen("onboard_style")} />}
                {screen==="onboard_style"&& <OnboardStyle  onNext={() => setScreen("onboard2")} />}
                {screen==="onboard2"     && <Onboard2      onDone={() => setScreen("home")} />}
                {screen==="home"         && <HomeScreen    setScreen={setScreen} />}
                {screen==="chat"         && <ChatScreen />}
                {screen==="spaces"       && <SpacesScreen setScreen={setScreen} openSpace={(id) => { setActiveSpaceId(id); setScreen("space_detail"); }} />}
                {screen==="space_detail" && <SpaceDetailScreen spaceId={activeSpaceId} goBack={() => setScreen("spaces")} />}
                {screen==="history"      && <HistoryScreen />}
              </motion.div>
            </AnimatePresence>
            {isMain && <BottomNav screen={screen} setScreen={setScreen} />}
          </div>
        </div>
      </div>
    </PrefsCtx.Provider>
  );
}
