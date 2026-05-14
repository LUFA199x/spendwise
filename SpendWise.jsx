import { useState, useEffect, useRef } from "react";
import { api, authClient } from "./src/api.js";
import { cache } from "./src/cache.js";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

/* ════════════════════════════════════════════════════════════════════
   FONTS
════════════════════════════════════════════════════════════════════ */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

/* ════════════════════════════════════════════════════════════════════
   THEME — Monochrome Black & White
════════════════════════════════════════════════════════════════════ */
const C = {
  bg:        "#000000",
  surface:   "#0C0C0C",
  card:      "#141414",
  card2:     "#1A1A1A",
  border:    "rgba(255,255,255,0.08)",
  borderMed: "rgba(255,255,255,0.16)",
  borderHi:  "rgba(255,255,255,0.28)",
  white:     "#FFFFFF",
  whiteDim:  "rgba(255,255,255,0.07)",
  whiteDim2: "rgba(255,255,255,0.03)",
  danger:    "#FF3B3B",
  dangerDim: "rgba(255,59,59,0.10)",
  text:      "#FFFFFF",
  textSec:   "#6B6B6B",
  textTert:  "#333333",
  g1: "#FFFFFF",
  g2: "#AAAAAA",
  g3: "#666666",
  g4: "#2E2E2E",
  g5: "#1A1A1A",
};

/* ════════════════════════════════════════════════════════════════════
   CATEGORIES
════════════════════════════════════════════════════════════════════ */
const CATS = {
  Food:          { icon: "🍔", shade: C.g1 },
  Transport:     { icon: "🚗", shade: C.g2 },
  Shopping:      { icon: "🛍️", shade: C.g3 },
  Entertainment: { icon: "🎬", shade: C.g2 },
  Utilities:     { icon: "⚡", shade: C.g1 },
  Health:        { icon: "❤️", shade: C.g2 },
  Education:     { icon: "📚", shade: C.g3 },
  Other:         { icon: "💼", shade: C.g3 },
};

const ESSENTIAL_CATS = ["Food", "Transport", "Utilities", "Health", "Education"];

/* ════════════════════════════════════════════════════════════════════
   UTILITIES
════════════════════════════════════════════════════════════════════ */
const genId    = () => Math.random().toString(36).slice(2, 9);
const fmtMoney = n  => "₦" + Math.round(n).toLocaleString();
const fmtDate  = d  => new Date(d).toLocaleDateString("en-NG", { month: "short", day: "numeric" });
const fmtMonth = (y, m) => new Date(y, m - 1).toLocaleDateString("en-NG", { month: "long", year: "numeric" });
const todayStr = () => new Date().toISOString().slice(0, 10);
const timeAgo  = ts => {
  if (!ts) return "";
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)    return "just now";
  if (s < 3600)  return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return fmtDate(ts);
};

const getMonthYear = dateStr => {
  const d = new Date(dateStr);
  return { month: d.getMonth() + 1, year: d.getFullYear() };
};

function useIsMobile() {
  const [mob, setMob] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const fn = () => setMob(window.innerWidth < 768);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mob;
};

/* All data persisted in Supabase via backend API. */

/* ════════════════════════════════════════════════════════════════════
   STYLES
════════════════════════════════════════════════════════════════════ */
const s = {
  app: {
    display: "flex",
    height: "100vh",
    fontFamily: "'DM Sans', sans-serif",
    background: C.bg,
    color: C.text,
    overflow: "hidden",
  },
  sidebar: {
    width: 234,
    background: C.surface,
    borderRight: `1px solid ${C.border}`,
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
  },
  main: {
    flex: 1,
    overflow: "auto",
    padding: "32px 36px",
  },
  card: {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 12,
    padding: "20px 22px",
  },
  cardSm: {
    background: C.card,
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    padding: "16px 18px",
  },
  h3: {
    fontSize: 11,
    fontWeight: 600,
    color: C.textSec,
    textTransform: "uppercase",
    letterSpacing: "1px",
    margin: "0 0 14px",
  },
  mono:  { fontFamily: "'JetBrains Mono', monospace" },
  grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
  grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
  grid4: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 },
  row:   { display: "flex", alignItems: "center", gap: 12 },
  sb:    { display: "flex", justifyContent: "space-between", alignItems: "center" },

  badge: (col, bg) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "2px 9px",
    borderRadius: 20,
    fontSize: 11,
    fontWeight: 600,
    color: col,
    background: bg,
    border: `1px solid ${col}30`,
  }),

  btn: (v = "primary") => ({
    padding: "9px 18px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 600,
    transition: "all 0.15s",
    background: v === "primary" ? C.white  : v === "danger" ? C.danger : "transparent",
    color:      v === "primary" ? "#000"   : v === "ghost"  ? C.textSec : "#fff",
    border:     v === "ghost"   ? `1px solid ${C.border}`
              : v === "outline" ? `1px solid ${C.borderMed}` : "none",
  }),

  input: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "10px 12px",
    color: C.text,
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif",
  },

  select: {
    background: C.surface,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    padding: "10px 12px",
    color: C.text,
    fontSize: 14,
    outline: "none",
    width: "100%",
    boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif",
  },
};

/* ════════════════════════════════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════════════════════════════════ */
const NAV = [
  { id: "dashboard",    label: "Dashboard",     icon: "◆" },
  { id: "earnings",     label: "Earnings",       icon: "₦" },
  { id: "transactions", label: "Transactions",   icon: "↕" },
  { id: "scanner",      label: "Scan & Capture", icon: "▣" },
  { id: "budgets",      label: "Budgets",        icon: "◉" },
  { id: "analytics",    label: "Analytics",      icon: "∿" },
  { id: "goals",        label: "Goals",          icon: "◎" },
  { id: "reports",      label: "Reports",        icon: "≡" },
  { id: "audit",        label: "AI Audit",       icon: "✦" },
];

/* ════════════════════════════════════════════════════════════════════
   SHARED UI PRIMITIVES
════════════════════════════════════════════════════════════════════ */

function PageTitle({ title, sub, action }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 10 }}>
        <div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: isMobile ? 20 : 26, fontWeight: 800, letterSpacing: "-0.5px" }}>
            {title}
          </div>
          {sub && <div style={{ color: C.textSec, fontSize: 13, marginTop: 4 }}>{sub}</div>}
        </div>
        {action && <div>{action}</div>}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, alert = false }) {
  return (
    <div style={{ ...s.cardSm, borderColor: alert ? `${C.danger}50` : C.border }}>
      <div style={{ fontSize: 11, color: C.textSec, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.8px" }}>
        {label}
      </div>
      <div style={{ ...s.mono, fontSize: 22, fontWeight: 600, color: alert ? C.danger : C.white, marginBottom: 3 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.textTert }}>{sub}</div>}
    </div>
  );
}

function Prog({ pct, thin = false, color }) {
  const clr = color || (pct > 90 ? C.danger : C.white);
  return (
    <div style={{ height: thin ? 4 : 6, borderRadius: 3, background: C.surface }}>
      <div style={{
        height: "100%",
        width: `${Math.min(100, Math.max(0, pct))}%`,
        background: clr,
        borderRadius: 3,
        transition: "width 0.4s ease",
      }} />
    </div>
  );
}

function Empty({ icon, title, sub }) {
  return (
    <div style={{ textAlign: "center", padding: "52px 20px", color: C.textSec }}>
      <div style={{ fontSize: 34, marginBottom: 10, opacity: 0.2 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 5, color: C.textTert }}>{title}</div>
      {sub && <div style={{ fontSize: 13 }}>{sub}</div>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   IMPULSE BLOCKER MODAL
════════════════════════════════════════════════════════════════════ */

function ImpulseBlocker({ item, onConfirm, onCancel }) {
  const [cd, setCd] = useState(10);

  useEffect(() => {
    if (cd === 0) return;
    const t = setTimeout(() => setCd(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cd]);

  const questions = [
    "Is this purchase within your budget this month?",
    "Have you bought something similar recently?",
    "Will this matter to you in 30 days?",
    "Are you spending to cope with stress or boredom?",
  ];

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(0,0,0,0.92)",
      display: "flex", alignItems: "center", justifyContent: "center",
      zIndex: 1000,
    }}>
      <div style={{ background: C.card, border: `1px solid ${C.borderMed}`, borderRadius: 18, padding: 36, maxWidth: 420, width: "90%" }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 24, fontWeight: 800, marginBottom: 8, textAlign: "center" }}>
          Pause.
        </div>
        <div style={{ fontSize: 14, color: C.textSec, textAlign: "center", marginBottom: 22 }}>
          You're about to log <strong style={{ color: C.white }}>{item.description}</strong> for{" "}
          <strong style={{ color: C.white }}>{fmtMoney(item.amount / 100)}</strong> — a non-essential purchase.
        </div>

        <div style={{ background: C.surface, borderRadius: 10, padding: 16, marginBottom: 22 }}>
          {questions.map((q, i) => (
            <div key={i} style={{ fontSize: 13, color: C.textSec, marginBottom: i < questions.length - 1 ? 8 : 0, display: "flex", gap: 8 }}>
              <span style={{ ...s.mono, color: C.textTert, fontSize: 11 }}>{String(i + 1).padStart(2, "0")}</span>
              {q}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button style={{ ...s.btn("ghost"), flex: 1 }} onClick={onCancel}>Cancel</button>
          <button
            disabled={cd > 0}
            onClick={onConfirm}
            style={{
              ...s.btn("outline"),
              flex: 2,
              opacity: cd > 0 ? 0.4 : 1,
              cursor: cd > 0 ? "not-allowed" : "pointer",
              borderColor: cd > 0 ? C.border : C.borderHi,
              color: C.white,
            }}
          >
            {cd > 0 ? `Wait ${cd}s…` : "Log Anyway"}
          </button>
        </div>

        {cd > 0 && (
          <div style={{ textAlign: "center", fontSize: 11, color: C.textTert, marginTop: 10 }}>
            Take a breath. This purchase can wait.
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ADD TRANSACTION MODAL
════════════════════════════════════════════════════════════════════ */

function AddModal({ onAdd, onClose, prefill = {} }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({
    description: prefill.description || "",
    amount:      prefill.amount      || "",
    category:    prefill.category    || "Food",
    date:        prefill.date        || todayStr(),
  });
  const [blocker, setBlocker] = useState(false);

  const isDisc = !ESSENTIAL_CATS.includes(form.category);

  const buildTxn = type => {
    const { month, year } = getMonthYear(form.date);
    return {
      id:          genId(),
      description: form.description,
      amount:      parseFloat(form.amount) * 100,
      category:    form.category,
      date:        form.date,
      type,
      month,
      year,
    };
  };

  const submit = () => {
    if (!form.description || !form.amount || parseFloat(form.amount) <= 0) return;
    if (isDisc) { setBlocker(true); return; }
    onAdd(buildTxn("essential"));
    onClose();
  };

  return (
    <>
      <div style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.82)",
        display: "flex",
        alignItems: isMobile ? "flex-end" : "center",
        justifyContent: "center",
        zIndex: 999,
      }}>
        <div style={{ background: C.card, border: `1px solid ${C.borderMed}`, borderRadius: isMobile ? "16px 16px 0 0" : 16, padding: 28, width: isMobile ? "100%" : 420 }}>
          <div style={{ ...s.sb, marginBottom: 20 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700 }}>Log Expense</div>
            <button style={{ background: "none", border: "none", color: C.textSec, cursor: "pointer", fontSize: 20, lineHeight: 1 }} onClick={onClose}>✕</button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              style={s.input}
              placeholder="Description (e.g. Jollof rice & chicken)"
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <input
              style={s.input}
              placeholder="Amount (₦)"
              type="number"
              min="0"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            />
            <select
              style={s.select}
              value={form.category}
              onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            >
              {Object.keys(CATS).map(c => <option key={c}>{c}</option>)}
            </select>
            <input
              style={s.input}
              type="date"
              value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
            />

            {isDisc && (
              <div style={{ background: C.whiteDim2, border: `1px solid ${C.border}`, borderRadius: 8, padding: "10px 14px", fontSize: 12, color: C.textSec }}>
                ⚠ Non-essential — a 10-second cool-off prompt will appear before saving.
              </div>
            )}

            <button style={{ ...s.btn("primary"), marginTop: 4 }} onClick={submit}>
              Add Expense
            </button>
          </div>
        </div>
      </div>

      {blocker && (
        <ImpulseBlocker
          item={{ description: form.description, amount: parseFloat(form.amount) * 100 }}
          onConfirm={() => { onAdd(buildTxn("discretionary")); onClose(); }}
          onCancel={() => setBlocker(false)}
        />
      )}
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════
   AUTH SCREEN
════════════════════════════════════════════════════════════════════ */

function AuthScreen({ onAuth }) {
  const isMobile = useIsMobile();

  const urlToken = typeof window !== "undefined"
    ? new URLSearchParams(window.location.search).get("token")
    : null;

  const [mode,    setMode]    = useState(urlToken ? "reset" : "login");
  const [form,    setForm]    = useState({ name: "", email: "", password: "", newPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  const switchMode = (next) => { setMode(next); setError(""); setSuccess(""); };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      if (mode === "register") {
        if (!form.email || !form.password) return;
        const { data, error: e } = await authClient.signUp.email({
          name:     form.name || form.email.split("@")[0],
          email:    form.email,
          password: form.password,
        });
        if (e) throw new Error(e.message);
        onAuth(data.user);

      } else if (mode === "login") {
        if (!form.email || !form.password) return;
        const { data, error: e } = await authClient.signIn.email({
          email:    form.email,
          password: form.password,
        });
        if (e) throw new Error(e.message);
        onAuth(data.user);

      } else if (mode === "forgot") {
        if (!form.email) return;
        const { error: e } = await authClient.forgetPassword({
          email:      form.email,
          redirectTo: window.location.origin,
        });
        if (e) throw new Error(e.message);
        setSuccess("Check your inbox — a reset link is on its way.");

      } else if (mode === "reset") {
        if (!form.newPassword) return;
        const token = new URLSearchParams(window.location.search).get("token");
        const { error: e } = await authClient.resetPassword({
          newPassword: form.newPassword,
          token,
        });
        if (e) throw new Error(e.message);
        window.history.replaceState({}, "", window.location.pathname);
        setSuccess("Password updated! Sign in with your new password.");
        switchMode("login");
      }
    } catch (e) {
      setError(e.message ?? "Something went wrong");
    }
    setLoading(false);
  };

  const field = (placeholder, key, type = "text") => (
    <input
      style={s.input}
      placeholder={placeholder}
      type={type}
      value={form[key] ?? ""}
      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      onKeyDown={e => e.key === "Enter" && handleSubmit()}
    />
  );

  const subtitles = {
    login:    "Sign in to your account",
    register: "Create your account",
    forgot:   "Reset your password",
    reset:    "Choose a new password",
  };

  const btnLabels = {
    login:    "Sign In",
    register: "Create Account",
    forgot:   "Send Reset Link",
    reset:    "Set New Password",
  };

  return (
    <div style={{
      display: "flex", height: "100vh",
      background: C.bg, color: C.text,
      fontFamily: "'DM Sans', sans-serif",
      alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <style>{FONTS}</style>
      <div style={{
        width: "100%", maxWidth: 400,
        background: C.card,
        border: `1px solid ${C.borderMed}`,
        borderRadius: 16,
        padding: isMobile ? 24 : 36,
      }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>
          Spend<span style={{ color: C.textSec }}>Wise</span>
        </div>
        <div style={{ fontSize: 13, color: C.textSec, marginBottom: 28 }}>
          {subtitles[mode]}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "register" && field("Name", "name")}
          {(mode === "login" || mode === "register" || mode === "forgot") && field("Email", "email", "email")}
          {(mode === "login" || mode === "register") && field("Password", "password", "password")}
          {mode === "reset" && field("New password", "newPassword", "password")}
        </div>

        {mode === "login" && (
          <div style={{ textAlign: "right", marginTop: 8 }}>
            <span
              style={{ fontSize: 12, color: C.textSec, cursor: "pointer" }}
              onClick={() => switchMode("forgot")}
            >
              Forgot password?
            </span>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: C.dangerDim, border: `1px solid ${C.danger}40`, borderRadius: 8, fontSize: 13, color: C.danger }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ marginTop: 12, padding: "10px 14px", background: "#052e16", border: "1px solid #16a34a40", borderRadius: 8, fontSize: 13, color: "#4ade80" }}>
            {success}
          </div>
        )}

        <button
          style={{ ...s.btn("primary"), width: "100%", marginTop: 16 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? "Please wait…" : btnLabels[mode]}
        </button>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: C.textSec }}>
          {(mode === "login" || mode === "forgot") && (
            <>
              {mode === "login" ? "No account? " : "Remembered it? "}
              <span
                style={{ color: C.white, cursor: "pointer", fontWeight: 600 }}
                onClick={() => switchMode(mode === "login" ? "register" : "login")}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </span>
            </>
          )}
          {mode === "register" && (
            <>
              Have an account?{" "}
              <span
                style={{ color: C.white, cursor: "pointer", fontWeight: 600 }}
                onClick={() => switchMode("login")}
              >
                Sign in
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   SCANNER — receipt OCR + barcode via Claude Vision API
════════════════════════════════════════════════════════════════════ */

function Scanner({ onAdd }) {
  const [mode,      setMode]      = useState("invoice");
  const [scanning,  setScanning]  = useState(false);
  const [result,    setResult]    = useState(null);
  const [showAdd,   setShowAdd]   = useState(false);
  const [prefill,   setPrefill]   = useState({});
  const [camStream, setCamStream] = useState(null);

  const fileRef   = useRef(null);
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);

  // Cleanup camera on unmount
  useEffect(() => () => { if (camStream) camStream.getTracks().forEach(t => t.stop()); }, [camStream]);

  const startCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      setCamStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      alert("Camera access denied. Please allow camera permissions and try again.");
    }
  };

  const stopCam = () => {
    if (camStream) { camStream.getTracks().forEach(t => t.stop()); setCamStream(null); }
  };

  const capture = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    if (!v || !c) return;
    c.width  = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob(blob => { stopCam(); analyzeImage(blob, mode); }, "image/jpeg", 0.92);
  };

  const handleFile = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setResult(null);
    await analyzeImage(file, mode);
    e.target.value = "";
  };

  const analyzeImage = async (blob, scanMode) => {
    setScanning(true);
    const b64 = await new Promise(res => {
      const r = new FileReader();
      r.onload = () => res(r.result.split(",")[1]);
      r.readAsDataURL(blob);
    });
    const mtype = blob.type || "image/jpeg";

    const prompt = scanMode === "barcode"
      ? `Analyze this barcode/product image. Identify the product. Respond ONLY with valid JSON (no markdown): {"description":"product name","amount":0,"category":"Food/Transport/Shopping/Entertainment/Utilities/Health/Education/Other","confidence":"high/medium/low","notes":""}. Amount in Naira as a number (0 if unknown).`
      : `Analyze this receipt/invoice image. Extract all line items. Respond ONLY with valid JSON (no markdown): {"merchant":"store name","date":"YYYY-MM-DD","total":0,"items":[{"description":"item","amount":0,"category":"Food/Transport/Shopping/Entertainment/Utilities/Health/Education/Other"}],"notes":""}. All amounts in KOBO (Naira × 100). Use today ${todayStr()} if date not visible.`;

    try {
      const data  = await api.claude.message({
        max_tokens: 800,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mtype, data: b64 } },
            { type: "text",  text: prompt },
          ],
        }],
      });
      const text  = data.content?.find(c => c.type === "text")?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      setResult({ ...JSON.parse(clean), scanMode });
    } catch {
      setResult({ error: "Could not analyze image. Try a clearer photo and check your internet connection." });
    }
    setScanning(false);
  };

  const openAddForItem = item => {
    setPrefill({
      description: item.description,
      amount:      ((item.amount || 0) / 100).toFixed(0),
      category:    item.category,
      date:        result?.date || todayStr(),
    });
    setShowAdd(true);
  };

  const addAll = () => {
    result.items?.forEach(item => {
      const date = result.date || todayStr();
      const { month, year } = getMonthYear(date);
      onAdd({
        id:          genId(),
        description: item.description,
        amount:      item.amount,
        category:    item.category,
        date, month, year,
        type: ESSENTIAL_CATS.includes(item.category) ? "essential" : "discretionary",
      });
    });
    setResult(null);
  };

  return (
    <div>
      <PageTitle
        title="Scan & Capture"
        sub="Photograph a receipt or scan a barcode — Claude auto-extracts all expense details"
      />

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 8, marginBottom: 22 }}>
        {[
          { id: "invoice", label: "📄  Receipt / Invoice" },
          { id: "barcode", label: "▣  Barcode Scan" },
        ].map(m => (
          <button
            key={m.id}
            onClick={() => { setMode(m.id); setResult(null); stopCam(); }}
            style={s.btn(mode === m.id ? "primary" : "ghost")}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Receipt upload */}
      {mode === "invoice" && (
        <div style={{ ...s.card, marginBottom: 20 }}>
          <div style={s.h3}>Upload Receipt or Invoice Image</div>
          <div
            onClick={() => fileRef.current?.click()}
            style={{ border: `1px dashed ${C.borderMed}`, borderRadius: 10, padding: "44px 20px", textAlign: "center", cursor: "pointer" }}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}>📄</div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
              Drop invoice or receipt here
            </div>
            <div style={{ fontSize: 13, color: C.textSec, marginBottom: 18 }}>
              JPG or PNG — Claude extracts every line item automatically
            </div>
            <button style={s.btn("outline")} onClick={e => { e.stopPropagation(); fileRef.current?.click(); }}>
              Choose File
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>
      )}

      {/* Barcode — no camera yet */}
      {mode === "barcode" && !camStream && (
        <div style={{ ...s.card, marginBottom: 20, textAlign: "center", padding: "44px 20px" }}>
          <div style={{ fontSize: 40, marginBottom: 10 }}>▣</div>
          <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>Point camera at a product barcode</div>
          <div style={{ fontSize: 13, color: C.textSec, marginBottom: 20 }}>
            Claude identifies the product and pre-fills the expense form
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button style={s.btn("primary")} onClick={startCam}>Open Camera</button>
            <button style={s.btn("ghost")}   onClick={() => fileRef.current?.click()}>Upload Image</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleFile} />
        </div>
      )}

      {/* Barcode — live camera */}
      {mode === "barcode" && camStream && (
        <div style={{ ...s.card, marginBottom: 20 }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: 8, background: "#000", display: "block" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${C.white},transparent)`, animation: "scan 2s ease-in-out infinite", margin: "8px 0" }} />
          <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...s.btn("ghost"),   flex: 1 }} onClick={() => { stopCam(); setResult(null); }}>Cancel</button>
            <button style={{ ...s.btn("primary"), flex: 2 }} onClick={capture}>Capture & Identify</button>
          </div>
        </div>
      )}

      {/* Scanning indicator */}
      {scanning && (
        <div style={{ ...s.card, textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: 28, marginBottom: 12, animation: "spin 1s linear infinite", display: "inline-block" }}>⟳</div>
          <div style={{ color: C.textSec, fontSize: 14 }}>Claude is reading your {mode === "invoice" ? "receipt" : "barcode"}…</div>
        </div>
      )}

      {/* Results — invoice */}
      {result && !result.error && result.scanMode === "invoice" && result.items && (
        <div style={s.card}>
          <div style={{ ...s.sb, marginBottom: 16 }}>
            <div style={s.h3}>Items Extracted</div>
            {result.merchant && <span style={{ fontSize: 13, fontWeight: 600 }}>{result.merchant}</span>}
          </div>
          {result.items.map((item, i) => (
            <div key={i} style={{ ...s.sb, padding: "10px 0", borderBottom: i < result.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
              <div style={s.row}>
                <span style={{ fontSize: 16 }}>{CATS[item.category]?.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.description}</div>
                  <div style={{ fontSize: 11, color: C.textSec }}>{item.category}</div>
                </div>
              </div>
              <div style={s.row}>
                <span style={{ ...s.mono, fontSize: 13, fontWeight: 600 }}>{fmtMoney(item.amount / 100)}</span>
                <button onClick={() => openAddForItem(item)} style={{ ...s.btn("ghost"), padding: "5px 10px", fontSize: 11 }}>Add</button>
              </div>
            </div>
          ))}
          <div style={{ ...s.sb, paddingTop: 14, borderTop: `1px solid ${C.border}`, marginTop: 4 }}>
            <span style={{ fontSize: 13, color: C.textSec }}>
              Total: <strong style={{ ...s.mono, color: C.white }}>{fmtMoney(result.total / 100)}</strong>
            </span>
            <button style={s.btn("primary")} onClick={addAll}>Add All {result.items.length} Items</button>
          </div>
        </div>
      )}

      {/* Results — barcode */}
      {result && !result.error && result.scanMode === "barcode" && (
        <div style={s.card}>
          <div style={s.h3}>Product Identified</div>
          <div style={{ ...s.row, marginBottom: 16 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 600 }}>{result.description}</div>
              <div style={{ fontSize: 12, color: C.textSec }}>{result.category} · {result.confidence} confidence</div>
              {result.notes && <div style={{ fontSize: 12, color: C.textTert, marginTop: 4 }}>{result.notes}</div>}
            </div>
            {result.amount > 0 && <div style={{ ...s.mono, fontSize: 18, fontWeight: 700 }}>{fmtMoney(result.amount)}</div>}
          </div>
          <button style={{ ...s.btn("primary"), width: "100%" }} onClick={() => openAddForItem(result)}>
            + Add as Expense
          </button>
        </div>
      )}

      {result?.error && (
        <div style={{ ...s.card, borderColor: `${C.danger}40` }}>
          <div style={{ color: C.danger, fontSize: 14 }}>⚠ {result.error}</div>
        </div>
      )}

      {showAdd && (
        <AddModal
          onAdd={txn => { onAdd(txn); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
          prefill={prefill}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   DASHBOARD
════════════════════════════════════════════════════════════════════ */

function Dashboard({ transactions, earnings, budgets, goals, setView }) {
  const isMobile = useIsMobile();
  const now      = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();

  const monthTxns   = transactions.filter(t => t.month === curMonth && t.year === curYear);
  const monthEarns  = earnings.filter(e => e.month === curMonth && e.year === curYear);

  const totalSpent  = monthTxns.reduce((s, t) => s + t.amount, 0);
  const totalEarned = monthEarns.reduce((s, e) => s + e.amount, 0);
  const disc        = monthTxns.filter(t => t.type === "discretionary").reduce((s, t) => s + t.amount, 0);
  const discPct     = totalSpent > 0 ? Math.round((disc / totalSpent) * 100) : 0;
  const netPos      = totalEarned - totalSpent;
  const budgetTotal = budgets.reduce((s, b) => s + b.limit, 0);
  const budgetPct   = budgetTotal > 0 ? Math.round((totalSpent / budgetTotal) * 100) : 0;

  const score = Math.max(0, Math.min(100,
    100 - discPct * 0.5 - Math.max(0, budgetPct - 70) * 0.8
  ));

  const catTotals = {};
  monthTxns.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });

  const recent = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  const weeklyData = (() => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d   = new Date();
      d.setDate(d.getDate() - i);
      const key   = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString("en", { weekday: "short" });
      const spent = transactions.filter(t => t.date === key).reduce((s, t) => s + t.amount / 100, 0);
      days.push({ day: label, spent: Math.round(spent) });
    }
    return days;
  })();

  // Empty welcome screen
  if (transactions.length === 0 && earnings.length === 0) {
    return (
      <div>
        <PageTitle title="Dashboard" sub="Your financial overview" />
        <div style={{ ...s.card, textAlign: "center", padding: "64px 24px" }}>
          <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.12 }}>◆</div>
          <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
            Welcome to SpendWise
          </div>
          <div style={{ fontSize: 14, color: C.textSec, maxWidth: 380, margin: "0 auto 30px", lineHeight: 1.7 }}>
            Start by logging your monthly net earnings, then record every expense.
            SpendWise will coach you toward real financial discipline.
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
            <button style={s.btn("primary")} onClick={() => setView("earnings")}>Log Earnings First</button>
            <button style={s.btn("ghost")}   onClick={() => setView("transactions")}>Add an Expense</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title="Dashboard"
        sub={`${fmtMonth(curYear, curMonth)} · ${monthTxns.length} transactions`}
        action={
          <div style={{ ...s.badge(discPct > 50 ? C.danger : C.g2, discPct > 50 ? C.dangerDim : "rgba(255,255,255,0.05)") }}>
            {discPct}% impulse spend
          </div>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
        <StatCard
          label="Monthly Earnings"
          value={totalEarned > 0 ? fmtMoney(totalEarned / 100) : "—"}
          sub={totalEarned === 0 ? "Not set — go to Earnings" : fmtMonth(curYear, curMonth)}
        />
        <StatCard
          label="Total Spent"
          value={fmtMoney(totalSpent / 100)}
          sub={budgetTotal > 0 ? `${budgetPct}% of budget` : "No budget set"}
          alert={budgetTotal > 0 && totalSpent > budgetTotal}
        />
        <StatCard
          label="Net Position"
          value={totalEarned > 0 ? (netPos >= 0 ? "+" : "") + fmtMoney(netPos / 100) : "—"}
          sub={totalEarned > 0 ? (netPos >= 0 ? "Surplus this month" : "Deficit — overspent") : "Log earnings to see"}
          alert={totalEarned > 0 && netPos < 0}
        />
        <StatCard
          label="Impulse Spend"
          value={fmtMoney(disc / 100)}
          sub={`${discPct}% of total`}
          alert={discPct > 50}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <div style={{ ...s.card, textAlign: "center" }}>
          <div style={s.h3}>Financial Health Score</div>
          <div style={{
            fontFamily: "'Syne',sans-serif",
            fontSize: 82, fontWeight: 800,
            color: score >= 70 ? C.white : score >= 40 ? C.g2 : C.danger,
            lineHeight: 1, margin: "6px 0 8px", ...s.mono,
          }}>
            {Math.round(score)}
          </div>
          <div style={{ fontSize: 13, color: C.textSec, marginBottom: 14 }}>
            {score >= 70 ? "On track — keep building discipline"
              : score >= 40 ? "Needs improvement — cut discretionary"
              : "Critical — significant overspending"}
          </div>
          <Prog pct={score} />
        </div>

        <div style={s.card}>
          <div style={s.h3}>7-Day Spending Pulse</div>
          <ResponsiveContainer width="100%" height={170}>
            <AreaChart data={weeklyData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
              <defs>
                <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.white} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={C.white} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={{ fill: C.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textSec, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }} formatter={v => [`₦${v.toLocaleString()}`, "Spent"]} />
              <Area type="monotone" dataKey="spent" stroke={C.white} strokeWidth={2} fill="url(#wg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <div style={s.card}>
          <div style={{ ...s.sb, marginBottom: 14 }}>
            <div style={s.h3}>Recent Transactions</div>
            <span style={{ fontSize: 12, color: C.textSec, cursor: "pointer" }} onClick={() => setView("transactions")}>View all →</span>
          </div>
          {recent.length === 0
            ? <Empty icon="↕" title="No transactions yet" sub="Add your first expense" />
            : recent.map((t, i) => (
                <div key={t.id} style={{ ...s.sb, padding: "9px 0", borderBottom: i < recent.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={s.row}>
                    <span style={{ fontSize: 16 }}>{CATS[t.category]?.icon}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t.description}</div>
                      <div style={{ fontSize: 11, color: C.textSec }}>{t.category} · {fmtDate(t.date)}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ ...s.mono, fontSize: 13, fontWeight: 600 }}>{fmtMoney(t.amount / 100)}</div>
                    {t.type === "discretionary" && <div style={{ fontSize: 10, color: C.textTert }}>impulse</div>}
                  </div>
                </div>
              ))}
        </div>

        <div style={s.card}>
          <div style={s.h3}>Top Categories This Month</div>
          {Object.keys(catTotals).length === 0
            ? <Empty icon="◉" title="No spending this month" sub="Start logging expenses" />
            : Object.entries(catTotals).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([cat, amt]) => {
                const pct = Math.round((amt / totalSpent) * 100);
                return (
                  <div key={cat} style={{ marginBottom: 12 }}>
                    <div style={{ ...s.sb, marginBottom: 4 }}>
                      <span style={{ fontSize: 13 }}>{CATS[cat]?.icon} {cat}</span>
                      <span style={{ ...s.mono, fontSize: 12, color: C.textSec }}>{fmtMoney(amt / 100)} · {pct}%</span>
                    </div>
                    <Prog pct={pct} thin />
                  </div>
                );
              })}
        </div>
      </div>

      {goals.length > 0 && (
        <div style={s.card}>
          <div style={{ ...s.sb, marginBottom: 14 }}>
            <div style={s.h3}>Savings Goals</div>
            <span style={{ fontSize: 12, color: C.textSec, cursor: "pointer" }} onClick={() => setView("goals")}>Manage →</span>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {goals.slice(0, 3).map(g => {
              const pct = Math.min(100, Math.round((g.current / g.target) * 100));
              return (
                <div key={g.id} style={{ flex: 1, background: C.surface, borderRadius: 10, padding: 16 }}>
                  <div style={{ ...s.sb, marginBottom: 10 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{g.name}</div>
                    <span style={{ ...s.mono, fontSize: 12, color: C.textSec }}>{pct}%</span>
                  </div>
                  <Prog pct={pct} thin />
                  <div style={{ ...s.mono, fontSize: 11, color: C.textTert, marginTop: 8 }}>
                    {fmtMoney(g.current / 100)} / {fmtMoney(g.target / 100)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   EARNINGS — input monthly net income, view full history
════════════════════════════════════════════════════════════════════ */

function Earnings({ earnings, onAdd, onDelete }) {
  const isMobile = useIsMobile();
  const [form, setForm] = useState({ amount: "", date: todayStr(), note: "" });

  const addEarning = () => {
    if (!form.amount || parseFloat(form.amount) <= 0) return;
    const { month, year } = getMonthYear(form.date);
    const entry = {
      id:     genId(),
      amount: parseFloat(form.amount) * 100,
      date:   form.date,
      note:   form.note.trim(),
      month,
      year,
    };
    onAdd(entry);
    setForm({ amount: "", date: todayStr(), note: "" });
  };

  // Group entries by month
  const grouped = {};
  earnings.forEach(e => {
    const key = `${e.year}-${String(e.month).padStart(2, "0")}`;
    if (!grouped[key]) grouped[key] = { month: e.month, year: e.year, entries: [], total: 0 };
    grouped[key].entries.push(e);
    grouped[key].total += e.amount;
  });
  const groupedSorted = Object.entries(grouped).sort((a, b) => b[0].localeCompare(a[0]));

  const totalAllTime  = earnings.reduce((s, e) => s + e.amount, 0);
  const monthCount    = Object.keys(grouped).length;
  const avgMonthly    = monthCount > 0 ? totalAllTime / monthCount : 0;

  return (
    <div>
      <PageTitle
        title="Earnings"
        sub="Record your monthly net income — salary, freelance, business, any source"
      />

      {/* Input form */}
      <div style={{ ...s.card, marginBottom: 24, borderTop: `2px solid ${C.white}` }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>
          Log Monthly Income
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <input
            style={{ ...s.input, flex: "2 1 180px" }}
            placeholder="Net amount received (₦)"
            type="number"
            min="0"
            value={form.amount}
            onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addEarning()}
          />
          <input
            style={{ ...s.input, flex: "1 1 140px" }}
            type="date"
            value={form.date}
            onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
          />
          <input
            style={{ ...s.input, flex: "2 1 200px" }}
            placeholder="Note (e.g. April salary, freelance payment)"
            value={form.note}
            onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
            onKeyDown={e => e.key === "Enter" && addEarning()}
          />
          <button style={{ ...s.btn("primary"), alignSelf: "stretch", whiteSpace: "nowrap" }} onClick={addEarning}>
            + Add Earnings
          </button>
        </div>
        <div style={{ fontSize: 11, color: C.textTert, marginTop: 10 }}>
          Enter your net (after-tax) amount. Add multiple entries per month for salary, freelance, bonuses, etc.
        </div>
      </div>

      {earnings.length === 0 ? (
        <Empty
          icon="₦"
          title="No earnings recorded yet"
          sub="Add your first income entry above — this unlocks Net Position tracking, Savings Rate, and multi-month history"
        />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16, marginBottom: 20 }}>
            <StatCard label="All-Time Earnings"  value={fmtMoney(totalAllTime / 100)} sub={`across ${monthCount} month(s)`} />
            <StatCard label="Months Recorded"    value={monthCount}                   sub="income history tracked" />
            <StatCard label="Average Monthly"    value={fmtMoney(avgMonthly / 100)}   sub="per month (average)" />
          </div>

          {groupedSorted.map(([key, group]) => (
            <div key={key} style={{ ...s.card, marginBottom: 16 }}>
              <div style={{ ...s.sb, marginBottom: 14 }}>
                <div>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700 }}>
                    {fmtMonth(group.year, group.month)}
                  </div>
                  <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>
                    {group.entries.length} income {group.entries.length === 1 ? "entry" : "entries"}
                  </div>
                </div>
                <div style={{ ...s.mono, fontSize: 22, fontWeight: 700 }}>
                  {fmtMoney(group.total / 100)}
                </div>
              </div>

              {group.entries.map(e => (
                <div key={e.id} style={{ ...s.sb, padding: "9px 0", borderTop: `1px solid ${C.border}` }}>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{e.note || "Income"}</div>
                    <div style={{ fontSize: 11, color: C.textSec }}>{fmtDate(e.date)}</div>
                  </div>
                  <div style={s.row}>
                    <div style={{ ...s.mono, fontSize: 14, fontWeight: 600 }}>{fmtMoney(e.amount / 100)}</div>
                    <button
                      onClick={() => onDelete(e.id)}
                      style={{ background: "none", border: "none", cursor: "pointer", color: C.textTert, fontSize: 15, padding: "4px 6px" }}
                    >✕</button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   TRANSACTIONS — all expenses with month + category filters
════════════════════════════════════════════════════════════════════ */

function Transactions({ transactions, onAdd, onDelete }) {
  const isMobile = useIsMobile();
  const [showAdd,     setShowAdd]     = useState(false);
  const [catFilter,   setCatFilter]   = useState("All");
  const [search,      setSearch]      = useState("");
  const [monthFilter, setMonthFilter] = useState("all");

  const monthOptions = [...new Set(
    transactions.map(t => `${t.year}-${String(t.month).padStart(2, "0")}`)
  )].sort((a, b) => b.localeCompare(a));

  const filtered = [...transactions]
    .filter(t => {
      if (monthFilter !== "all") {
        if (`${t.year}-${String(t.month).padStart(2, "0")}` !== monthFilter) return false;
      }
      if (catFilter === "Impulse") return t.type === "discretionary";
      if (catFilter !== "All") return t.category === catFilter;
      return true;
    })
    .filter(t => t.description.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div>
      <PageTitle
        title="Transactions"
        sub={`${transactions.length} total · ${filtered.length} shown`}
        action={<button style={s.btn("primary")} onClick={() => setShowAdd(true)}>+ Add Expense</button>}
      />

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <input
          style={{ ...s.input, maxWidth: 220 }}
          placeholder="Search…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select style={{ ...s.select, width: "auto" }} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
          <option value="all">All months</option>
          {monthOptions.map(mk => {
            const [y, m] = mk.split("-");
            return <option key={mk} value={mk}>{fmtMonth(parseInt(y), parseInt(m))}</option>;
          })}
        </select>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: isMobile ? "auto" : "visible", flexWrap: isMobile ? "nowrap" : "wrap", paddingBottom: isMobile ? 4 : 0 }}>
        {["All", "Impulse", ...Object.keys(CATS)].map(f => (
          <button
            key={f}
            onClick={() => setCatFilter(f)}
            style={{
              padding: "6px 12px", borderRadius: 20,
              border:     `1px solid ${catFilter === f ? C.white : C.border}`,
              background: catFilter === f ? C.whiteDim : "transparent",
              color:      catFilter === f ? C.white    : C.textSec,
              cursor: "pointer", fontSize: 12, fontWeight: 500,
            }}
          >{f}</button>
        ))}
      </div>

      <div style={{ ...s.card, padding: 0 }}>
        {filtered.length === 0
          ? <Empty icon="↕" title="No transactions found" sub="Adjust filters or add a new expense" />
          : filtered.map((t, i) => (
              <div key={t.id} style={{ ...s.sb, padding: "13px 20px", borderBottom: i < filtered.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={s.row}>
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: C.surface, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>
                    {CATS[t.category]?.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500 }}>{t.description}</div>
                    <div style={{ fontSize: 12, color: C.textSec }}>{t.category} · {fmtDate(t.date)}</div>
                  </div>
                </div>
                <div style={s.row}>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ ...s.mono, fontSize: 14, fontWeight: 600 }}>{fmtMoney(t.amount / 100)}</div>
                    {t.type === "discretionary" && <div style={{ fontSize: 10, color: C.textTert }}>discretionary</div>}
                  </div>
                  <button
                    onClick={() => onDelete(t.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: C.textTert, fontSize: 15, padding: "4px 6px" }}
                  >✕</button>
                </div>
              </div>
            ))}
      </div>

      {showAdd && (
        <AddModal
          onAdd={onAdd}
          onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   BUDGETS — monthly limits per category (current month)
════════════════════════════════════════════════════════════════════ */

function Budgets({ transactions, budgets, onSetLimit, onUpdateLimit }) {
  const isMobile = useIsMobile();
  const [editing,  setEditing]  = useState(null);
  const [newLimit, setNewLimit] = useState("");

  const now      = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear  = now.getFullYear();

  const getCatSpent = cat =>
    transactions
      .filter(t => t.category === cat && t.month === curMonth && t.year === curYear)
      .reduce((s, t) => s + t.amount, 0);

  return (
    <div>
      <PageTitle title="Budgets" sub="Monthly spending limits per category — tracks current month only" />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16 }}>
        {Object.keys(CATS).map(cat => {
          const budget = budgets.find(b => b.category === cat);
          const spent  = getCatSpent(cat);
          const limit  = budget?.limit || 0;
          const pct    = limit > 0 ? Math.min(100, Math.round((spent / limit) * 100)) : 0;
          const over   = limit > 0 && spent > limit;
          const near   = !over && pct >= 75;

          return (
            <div key={cat} style={{ ...s.card, borderColor: over ? `${C.danger}40` : C.border }}>
              <div style={{ ...s.sb, marginBottom: 12 }}>
                <div style={s.row}>
                  <span style={{ fontSize: 20 }}>{CATS[cat].icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{cat}</div>
                    {over && <span style={{ ...s.badge(C.danger, C.dangerDim), fontSize: 10 }}>Over budget</span>}
                    {near && <span style={{ ...s.badge(C.g3, "rgba(255,255,255,0.05)"), fontSize: 10 }}>Near limit</span>}
                  </div>
                </div>
                {budget
                  ? <button onClick={() => { setEditing(cat); setNewLimit((budget.limit / 100).toString()); }} style={{ background: "none", border: "none", color: C.textSec, cursor: "pointer", fontSize: 12 }}>Edit</button>
                  : <button onClick={() => onSetLimit(cat)} style={{ ...s.btn("ghost"), padding: "5px 12px", fontSize: 12 }}>Set Limit</button>
                }
              </div>

              {budget ? (
                <>
                  <div style={{ ...s.sb, marginBottom: 6 }}>
                    <span style={{ ...s.mono, fontSize: 13 }}>{fmtMoney(spent / 100)}</span>
                    <span style={{ fontSize: 12, color: C.textSec }}>of {fmtMoney(limit / 100)}</span>
                  </div>
                  <Prog pct={pct} color={over ? C.danger : C.white} />
                  <div style={{ fontSize: 11, color: over ? C.danger : C.textTert, marginTop: 6 }}>
                    {over ? `${fmtMoney((spent - limit) / 100)} over budget` : `${fmtMoney((limit - spent) / 100)} remaining (${pct}% used)`}
                  </div>
                </>
              ) : (
                <div style={{ fontSize: 12, color: C.textTert }}>No limit set — spending untracked</div>
              )}

              {editing === cat && (
                <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                  <input
                    style={{ ...s.input, flex: 1 }}
                    placeholder="Monthly limit (₦)"
                    type="number"
                    value={newLimit}
                    onChange={e => setNewLimit(e.target.value)}
                    autoFocus
                  />
                  <button style={s.btn("primary")} onClick={() => {
                    onUpdateLimit(cat, parseFloat(newLimit) * 100);
                    setEditing(null);
                  }}>Save</button>
                  <button style={s.btn("ghost")} onClick={() => setEditing(null)}>✕</button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ANALYTICS — visual breakdown + multi-month earnings vs spending
════════════════════════════════════════════════════════════════════ */

function Analytics({ transactions, earnings }) {
  const isMobile = useIsMobile();
  const [selectedMonth, setSelectedMonth] = useState("all");

  const monthOptions = [...new Set(
    transactions.map(t => `${t.year}-${String(t.month).padStart(2, "0")}`)
  )].sort((a, b) => b.localeCompare(a));

  const filteredTxns = selectedMonth === "all"
    ? transactions
    : transactions.filter(t => `${t.year}-${String(t.month).padStart(2, "0")}` === selectedMonth);

  const catTotals = {};
  filteredTxns.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount / 100; });
  const pieData  = Object.entries(catTotals).map(([name, value]) => ({ name, value: Math.round(value) }));
  const GS       = ["#ffffff", "#d0d0d0", "#a0a0a0", "#707070", "#484848", "#2e2e2e", "#1a1a1a", "#0f0f0f"];

  const ess    = filteredTxns.filter(t => t.type === "essential").reduce((s, t) => s + t.amount, 0);
  const disc   = filteredTxns.filter(t => t.type === "discretionary").reduce((s, t) => s + t.amount, 0);
  const total  = ess + disc;

  // Multi-month trend
  const monthlyTrend = (() => {
    const months = {};
    transactions.forEach(t => {
      const key = `${t.year}-${String(t.month).padStart(2, "0")}`;
      if (!months[key]) months[key] = { label: key, spent: 0, earned: 0, month: t.month, year: t.year };
      months[key].spent += t.amount / 100;
    });
    earnings.forEach(e => {
      const key = `${e.year}-${String(e.month).padStart(2, "0")}`;
      if (!months[key]) months[key] = { label: key, spent: 0, earned: 0, month: e.month, year: e.year };
      months[key].earned += e.amount / 100;
    });
    return Object.values(months)
      .sort((a, b) => a.label.localeCompare(b.label))
      .map(m => ({
        label:  new Date(m.year, m.month - 1).toLocaleDateString("en", { month: "short", year: "2-digit" }),
        spent:  Math.round(m.spent),
        earned: Math.round(m.earned),
      }));
  })();

  if (transactions.length === 0) {
    return (
      <div>
        <PageTitle title="Analytics" sub="Visual spending breakdown" />
        <Empty icon="∿" title="No data to analyze yet" sub="Add transactions to see your spending analytics" />
      </div>
    );
  }

  return (
    <div>
      <PageTitle
        title="Analytics"
        sub="Visual breakdown of your spending patterns"
        action={
          <select style={{ ...s.select, width: "auto" }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
            <option value="all">All months</option>
            {monthOptions.map(mk => {
              const [y, m] = mk.split("-");
              return <option key={mk} value={mk}>{fmtMonth(parseInt(y), parseInt(m))}</option>;
            })}
          </select>
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <StatCard label="Essential Spending"  value={fmtMoney(ess  / 100)} sub={`${total > 0 ? Math.round((ess  / total) * 100) : 0}% of total`} />
        <StatCard label="Discretionary Spend" value={fmtMoney(disc / 100)} sub={`${total > 0 ? Math.round((disc / total) * 100) : 0}% of total`} alert={disc > ess} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <div style={s.card}>
          <div style={s.h3}>By Category</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={88} paddingAngle={3} dataKey="value">
                {pieData.map((_, i) => <Cell key={i} fill={GS[i % GS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }} formatter={v => [`₦${v.toLocaleString()}`]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
            {pieData.map((d, i) => (
              <span key={d.name} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: C.textSec }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: GS[i % GS.length], display: "inline-block" }} />
                {d.name}
              </span>
            ))}
          </div>
        </div>

        <div style={s.card}>
          <div style={s.h3}>Essential vs Discretionary</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart
              data={[{ name: "Breakdown", essential: Math.round(ess / 100), discretionary: Math.round(disc / 100) }]}
              margin={{ top: 4, right: 4, left: -30, bottom: 0 }}
            >
              <XAxis dataKey="name" tick={{ fill: C.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textSec, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }} formatter={v => `₦${Math.round(v).toLocaleString()}`} />
              <Bar dataKey="essential"     fill={C.white} radius={[4, 4, 0, 0]} name="Essential" />
              <Bar dataKey="discretionary" fill={C.g4}    radius={[4, 4, 0, 0]} name="Discretionary" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
            {[["Essential", C.white], ["Discretionary", C.g4]].map(([lbl, clr]) => (
              <span key={lbl} style={{ fontSize: 11, color: C.textSec, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, background: clr, display: "inline-block", borderRadius: 2 }} />{lbl}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly earnings vs spending history */}
      {monthlyTrend.length > 1 && (
        <div style={{ ...s.card, marginBottom: 18 }}>
          <div style={s.h3}>Monthly Earnings vs Spending — Full History</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
              <XAxis dataKey="label" tick={{ fill: C.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: C.textSec, fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }} formatter={v => `₦${Math.round(v).toLocaleString()}`} />
              <Bar dataKey="earned" fill={C.white} radius={[4, 4, 0, 0]} name="Earned" />
              <Bar dataKey="spent"  fill={C.g4}    radius={[4, 4, 0, 0]} name="Spent" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, marginTop: 6 }}>
            {[["Earned", C.white], ["Spent", C.g4]].map(([lbl, clr]) => (
              <span key={lbl} style={{ fontSize: 11, color: C.textSec, display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ width: 8, height: 8, background: clr, display: "inline-block", borderRadius: 2 }} />{lbl}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={s.card}>
        <div style={s.h3}>Full Category Breakdown</div>
        {Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, val]) => {
          const pct = total > 0 ? Math.round((val / (total / 100)) * 100) : 0;
          return (
            <div key={cat} style={{ marginBottom: 12 }}>
              <div style={{ ...s.sb, marginBottom: 4 }}>
                <span style={s.row}><span>{CATS[cat]?.icon}</span><span style={{ fontSize: 13 }}>{cat}</span></span>
                <span style={{ ...s.mono, fontSize: 12, color: C.textSec }}>₦{Math.round(val).toLocaleString()} · {pct}%</span>
              </div>
              <Prog pct={pct} thin />
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   GOALS — savings targets with deposit tracking
════════════════════════════════════════════════════════════════════ */

function Goals({ goals, onAdd, onDelete, onUpdate }) {
  const [showAdd,    setShowAdd]    = useState(false);
  const [form,       setForm]       = useState({ name: "", target: "", current: "", deadline: "" });
  const [depositId,  setDepositId]  = useState(null);
  const [depositAmt, setDepositAmt] = useState("");

  return (
    <div>
      <PageTitle
        title="Savings Goals"
        action={<button style={s.btn("primary")} onClick={() => setShowAdd(true)}>+ New Goal</button>}
      />

      {goals.length === 0 ? (
        <Empty icon="◎" title="No savings goals yet" sub="Create a goal — emergency fund, vacation, new device — and track your progress" />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(290px,1fr))", gap: 16 }}>
          {goals.map(g => {
            const pct      = Math.min(100, Math.round((g.current / g.target) * 100));
            const daysLeft = g.deadline ? Math.max(0, Math.round((new Date(g.deadline) - new Date()) / 86400000)) : null;

            return (
              <div key={g.id} style={{ ...s.card, borderTop: `2px solid ${C.white}` }}>
                <div style={{ ...s.sb, marginBottom: 14 }}>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{g.name}</div>
                  <button onClick={() => onDelete(g.id)} style={{ background: "none", border: "none", color: C.textTert, cursor: "pointer" }}>✕</button>
                </div>
                <div style={{ ...s.sb, marginBottom: 10 }}>
                  <div>
                    <div style={{ ...s.mono, fontSize: 26, fontWeight: 700 }}>{pct}%</div>
                    <div style={{ fontSize: 11, color: C.textSec }}>of goal</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ ...s.mono, fontSize: 13 }}>{fmtMoney(g.current / 100)}</div>
                    <div style={{ fontSize: 11, color: C.textSec }}>of {fmtMoney(g.target / 100)}</div>
                  </div>
                </div>
                <Prog pct={pct} />
                <div style={{ ...s.row, marginTop: 12, marginBottom: 14, flexWrap: "wrap", gap: 6 }}>
                  <span style={{ ...s.badge(C.textSec, "rgba(255,255,255,0.04)"), fontSize: 11 }}>
                    {fmtMoney((g.target - g.current) / 100)} left
                  </span>
                  {daysLeft !== null && (
                    <span style={{ ...s.badge(C.textTert, "rgba(255,255,255,0.03)"), fontSize: 11 }}>{daysLeft}d</span>
                  )}
                  {pct === 100 && <span style={{ ...s.badge(C.white, C.whiteDim), fontSize: 11 }}>Complete!</span>}
                </div>

                {depositId === g.id ? (
                  <div style={{ display: "flex", gap: 6 }}>
                    <input
                      style={{ ...s.input, flex: 1 }}
                      placeholder="₦ amount to add"
                      type="number"
                      value={depositAmt}
                      onChange={e => setDepositAmt(e.target.value)}
                      autoFocus
                    />
                    <button style={s.btn("primary")} onClick={() => {
                      onUpdate(g.id, { current: Math.min(g.target, g.current + parseFloat(depositAmt) * 100) });
                      setDepositId(null); setDepositAmt("");
                    }}>Add</button>
                    <button style={s.btn("ghost")} onClick={() => setDepositId(null)}>✕</button>
                  </div>
                ) : (
                  <button style={{ ...s.btn("ghost"), width: "100%" }} onClick={() => setDepositId(g.id)}>
                    + Add Funds
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showAdd && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.82)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 999 }}>
          <div style={{ background: C.card, border: `1px solid ${C.borderMed}`, borderRadius: 16, padding: 28, width: 380 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700, marginBottom: 20 }}>New Savings Goal</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <input style={s.input} placeholder="Goal name (e.g. Emergency Fund)"  value={form.name}     onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <input style={s.input} placeholder="Target amount (₦)" type="number"  value={form.target}   onChange={e => setForm(f => ({ ...f, target: e.target.value }))} />
              <input style={s.input} placeholder="Already saved (₦)" type="number"  value={form.current}  onChange={e => setForm(f => ({ ...f, current: e.target.value }))} />
              <input style={s.input} type="date"                                     value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} />
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...s.btn("ghost"), flex: 1 }} onClick={() => setShowAdd(false)}>Cancel</button>
                <button style={{ ...s.btn("primary"), flex: 2 }} onClick={() => {
                  if (!form.name || !form.target) return;
                  onAdd({ id: genId(), name: form.name, target: parseFloat(form.target) * 100, current: parseFloat(form.current || 0) * 100, deadline: form.deadline });
                  setForm({ name: "", target: "", current: "", deadline: "" });
                  setShowAdd(false);
                }}>Create Goal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   REPORTS — monthly financial statement, selectable history + CSV
════════════════════════════════════════════════════════════════════ */

function Reports({ transactions, earnings, budgets, goals }) {
  const isMobile = useIsMobile();
  const now = new Date();

  const [selectedMonth, setSelectedMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const monthOptions = [...new Set([
    ...transactions.map(t => `${t.year}-${String(t.month).padStart(2, "0")}`),
    ...earnings.map(e => `${e.year}-${String(e.month).padStart(2, "0")}`),
  ])].sort((a, b) => b.localeCompare(a));

  const [selYear, selMonth] = selectedMonth.split("-").map(Number);

  const monthTxns  = transactions.filter(t => t.month === selMonth && t.year === selYear);
  const monthEarns = earnings.filter(e => e.month === selMonth && e.year === selYear);

  const totalSpent  = monthTxns.reduce((s, t) => s + t.amount, 0);
  const totalEarned = monthEarns.reduce((s, e) => s + e.amount, 0);
  const disc        = monthTxns.filter(t => t.type === "discretionary").reduce((s, t) => s + t.amount, 0);
  const ess         = totalSpent - disc;
  const budgetTotal = budgets.reduce((s, b) => s + b.limit, 0);
  const surplus     = totalEarned > 0 ? totalEarned - totalSpent : budgetTotal - totalSpent;
  const savingsRate = totalEarned > 0 ? Math.max(0, Math.round(((totalEarned - totalSpent) / totalEarned) * 100)) : 0;

  const catTotals = {};
  monthTxns.forEach(t => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });

  const overBudget = budgets.filter(b => {
    const sp = monthTxns.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
    return sp > b.limit;
  });

  const weeklyData = ["W1", "W2", "W3", "W4"].map(w => {
    const wn    = parseInt(w[1]);
    const spent = monthTxns
      .filter(t => Math.ceil(new Date(t.date).getDate() / 7) === wn)
      .reduce((s, t) => s + t.amount / 100, 0);
    return { week: w, spent: Math.round(spent) };
  });

  const discScores = [
    { label: "Budget adherence",  val: budgetTotal > 0 ? Math.max(0, 100 - Math.round((Math.max(0, totalSpent - budgetTotal) / budgetTotal) * 100)) : 100 },
    { label: "Impulse control",   val: Math.max(0, 100 - Math.round((disc / Math.max(totalSpent, 1)) * 100)) },
    { label: "Savings rate",      val: savingsRate },
    { label: "Category tracking", val: Math.min(100, Math.round((Object.keys(catTotals).length / Object.keys(CATS).length) * 100)) },
  ];

  const downloadCSV = () => {
    const rows = [
      [`SpendWise Report — ${fmtMonth(selYear, selMonth)}`],
      [],
      ["INCOME"],
      ["Date", "Note", "Amount (₦)"],
      ...monthEarns.map(e => [e.date, e.note || "Income", (e.amount / 100).toFixed(2)]),
      [],
      ["EXPENSES"],
      ["Date", "Description", "Category", "Type", "Amount (₦)"],
      ...monthTxns.map(t => [t.date, t.description, t.category, t.type, (t.amount / 100).toFixed(2)]),
      [],
      ["SUMMARY"],
      ["Total Earned",  (totalEarned / 100).toFixed(2)],
      ["Total Spent",   (totalSpent  / 100).toFixed(2)],
      ["Net Position",  (surplus     / 100).toFixed(2)],
      ["Savings Rate",  `${savingsRate}%`],
    ];
    const csv  = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `spendwise-${selectedMonth}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <PageTitle
        title="Reports"
        sub="Monthly financial statements — select any past month to review"
        action={
          <div style={{ display: "flex", gap: 8 }}>
            <select style={{ ...s.select, width: "auto" }} value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
              {monthOptions.length === 0
                ? <option value={selectedMonth}>{fmtMonth(selYear, selMonth)}</option>
                : monthOptions.map(mk => {
                    const [y, m] = mk.split("-");
                    return <option key={mk} value={mk}>{fmtMonth(parseInt(y), parseInt(m))}</option>;
                  })}
            </select>
            {(monthTxns.length > 0 || monthEarns.length > 0) && (
              <button style={s.btn("ghost")} onClick={downloadCSV}>↓ Export CSV</button>
            )}
          </div>
        }
      />

      {monthTxns.length === 0 && monthEarns.length === 0 ? (
        <Empty icon="≡" title={`No data for ${fmtMonth(selYear, selMonth)}`} sub="Select a month that has transactions or earnings recorded" />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)", gap: 12, marginBottom: 18 }}>
            <StatCard label="Earnings"     value={totalEarned > 0 ? fmtMoney(totalEarned / 100) : "—"}             sub={totalEarned === 0 ? "Not recorded" : `${monthEarns.length} source(s)`} />
            <StatCard label="Total Spent"  value={fmtMoney(totalSpent / 100)}                                       sub={budgetTotal > 0 ? `vs ${fmtMoney(budgetTotal / 100)} budget` : "No budget set"} alert={budgetTotal > 0 && totalSpent > budgetTotal} />
            <StatCard label="Net Position" value={(surplus >= 0 ? "+" : "") + fmtMoney(surplus / 100)}              sub={surplus >= 0 ? "Surplus" : "Deficit"} alert={surplus < 0} />
            <StatCard label="Savings Rate" value={totalEarned > 0 ? `${savingsRate}%` : "—"}                       sub={totalEarned > 0 ? "of earnings saved" : "Log earnings first"} />
          </div>

          <div style={{ ...s.card, marginBottom: 18, borderTop: `2px solid ${C.white}` }}>
            <div style={{ ...s.sb, marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 700 }}>Financial Statement</div>
                <div style={{ fontSize: 12, color: C.textSec, marginTop: 3 }}>{fmtMonth(selYear, selMonth)}</div>
              </div>
              <div style={{ ...s.mono, fontSize: 11, color: C.textTert }}>
                {new Date().toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}
              </div>
            </div>

            {[
              { label: "Net Earnings",           value: totalEarned > 0 ? fmtMoney(totalEarned / 100) : "—",           note: totalEarned === 0 ? "Not recorded for this period" : `${monthEarns.length} income source(s)` },
              { label: "Essential Spending",     value: fmtMoney(ess / 100),                                            note: `${totalSpent > 0 ? Math.round((ess  / totalSpent) * 100) : 0}% of total expenditure` },
              { label: "Discretionary Spending", value: fmtMoney(disc / 100),                                           note: `${totalSpent > 0 ? Math.round((disc / totalSpent) * 100) : 0}% of total expenditure`, alert: disc > ess },
              { label: "Total Expenditure",      value: fmtMoney(totalSpent / 100),                                     note: budgetTotal > 0 ? `vs ₦${(budgetTotal / 100).toLocaleString()} budget` : "No budget set", alert: budgetTotal > 0 && totalSpent > budgetTotal },
              { label: "Surplus / Deficit",      value: (surplus >= 0 ? "+ " : "− ") + fmtMoney(Math.abs(surplus) / 100), note: surplus >= 0 ? "Within means" : "Spending exceeds income/budget", alert: surplus < 0 },
              { label: "Over-Budget Categories", value: overBudget.length > 0 ? overBudget.length : "None",            note: overBudget.length > 0 ? overBudget.map(b => b.category).join(", ") : "All categories within limits", alert: overBudget.length > 0 },
              { label: "Transactions",           value: monthTxns.length,                                               note: `${monthTxns.filter(t => t.type === "discretionary").length} discretionary / ${monthTxns.filter(t => t.type === "essential").length} essential` },
            ].map((r, i, arr) => (
              <div key={i} style={{ ...s.sb, padding: "12px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                <div style={{ fontSize: 13, color: C.textSec }}>{r.label}</div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ ...s.mono, fontSize: 14, fontWeight: 600, color: r.alert ? C.danger : C.white }}>{r.value}</div>
                  <div style={{ fontSize: 11, color: r.alert ? `${C.danger}99` : C.textTert }}>{r.note}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div style={s.card}>
              <div style={s.h3}>Weekly Spending (Within Month)</div>
              <ResponsiveContainer width="100%" height={170}>
                <BarChart data={weeklyData} margin={{ top: 4, right: 4, left: -30, bottom: 0 }}>
                  <XAxis dataKey="week" tick={{ fill: C.textSec, fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: C.textSec, fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: C.card2, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 12, color: C.text }} formatter={v => [`₦${v.toLocaleString()}`, "Spent"]} />
                  <Bar dataKey="spent" fill={C.white} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div style={s.card}>
              <div style={s.h3}>Category Statement</div>
              {Object.keys(catTotals).length === 0
                ? <Empty icon="◉" title="No spending recorded" sub="" />
                : Object.entries(catTotals).sort((a, b) => b[1] - a[1]).map(([cat, amt], i, arr) => {
                    const budget = budgets.find(b => b.category === cat);
                    const over   = budget && amt > budget.limit;
                    return (
                      <div key={cat} style={{ ...s.sb, padding: "9px 0", borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                        <span style={s.row}>
                          <span>{CATS[cat]?.icon}</span>
                          <span style={{ fontSize: 13 }}>{cat}</span>
                        </span>
                        <div style={{ textAlign: "right" }}>
                          <span style={{ ...s.mono, fontSize: 13, color: over ? C.danger : C.white }}>{fmtMoney(amt / 100)}</span>
                          {budget && <div style={{ fontSize: 10, color: over ? C.danger : C.textTert }}>{over ? "over limit" : `of ${fmtMoney(budget.limit / 100)}`}</div>}
                        </div>
                      </div>
                    );
                  })}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
            <div style={s.card}>
              <div style={s.h3}>Savings Goals Progress</div>
              {goals.length === 0
                ? <Empty icon="◎" title="No goals set" sub="" />
                : goals.map((g, i) => {
                    const pct = Math.min(100, Math.round((g.current / g.target) * 100));
                    return (
                      <div key={g.id} style={{ marginBottom: i < goals.length - 1 ? 16 : 0 }}>
                        <div style={{ ...s.sb, marginBottom: 5 }}>
                          <span style={{ fontSize: 13, fontWeight: 500 }}>{g.name}</span>
                          <span style={{ ...s.mono, fontSize: 12, color: C.textSec }}>{pct}%</span>
                        </div>
                        <Prog pct={pct} thin />
                        <div style={{ ...s.sb, marginTop: 4 }}>
                          <span style={{ fontSize: 11, color: C.textTert }}>{fmtMoney(g.current / 100)} saved</span>
                          <span style={{ fontSize: 11, color: C.textTert }}>{fmtMoney((g.target - g.current) / 100)} to go</span>
                        </div>
                      </div>
                    );
                  })}
            </div>

            <div style={s.card}>
              <div style={s.h3}>Discipline Scores</div>
              {discScores.map((item, i) => (
                <div key={i} style={{ marginBottom: i < discScores.length - 1 ? 14 : 0 }}>
                  <div style={{ ...s.sb, marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: C.textSec }}>{item.label}</span>
                    <span style={{ ...s.mono, fontSize: 12, fontWeight: 600, color: item.val >= 70 ? C.white : item.val >= 40 ? C.g3 : C.danger }}>
                      {item.val}/100
                    </span>
                  </div>
                  <Prog pct={item.val} thin />
                </div>
              ))}
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}`, textAlign: "center" }}>
                <div style={{ ...s.mono, fontSize: 28, fontWeight: 700 }}>
                  {Math.round(discScores.reduce((s, d) => s + d.val, 0) / discScores.length)}
                </div>
                <div style={{ fontSize: 12, color: C.textSec }}>Overall discipline score</div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   AI AUDIT — Claude-powered behavioral coaching
════════════════════════════════════════════════════════════════════ */

function Audit({ transactions, earnings, budgets }) {
  const isMobile = useIsMobile();
  const [insight, setInsight] = useState("");
  const [loading, setLoading] = useState(false);

  const now = new Date();
  const [selMonth, setSelMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
  );

  const monthOptions = [...new Set([
    ...transactions.map(t => `${t.year}-${String(t.month).padStart(2, "0")}`),
    ...earnings.map(e => `${e.year}-${String(e.month).padStart(2, "0")}`),
  ])].sort((a, b) => b.localeCompare(a));

  const [selYear, selMonthNum] = selMonth.split("-").map(Number);

  const monthTxns  = transactions.filter(t => t.month === selMonthNum && t.year === selYear);
  const monthEarns = earnings.filter(e => e.month === selMonthNum && e.year === selYear);

  const total      = monthTxns.reduce((s, t) => s + t.amount, 0);
  const earned     = monthEarns.reduce((s, e) => s + e.amount, 0);
  const disc       = monthTxns.filter(t => t.type === "discretionary").reduce((s, t) => s + t.amount, 0);
  const discPct    = total > 0 ? Math.round((disc / total) * 100) : 0;

  const overBudget = budgets.filter(b => {
    const sp = monthTxns.filter(t => t.category === b.category).reduce((s, t) => s + t.amount, 0);
    return sp > b.limit;
  });

  const topImpulse = [...monthTxns]
    .filter(t => t.type === "discretionary")
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  const getInsights = async () => {
    setLoading(true);
    setInsight("");
    try {
      const summary = {
        period:      fmtMonth(selYear, selMonthNum),
        totalEarned: earned > 0 ? fmtMoney(earned / 100) : "Not recorded",
        totalSpent:  fmtMoney(total / 100),
        netPosition: earned > 0 ? fmtMoney((earned - total) / 100) : "Unknown",
        discPct,
        topImpulse:  topImpulse.map(t => `${t.description} (${fmtMoney(t.amount / 100)})`),
        overBudget:  overBudget.map(b => b.category),
        txnCount:    monthTxns.length,
      };

      const data = await api.claude.message({
        max_tokens: 1000,
        system: `You are SpendWise AI — a sharp, direct, no-nonsense personal finance coach for someone who struggles with impulse spending. Analyze their spending data and give 4-6 specific, actionable, honest insights. Be direct — like a trusted friend telling hard truths, not a preachy lecturer. Nigerian Naira context. Format as short paragraphs, each led with a relevant emoji. Be encouraging but hold nothing back.`,
        messages: [{ role: "user", content: `Audit my finances for ${fmtMonth(selYear, selMonthNum)}:\n${JSON.stringify(summary, null, 2)}` }],
      });
      setInsight(data.content?.find(c => c.type === "text")?.text || "Unable to generate insights.");
    } catch {
      setInsight("Connection failed. Please check your internet and try again.");
    }
    setLoading(false);
  };

  return (
    <div>
      <PageTitle
        title="AI Audit"
        sub="Behavioral analysis & personalized coaching from Claude"
        action={
          monthOptions.length > 0 && (
            <select style={{ ...s.select, width: "auto" }} value={selMonth} onChange={e => { setSelMonth(e.target.value); setInsight(""); }}>
              {monthOptions.map(mk => {
                const [y, m] = mk.split("-");
                return <option key={mk} value={mk}>{fmtMonth(parseInt(y), parseInt(m))}</option>;
              })}
            </select>
          )
        }
      />

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 16, marginBottom: 18 }}>
        <StatCard label="Impulse Rate"  value={`${discPct}%`}              sub="of spending is non-essential"                       alert={discPct > 50} />
        <StatCard label="Over-Budget"   value={overBudget.length || "None"} sub={overBudget.map(b => b.category).join(", ") || "All within limits"} alert={overBudget.length > 0} />
        <StatCard label="Leaked Funds"  value={fmtMoney(disc / 100)}       sub="total discretionary spend"                          alert={disc > total * 0.4} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 16, marginBottom: 18 }}>
        <div style={s.card}>
          <div style={s.h3}>Top Impulse Purchases</div>
          {topImpulse.length === 0
            ? <Empty icon="🛍️" title="No impulse purchases" sub="Clean spending this period!" />
            : topImpulse.map((t, i) => (
                <div key={t.id} style={{ ...s.sb, padding: "10px 0", borderBottom: i < topImpulse.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={s.row}>
                    <span style={{ ...s.mono, fontSize: 12, color: C.textTert }}>#{i + 1}</span>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{t.description}</div>
                      <div style={{ fontSize: 11, color: C.textSec }}>{fmtDate(t.date)}</div>
                    </div>
                  </div>
                  <div style={{ ...s.mono, fontWeight: 600, color: C.g2 }}>{fmtMoney(t.amount / 100)}</div>
                </div>
              ))}
        </div>

        <div style={s.card}>
          <div style={s.h3}>Accountability Check</div>
          {[
            { label: "All categories within budget",   pass: overBudget.length === 0 },
            { label: "Impulse spending below 30%",     pass: discPct < 30 },
            { label: "No single impulse over ₦20,000", pass: !topImpulse.find(t => t.amount > 2000000) },
            { label: "Earnings recorded this month",   pass: monthEarns.length > 0 },
          ].map((item, i) => (
            <div key={i} style={{ ...s.row, padding: "9px 0", borderBottom: i < 3 ? `1px solid ${C.border}` : "none" }}>
              <span style={{ fontSize: 15, color: item.pass ? C.white : C.textTert, fontWeight: 700 }}>
                {item.pass ? "✓" : "✗"}
              </span>
              <span style={{ fontSize: 13, color: item.pass ? C.text : C.textSec }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ ...s.card, borderColor: insight ? C.borderMed : C.border }}>
        <div style={{ ...s.sb, marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 16, fontWeight: 700 }}>✦  AI Financial Coach</div>
            <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>Powered by Claude · Personalized coaching on your real data</div>
          </div>
          <button style={s.btn("primary")} onClick={getInsights} disabled={loading}>
            {loading ? "Analyzing…" : insight ? "Refresh" : "Get Insights"}
          </button>
        </div>

        {!insight && !loading && (
          <div style={{ background: C.surface, borderRadius: 10, padding: 24, textAlign: "center", color: C.textSec, fontSize: 14 }}>
            <div style={{ fontSize: 30, marginBottom: 10 }}>✦</div>
            Get a personalized spending audit and actionable coaching based on your real data for {fmtMonth(selYear, selMonthNum)}.
          </div>
        )}
        {loading && (
          <div style={{ padding: 24, textAlign: "center", color: C.textSec, fontSize: 14 }}>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite", marginRight: 8 }}>⟳</span>
            Analyzing your spending patterns…
          </div>
        )}
        {insight && (
          <div style={{ background: C.surface, borderRadius: 10, padding: 20, fontSize: 14, lineHeight: 1.8, color: C.text, whiteSpace: "pre-wrap" }}>
            {insight}
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════
   ROOT — SpendWise App
   ─ Starts completely empty (no placeholder data)
   ─ Loads all data from window.storage on mount
   ─ Auto-saves every state change after first load
   ─ All monetary values stored in KOBO (Naira × 100)
════════════════════════════════════════════════════════════════════ */

export default function SpendWise() {
  const isMobile = useIsMobile();
  const [view,         setView]         = useState("dashboard");
  const [transactions, setTransactions] = useState([]);
  const [earnings,     setEarnings]     = useState([]);
  const [budgets,      setBudgets]      = useState([]);
  const [goals,        setGoals]        = useState([]);
  const [user,         setUser]         = useState(null);
  const [loaded,       setLoaded]       = useState(false);
  const [lastActivity, setLastActivity] = useState(() => {
    try { return JSON.parse(localStorage.getItem("sw:lastActivity")) ?? null; } catch { return null; }
  });

  const loadData = async () => {
    // always fetch fresh from DB — clear any sessionStorage hits first
    ["transactions", "earnings", "budgets", "goals"].forEach(k => cache.del(k));
    try {
      const [txns, earns, budgs, gls] = await Promise.all([
        api.transactions.list(),
        api.earnings.list(),
        api.budgets.list(),
        api.goals.list(),
      ]);
      setTransactions(txns ?? []);
      setEarnings(earns ?? []);
      setBudgets(budgs ?? []);
      setGoals(gls ?? []);
    } catch (e) {
      console.error("Failed to load data:", e);
    }
  };

  useEffect(() => {
    authClient.getSession()
      .then(({ data }) => {
        if (data?.session) { setUser(data.user); return loadData(); }
      })
      .catch(console.error)
      .finally(() => setLoaded(true));
  }, []);

  const handleAuth = async (u) => { setUser(u); await loadData(); };

  const handleSignOut = async () => {
    await Promise.all([
      authClient.signOut(),
      fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:3000"}/api/auth/cache`, {
        method: "DELETE", credentials: "include",
      }).catch(() => {}),
    ]);
    cache.clear();
    setUser(null);
    setTransactions([]); setEarnings([]); setBudgets([]); setGoals([]);
  };

  const recordActivity = (label) => {
    const entry = { label, ts: new Date().toISOString() };
    setLastActivity(entry);
    try { localStorage.setItem("sw:lastActivity", JSON.stringify(entry)); } catch {}
  };

  // ── Transaction actions ──────────────────────────────────────────
  const addTransaction = (txn) => {
    setTransactions(p => [txn, ...p]);
    api.transactions.create(txn).catch(console.error);
    recordActivity("Transaction added");
  };
  const deleteTransaction = (id) => {
    setTransactions(p => p.filter(t => t.id !== id));
    api.transactions.delete(id).catch(console.error);
    recordActivity("Transaction deleted");
  };

  // ── Earning actions ──────────────────────────────────────────────
  const addEarning = (entry) => {
    setEarnings(p => [entry, ...p].sort((a, b) => new Date(b.date) - new Date(a.date)));
    api.earnings.create(entry).catch(console.error);
    recordActivity("Income recorded");
  };
  const deleteEarning = (id) => {
    setEarnings(p => p.filter(e => e.id !== id));
    api.earnings.delete(id).catch(console.error);
    recordActivity("Income deleted");
  };

  // ── Budget actions ───────────────────────────────────────────────
  const setBudgetLimit = async (category) => {
    const defaultLimit = 2000000;
    setBudgets(p => [...p, { category, limit: defaultLimit }]);
    try {
      const saved = await api.budgets.upsert({ category, limit: defaultLimit });
      if (saved) setBudgets(p => p.map(b => b.category === category ? { ...b, ...saved } : b));
      recordActivity(`Budget set · ${category}`);
    } catch (e) {
      console.error("Failed to save budget:", e);
      setBudgets(p => p.filter(b => b.category !== category));
    }
  };
  const updateBudgetLimit = async (category, limit) => {
    const prev = budgets.find(b => b.category === category);
    setBudgets(p => p.map(b => b.category === category ? { ...b, limit } : b));
    try {
      const saved = await api.budgets.upsert({ category, limit });
      if (saved) setBudgets(p => p.map(b => b.category === category ? { ...b, ...saved } : b));
      recordActivity(`Budget updated · ${category}`);
    } catch (e) {
      console.error("Failed to update budget:", e);
      if (prev) setBudgets(p => p.map(b => b.category === category ? prev : b));
    }
  };

  // ── Goal actions ─────────────────────────────────────────────────
  const addGoal = (goal) => {
    setGoals(p => [...p, goal]);
    api.goals.create(goal).catch(console.error);
    recordActivity("Goal created");
  };
  const deleteGoal = (id) => {
    setGoals(p => p.filter(g => g.id !== id));
    api.goals.delete(id).catch(console.error);
    recordActivity("Goal deleted");
  };
  const updateGoal = (id, updates) => {
    setGoals(p => p.map(g => g.id === id ? { ...g, ...updates } : g));
    api.goals.update(id, updates).catch(console.error);
    recordActivity("Goal updated");
  };

  // Over-budget count for sidebar badge
  const now = new Date();
  const overBudgetCount = budgets.filter(b => {
    const spent = transactions
      .filter(t => t.category === b.category && t.month === now.getMonth() + 1 && t.year === now.getFullYear())
      .reduce((s, t) => s + t.amount, 0);
    return spent > b.limit;
  }).length;

  if (!loaded) {
    return (
      <div style={{ display: "flex", height: "100vh", background: C.bg, alignItems: "center", justifyContent: "center" }}>
        <style>{FONTS}</style>
        <div style={{ fontSize: 14, color: C.textSec }}>Loading SpendWise…</div>
      </div>
    );
  }

  if (!user) return <AuthScreen onAuth={handleAuth} />;

  const views = (
    <>
      {view === "dashboard"    && <Dashboard    transactions={transactions} earnings={earnings} budgets={budgets} goals={goals} setView={setView} />}
      {view === "earnings"     && <Earnings     earnings={earnings}     onAdd={addEarning}    onDelete={deleteEarning} />}
      {view === "transactions" && <Transactions transactions={transactions} onAdd={addTransaction} onDelete={deleteTransaction} />}
      {view === "scanner"      && <Scanner      onAdd={addTransaction} />}
      {view === "budgets"      && <Budgets      transactions={transactions} budgets={budgets} onSetLimit={setBudgetLimit} onUpdateLimit={updateBudgetLimit} />}
      {view === "analytics"    && <Analytics    transactions={transactions} earnings={earnings} />}
      {view === "goals"        && <Goals        goals={goals} onAdd={addGoal} onDelete={deleteGoal} onUpdate={updateGoal} />}
      {view === "reports"      && <Reports      transactions={transactions} earnings={earnings} budgets={budgets} goals={goals} />}
      {view === "audit"        && <Audit        transactions={transactions} earnings={earnings} budgets={budgets} />}
    </>
  );

  return (
    <>
      <style>{FONTS}{`
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.08); border-radius: 2px; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes scan { 0%,100% { opacity: 0.2; } 50% { opacity: 0.9; } }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.2; }
        option { background: #141414; color: #fff; }
        button:disabled { opacity: 0.45; cursor: not-allowed !important; }
      `}</style>

      {isMobile ? (
        /* ══ MOBILE layout ══ */
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: C.bg, color: C.text, fontFamily: "'DM Sans', sans-serif", overflow: "hidden" }}>
          {/* Top header */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px 12px", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 18, fontWeight: 800, letterSpacing: "-0.5px" }}>
              Spend<span style={{ color: C.textSec }}>Wise</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: 12, color: C.textSec, fontWeight: 500 }}>
                {NAV.find(n => n.id === view)?.label}
              </div>
              <button onClick={handleSignOut} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, color: C.textSec, fontSize: 11, padding: "4px 9px", cursor: "pointer" }}>
                Out
              </button>
            </div>
          </div>

          {/* Last activity strip (mobile) */}
          {lastActivity && (
            <div style={{ flexShrink: 0, padding: "5px 20px", background: C.surface, borderBottom: `1px solid ${C.border}`, display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 10, color: C.textTert, textTransform: "uppercase", letterSpacing: "0.05em" }}>Last activity</span>
              <span style={{ fontSize: 11, color: C.textSec, fontWeight: 500 }}>{lastActivity.label}</span>
              <span style={{ fontSize: 10, color: C.textTert, marginLeft: "auto" }}>{timeAgo(lastActivity.ts)}</span>
            </div>
          )}

          {/* Scrollable content */}
          <div style={{ flex: 1, overflow: "auto", padding: "20px 16px 90px" }}>
            {views}
          </div>

          {/* Bottom tab bar */}
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: C.surface,
            borderTop: `1px solid ${C.border}`,
            display: "flex",
            overflowX: "auto",
            zIndex: 100,
          }}>
            {NAV.map(n => (
              <div
                key={n.id}
                onClick={() => setView(n.id)}
                style={{
                  flex: "0 0 auto",
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "10px 14px 8px",
                  cursor: "pointer",
                  color: view === n.id ? C.white : C.textSec,
                  minWidth: 58,
                  position: "relative",
                  borderTop: `2px solid ${view === n.id ? C.white : "transparent"}`,
                  transition: "color 0.12s",
                }}
              >
                <span style={{ fontSize: 15, fontFamily: "'JetBrains Mono',monospace", lineHeight: 1, marginBottom: 4 }}>{n.icon}</span>
                <span style={{ fontSize: 9, fontWeight: view === n.id ? 600 : 400, whiteSpace: "nowrap" }}>{n.label}</span>
                {n.id === "budgets" && overBudgetCount > 0 && (
                  <span style={{ position: "absolute", top: 5, right: 6, background: C.danger, color: "#fff", fontSize: 9, fontWeight: 700, padding: "1px 4px", borderRadius: 8 }}>
                    {overBudgetCount}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* ══ DESKTOP layout ══ */
        <div style={s.app}>
          {/* Sidebar */}
          <div style={s.sidebar}>
            <div style={{ padding: "24px 22px 22px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 21, fontWeight: 800, letterSpacing: "-0.5px" }}>
                Spend<span style={{ color: C.textSec }}>Wise</span>
              </div>
              <div style={{ fontSize: 11, color: C.textTert, marginTop: 3 }}>Financial Discipline Tool</div>
            </div>

            <div style={{ padding: "8px 0", flex: 1, overflowY: "auto" }}>
              {NAV.map(n => (
                <div
                  key={n.id}
                  onClick={() => setView(n.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 22px",
                    cursor: "pointer",
                    fontSize: 13,
                    fontWeight:  view === n.id ? 600 : 400,
                    color:       view === n.id ? C.white   : C.textSec,
                    background:  view === n.id ? C.whiteDim : "transparent",
                    borderLeft: `2px solid ${view === n.id ? C.white : "transparent"}`,
                    transition: "all 0.12s",
                    marginBottom: 1,
                  }}
                >
                  <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", opacity: view === n.id ? 1 : 0.4 }}>
                    {n.icon}
                  </span>
                  <span>{n.label}</span>
                  {n.id === "budgets" && overBudgetCount > 0 && (
                    <span style={{ marginLeft: "auto", background: C.danger, color: "#fff", fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 10 }}>
                      {overBudgetCount}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding: "16px 22px", borderTop: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 11, color: C.textTert }}>{fmtMonth(now.getFullYear(), now.getMonth() + 1)}</div>
              <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>
                {transactions.length} transactions · {earnings.length} income entries
              </div>
              {lastActivity && (
                <div style={{ marginTop: 8, padding: "7px 10px", background: C.whiteDim2, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                  <div style={{ fontSize: 10, color: C.textTert, marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.05em" }}>Last activity</div>
                  <div style={{ fontSize: 11, color: C.textSec, fontWeight: 500 }}>{lastActivity.label}</div>
                  <div style={{ fontSize: 10, color: C.textTert, marginTop: 1 }}>{timeAgo(lastActivity.ts)}</div>
                </div>
              )}
              <button
                onClick={handleSignOut}
                style={{ ...s.btn("ghost"), width: "100%", marginTop: 10, fontSize: 12, padding: "7px 12px" }}
              >
                Sign out
              </button>
            </div>
          </div>

          {/* Main content */}
          <div style={s.main}>{views}</div>
        </div>
      )}
    </>
  );
}
