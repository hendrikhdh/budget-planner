import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, onSnapshot } from "firebase/firestore";

// ─── Firebase Config ──────────────────────────────────────
// Zugangsdaten werden aus .env.local geladen (niemals im Code hart kodieren!).
// Vorlage: siehe .env.example
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ─── Helpers ───────────────────────────────────────────────
const uid = () => crypto.randomUUID().replace(/-/g, "");
const fmt = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" }).format(n);
const monthName = (m, y) => new Date(y, m).toLocaleString("de-DE", { month: "long", year: "numeric" });
const getToday = () => { const d = new Date(); return { month: d.getMonth(), year: d.getFullYear(), day: d.getDate() }; };
const pad = (n) => String(n).padStart(2, "0");
const dateStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;

const CAT_COLORS = [
  { name: "Cyan", hex: "#00f0ff" },
  { name: "Magenta", hex: "#ff00e5" },
  { name: "Grün", hex: "#00e87b" },
  { name: "Orange", hex: "#ff6b35" },
  { name: "Lila", hex: "#7b61ff" },
  { name: "Gelb", hex: "#ffd60a" },
  { name: "Rosa", hex: "#ff3860" },
  { name: "Lime", hex: "#b0ff57" },
  { name: "Blau", hex: "#4d8bff" },
  { name: "Koralle", hex: "#ff9580" },
  { name: "Türkis", hex: "#14b8a6" },
  { name: "Violett", hex: "#a855f7" },
  { name: "Hellblau", hex: "#38bdf8" },
  { name: "Dunkelorange", hex: "#f97316" },
  { name: "Dunkelgrün", hex: "#16a34a" },
  { name: "Hellrosa", hex: "#f472b6" },
  { name: "Braun", hex: "#a16207" },
  { name: "Silber", hex: "#94a3b8" },
  { name: "Dunkelrot", hex: "#dc2626" },
  { name: "Indigo", hex: "#6366f1" },
];

const DEFAULT_INCOME_CATS = [
  { name: "Gehalt", emoji: "💰", color: "#00e87b" }, { name: "Freelance", emoji: "💻", color: "#00f0ff" },
  { name: "Investitionen", emoji: "📈", color: "#7b61ff" }, { name: "Geschenke", emoji: "🎁", color: "#ff00e5" },
  { name: "Sonstiges", emoji: "📦", color: "#ffd60a" }
];
const DEFAULT_EXPENSE_CATS = [
  { name: "Miete", emoji: "🏠", color: "#ff3860" }, { name: "Lebensmittel", emoji: "🛒", color: "#ff6b35" },
  { name: "Transport", emoji: "🚗", color: "#4d8bff" }, { name: "Unterhaltung", emoji: "🎮", color: "#7b61ff" },
  { name: "Gesundheit", emoji: "💊", color: "#00e87b" }, { name: "Kleidung", emoji: "👕", color: "#ff00e5" },
  { name: "Bildung", emoji: "📚", color: "#ffd60a" }, { name: "Abonnements", emoji: "📱", color: "#00f0ff" },
  { name: "Restaurant", emoji: "🍽️", color: "#ff9580" }, { name: "Sonstiges", emoji: "📦", color: "#b0ff57" }
];

const catName = (c) => typeof c === "string" ? c : c.name;
const catEmoji = (c) => typeof c === "string" ? "" : (c.emoji || "");
const catColorVal = (c) => (typeof c === "string" ? CAT_COLORS[0].hex : c.color) || CAT_COLORS[0].hex;

// ─── Theme System ─────────────────────────────────────────
const themes = {
  dark: {
    income: "#00e87b",
    incomeSoft: "#0cbe6a",
    incomeGlow: "rgba(0,232,123,0.15)",
    expense: "#ff2d55",
    expenseSoft: "#e0264a",
    expenseGlow: "rgba(255,45,85,0.15)",
    accent: "#7b61ff",
    accentPink: "#ff00e5",
    bg: "#0d0d1a",
    bgGradient: "linear-gradient(135deg, #0d0d1a 0%, #111128 50%, #0d0d1a 100%)",
    card: "rgba(255,255,255,0.03)",
    cardBorder: "rgba(255,255,255,0.06)",
    cardHover: "rgba(255,255,255,0.06)",
    textPrimary: "#ffffff",
    textSecondary: "#aaaaaa",
    textMuted: "#666666",
    warning: "#ffd60a",
    headerBg: "rgba(13,13,26,0.95)",
    headerBorder: "rgba(255,255,255,0.06)",
    menuBg: "#111125",
    menuBorder: "rgba(123,97,255,0.15)",
    modalBg: "#151528",
    modalOverlay: "rgba(0,0,0,0.6)",
    inputBg: "#1a1a35",
    inputBorder: "rgba(255,255,255,0.1)",
    inputText: "#ffffff",
    chipInactiveBg: "rgba(255,255,255,0.06)",
    chipInactiveText: "#aaaaaa",
    titleGlow1: "#c4b5ff",
    titleShadow1: "0 0 7px rgba(123,97,255,0.9), 0 0 20px rgba(123,97,255,0.6), 0 0 40px rgba(123,97,255,0.4), 0 0 60px rgba(0,240,255,0.2)",
    titleGlow2: "#a0f0ff",
    titleShadow2: "0 0 7px rgba(0,240,255,0.9), 0 0 20px rgba(0,240,255,0.6), 0 0 40px rgba(0,240,255,0.4), 0 0 60px rgba(123,97,255,0.2)",
    scrollThumb: "rgba(123,97,255,0.3)",
    donutCenter: "#0d0d1a",
    chartText: "#ffffff",
    chartTextMuted: "#888888",
    gridLine: "rgba(255,255,255,0.05)",
    tableRow: "rgba(255,255,255,0.04)",
    exportBg: "#0d0d1a",
    exportText: "#00f0ff",
    // Glassmorphism is subtle in dark mode
    glassCard: "rgba(255,255,255,0.03)",
    glassCardOpaque: "#141428",
    glassBorder: "rgba(255,255,255,0.06)",
    glassBlur: "blur(12px)",
    glassShadow: "0 8px 32px rgba(0,0,0,0.3)",
  },
  light: {
    income: "#059669",
    incomeSoft: "#10b981",
    incomeGlow: "rgba(5,150,105,0.12)",
    expense: "#e11d48",
    expenseSoft: "#f43f5e",
    expenseGlow: "rgba(225,29,72,0.1)",
    accent: "#7c3aed",
    accentPink: "#c026d3",
    bg: "#f0f2ff",
    bgGradient: "linear-gradient(140deg, #e0e7ff 0%, #ede4ff 22%, #fce4ec 42%, #fff3e0 58%, #e0f7fa 78%, #e8eaf6 100%)",
    card: "rgba(255,255,255,0.5)",
    cardBorder: "rgba(255,255,255,0.7)",
    cardHover: "rgba(255,255,255,0.65)",
    textPrimary: "#1e1b4b",
    textSecondary: "#4b5563",
    textMuted: "#9ca3af",
    warning: "#d97706",
    headerBg: "rgba(255,255,255,0.55)",
    headerBorder: "rgba(255,255,255,0.75)",
    menuBg: "rgba(255,255,255,0.8)",
    menuBorder: "rgba(124,58,237,0.1)",
    modalBg: "rgba(255,255,255,0.85)",
    modalOverlay: "rgba(30,27,75,0.25)",
    inputBg: "rgba(255,255,255,0.65)",
    inputBorder: "rgba(124,58,237,0.12)",
    inputText: "#1e1b4b",
    chipInactiveBg: "rgba(124,58,237,0.06)",
    chipInactiveText: "#6b7280",
    titleGlow1: "#7c3aed",
    titleShadow1: "0 1px 10px rgba(124,58,237,0.2)",
    titleGlow2: "#c026d3",
    titleShadow2: "0 1px 10px rgba(192,38,211,0.2)",
    scrollThumb: "rgba(124,58,237,0.2)",
    donutCenter: "rgba(255,255,255,0.9)",
    chartText: "#1e1b4b",
    chartTextMuted: "#9ca3af",
    gridLine: "rgba(124,58,237,0.06)",
    tableRow: "rgba(124,58,237,0.03)",
    exportBg: "rgba(255,255,255,0.75)",
    exportText: "#7c3aed",
    // Glassmorphism — bright frosted glass
    glassCard: "rgba(255,255,255,0.42)",
    glassCardOpaque: "rgba(240,238,250,0.97)",
    glassBorder: "rgba(255,255,255,0.65)",
    glassBlur: "blur(22px)",
    glassShadow: "0 8px 32px rgba(100,80,160,0.07), 0 2px 8px rgba(100,80,160,0.04)",
  }
};

// ─── Storage (Firebase Firestore) ─────────────────────────
// Lokaler Fallback für den Zeitraum bis Firebase geladen hat
const STORAGE_KEY = "budget-planner-data";
const LS_SESSION_KEY = "budget-planner-enc-key";

// AES-GCM Verschlüsselung für localStorage
// Der Schlüssel liegt nur im sessionStorage – er wird beim Schließen des Tabs gelöscht.
const _getSessionKey = async () => {
  const stored = sessionStorage.getItem(LS_SESSION_KEY);
  if (stored) {
    const raw = Uint8Array.from(atob(stored), c => c.charCodeAt(0));
    return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["encrypt", "decrypt"]);
  }
  const key = await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
  const exported = await crypto.subtle.exportKey("raw", key);
  sessionStorage.setItem(LS_SESSION_KEY, btoa(String.fromCharCode(...new Uint8Array(exported))));
  return key;
};

const encryptLS = async (plaintext) => {
  const key = await _getSessionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(12 + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), 12);
  return btoa(String.fromCharCode(...combined));
};

const decryptLS = async (ciphertext) => {
  try {
    const key = await _getSessionKey();
    const data = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const iv = data.slice(0, 12);
    const encrypted = data.slice(12);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);
    return new TextDecoder().decode(decrypted);
  } catch { return null; }
};

const emptyData = () => ({
  entries: [], recurring: [],
  categories: { income: [], expense: [] },
  savingsGoals: [], appliedRecurring: {},
  budgets: {}, settings: {}
});

// Beispieldaten – Monate werden dynamisch auf die letzten 3 Monate gesetzt
const defaultData = () => {
  const now = new Date();
  // m0 = aktueller Monat, m1 = Vormonat, m2 = Vorvormonat
  const m = [0, 1, 2].map(offset => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return { month: d.getMonth(), year: d.getFullYear() };
  });
  const d = (monthOffset, day) => {
    const { month, year } = m[monthOffset];
    return `${year}-${pad(month + 1)}-${pad(day)}`;
  };
  return {
    entries: [
      { id: "t01", type: "income",  category: "Gehalt",        amount: 3200,  description: "Monatsgehalt",          date: d(2, 2)  },
      { id: "t02", type: "income",  category: "Freelance",     amount: 450,   description: "Webdesign-Projekt",      date: d(2, 10) },
      { id: "t03", type: "expense", category: "Miete",         amount: 850,   description: "Miete",                  date: d(2, 1)  },
      { id: "t04", type: "expense", category: "Lebensmittel",  amount: 312,   description: "Wocheneinkäufe",        date: d(2, 5)  },
      { id: "t05", type: "expense", category: "Transport",     amount: 89,    description: "Monatsticket VRR",       date: d(2, 3)  },
      { id: "t06", type: "expense", category: "Abonnements",   amount: 45.97, description: "Netflix + Spotify + iCloud", date: d(2, 1) },
      { id: "t07", type: "expense", category: "Restaurant",    amount: 78,    description: "Abendessen Altstadt",    date: d(2, 17) },
      { id: "t08", type: "expense", category: "Kleidung",      amount: 129,   description: "Winterjacke Sale",       date: d(2, 12) },
      { id: "t09", type: "expense", category: "Gesundheit",    amount: 35,    description: "Apotheke",               date: d(2, 20) },
      { id: "t10", type: "expense", category: "Unterhaltung",  amount: 60,    description: "Konzertkarten",          date: d(2, 25) },
      { id: "t11", type: "expense", category: "Bildung",       amount: 24.99, description: "Udemy Kurs",             date: d(2, 15) },
      { id: "t12", type: "income",  category: "Gehalt",        amount: 3200,  description: "Monatsgehalt",           date: d(1, 2)  },
      { id: "t13", type: "income",  category: "Investitionen", amount: 120,   description: "Dividende ETF",          date: d(1, 15) },
      { id: "t14", type: "income",  category: "Geschenke",     amount: 50,    description: "Geburtstagsgeld",        date: d(1, 22) },
      { id: "t15", type: "expense", category: "Miete",         amount: 850,   description: "Miete",                  date: d(1, 1)  },
      { id: "t16", type: "expense", category: "Lebensmittel",  amount: 287,   description: "Wocheneinkäufe",        date: d(1, 6)  },
      { id: "t17", type: "expense", category: "Transport",     amount: 89,    description: "Monatsticket VRR",       date: d(1, 2)  },
      { id: "t18", type: "expense", category: "Abonnements",   amount: 45.97, description: "Netflix + Spotify + iCloud", date: d(1, 1) },
      { id: "t19", type: "expense", category: "Restaurant",    amount: 110,   description: "Dinner mit Freunden",    date: d(1, 14) },
      { id: "t20", type: "expense", category: "Unterhaltung",  amount: 42,    description: "Kino + Popcorn",         date: d(1, 8)  },
      { id: "t21", type: "expense", category: "Gesundheit",    amount: 90,    description: "Zahnarzt Zuzahlung",     date: d(1, 18) },
      { id: "t22", type: "expense", category: "Sonstiges",     amount: 65,    description: "Geschenk",               date: d(1, 13) },
      { id: "t23", type: "expense", category: "Lebensmittel",  amount: 58,    description: "Asiamarkt",              date: d(1, 20) },
      { id: "t24", type: "income",  category: "Gehalt",        amount: 3200,  description: "Monatsgehalt",           date: d(0, 2)  },
      { id: "t25", type: "income",  category: "Freelance",     amount: 800,   description: "Logo-Design Auftrag",    date: d(0, 8)  },
      { id: "t26", type: "income",  category: "Sonstiges",     amount: 35,    description: "Kleinanzeigen Verkauf",  date: d(0, 5)  },
      { id: "t27", type: "expense", category: "Miete",         amount: 850,   description: "Miete",                  date: d(0, 1)  },
      { id: "t28", type: "expense", category: "Lebensmittel",  amount: 295,   description: "Wocheneinkäufe",        date: d(0, 4)  },
      { id: "t29", type: "expense", category: "Transport",     amount: 89,    description: "Monatsticket VRR",       date: d(0, 2)  },
      { id: "t30", type: "expense", category: "Abonnements",   amount: 45.97, description: "Netflix + Spotify + iCloud", date: d(0, 1) },
      { id: "t31", type: "expense", category: "Restaurant",    amount: 52,    description: "Brunch mit Freunden",    date: d(0, 9)  },
      { id: "t32", type: "expense", category: "Bildung",       amount: 39.99, description: "Fachbuch",               date: d(0, 6)  },
      { id: "t33", type: "expense", category: "Lebensmittel",  amount: 47,    description: "Wochenmarkt",            date: d(0, 11) },
      { id: "t34", type: "expense", category: "Unterhaltung",  amount: 35,    description: "Bowling-Abend",          date: d(0, 7)  },
      { id: "t35", type: "expense", category: "Kleidung",      amount: 79,    description: "Sneakers",               date: d(0, 10) },
    ],
    recurring: [
      { id: "r01", type: "expense", category: "Miete",       amount: 850,   description: "Miete",           startMonth: m[2].month, startYear: m[2].year, cycle: 1, endMonth: null, endYear: null },
      { id: "r02", type: "expense", category: "Abonnements", amount: 45.97, description: "Streaming-Abos", startMonth: m[2].month, startYear: m[2].year, cycle: 1, endMonth: null, endYear: null },
      { id: "r03", type: "income",  category: "Gehalt",      amount: 3200,  description: "Monatsgehalt",    startMonth: m[2].month, startYear: m[2].year, cycle: 1, endMonth: null, endYear: null },
    ],
    categories: { income: [...DEFAULT_INCOME_CATS], expense: [...DEFAULT_EXPENSE_CATS] },
    savingsGoals: [
      { id: "sg1", name: "Urlaub Japan",    target: 3000, saved: 1250, emoji: "✈️" },
      { id: "sg2", name: "Notgroschen",     target: 5000, saved: 3800, emoji: "🛡️" },
      { id: "sg3", name: "Neues MacBook",   target: 2000, saved: 620,  emoji: "💻" },
    ],
    appliedRecurring: {},
    budgets: { "Lebensmittel": 400, "Restaurant": 150, "Unterhaltung": 100, "Kleidung": 150 },
    settings: {}
  };
};

// ─── Icons ────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = "currentColor" }) => {
  const s = { width: size, height: size, fill: "none", stroke: color, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" };
  const p = {
    menu: <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>,
    plus: <><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>,
    left: <polyline points="15 18 9 12 15 6"/>,
    right: <polyline points="9 18 15 12 9 6"/>,
    x: <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>,
    home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
    trendUp: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>,
    trendDown: <><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></>,
    tag: <><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></>,
    repeat: <><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
    upload: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>,
    target: <><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></>,
    trash: <><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></>,
    sun: <><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    zap: <><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></>,
    info: <><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>,
    search: <><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></>,
    wallet: <><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4z"/></>,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  };
  return <svg viewBox="0 0 24 24" style={s}>{p[name]}</svg>;
};

// ─── Donut ────────────────────────────────────────────────
const fmtWhole = (n) => new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n);

const DonutChart = ({ data, size = 200, T }) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, fontSize: 14 }}>Keine Daten</div>;
  let cum = 0;
  const r = size / 2 - 10, cx = size / 2, cy = size / 2;
  const slices = data.filter(d => d.value > 0).map((d) => {
    const pct = d.value / total;
    const sa = cum * 2 * Math.PI - Math.PI / 2;
    cum += pct;
    const ea = cum * 2 * Math.PI - Math.PI / 2;
    const midAngle = (sa + ea) / 2;
    return { ...d, pct, sa, ea, midAngle };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {slices.map((d, i) => {
        const lg = d.pct > 0.5 ? 1 : 0;
        const x1 = cx + r * Math.cos(d.sa), y1 = cy + r * Math.sin(d.sa);
        const x2 = cx + r * Math.cos(d.ea), y2 = cy + r * Math.sin(d.ea);
        if (d.pct >= 0.999) return <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={d.color} strokeWidth={28}/>;
        return <path key={i} d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${lg} 1 ${x2} ${y2} Z`} fill={d.color} opacity={0.85}/>;
      })}
      {slices.filter(d => d.pct >= 0.10).map((d, i) => {
        const labelR = r * 0.78;
        const lx = cx + labelR * Math.cos(d.midAngle);
        const ly = cy + labelR * Math.sin(d.midAngle);
        return <text key={`p${i}`} x={lx} y={ly} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={10} fontWeight="700" style={{ textShadow: "0 1px 3px rgba(0,0,0,0.7)" }}>{Math.round(d.pct * 100)}%</text>;
      })}
      <circle cx={cx} cy={cy} r={r * 0.55} fill={T.donutCenter}/>
      <text x={cx} y={cy - 6} textAnchor="middle" fill={T.chartText} fontSize={16} fontWeight="700">{fmtWhole(total)}</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill={T.chartTextMuted} fontSize={11}>Gesamt</text>
    </svg>
  );
};

// ─── Line Chart ───────────────────────────────────────────
const fmtShort = (n) => n >= 1000 ? (n / 1000).toFixed(1).replace('.0', '') + 'k' : Math.round(n).toString();

const LineChart = ({ points, color = "#00f0ff", height = 240, T }) => {
  const w = 500, h = 200, padX = 30, padTop = 28, padBot = 30;
  const chartH = h - padTop - padBot;
  if (points.length < 2) return <div style={{ height, display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted, fontSize: 13 }}>Nicht genug Daten</div>;
  const maxV = Math.max(...points.map(p => p.v), 1);
  const coords = points.map((p, i) => ({
    x: padX + (i / (points.length - 1)) * (w - padX * 2),
    y: padTop + chartH - (p.v / maxV) * chartH
  }));
  const pathD = coords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
  const areaD = pathD + ` L ${coords[coords.length - 1].x} ${padTop + chartH} L ${coords[0].x} ${padTop + chartH} Z`;
  const gid = `lg-${color.replace("#", "")}-${Math.random().toString(36).slice(2, 6)}`;
  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="xMidYMid meet">
        <defs><linearGradient id={gid} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.25}/><stop offset="100%" stopColor={color} stopOpacity={0}/></linearGradient></defs>
        {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
          const gy = padTop + chartH - f * chartH;
          return <line key={i} x1={padX} y1={gy} x2={w - padX} y2={gy} stroke={T.gridLine} strokeWidth={0.5}/>;
        })}
        <path d={areaD} fill={`url(#${gid})`}/>
        <path d={pathD} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round"/>
        {coords.map((c, i) => <circle key={i} cx={c.x} cy={c.y} r={4} fill={color} stroke={T.donutCenter} strokeWidth={1.5}/>)}
        {coords.map((c, i) => points[i].v > 0 && <text key={`v${i}`} x={c.x} y={c.y - 10} textAnchor="middle" fill={T.chartText} fontSize={11} fontWeight="700">{fmtShort(points[i].v)}</text>)}
        {coords.map((c, i) => <text key={`t${i}`} x={c.x} y={h - 6} textAnchor="middle" fill={T.chartTextMuted} fontSize={10} fontWeight="500">{points[i].label}</text>)}
      </svg>
    </div>
  );
};

// ─── Bar Chart ────────────────────────────────────────────
const BarChart = ({ data, height = 220, T }) => {
  const maxV = Math.max(...data.map(d => Math.max(d.income, d.expense)), 1);
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg viewBox={`0 0 400 ${height + 30}`} style={{ width: "100%", minWidth: 350, height: height + 30 }}>
        {data.map((d, i) => {
          const bw = 12, gap = 400 / 12, x = gap * i + gap / 2 - bw;
          const hI = (d.income / maxV) * height, hE = (d.expense / maxV) * height;
          return (
            <g key={i}>
              <rect x={x} y={height - hI} width={bw} height={hI} fill={T.income} opacity={0.7} rx={3}/>
              <rect x={x + bw + 2} y={height - hE} width={bw} height={hE} fill={T.expense} opacity={0.7} rx={3}/>
              <text x={x + bw} y={height + 16} textAnchor="middle" fill={T.chartTextMuted} fontSize={10}>{d.label}</text>
            </g>
          );
        })}
      </svg>
      <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 4 }}>
        <span style={{ fontSize: 12, color: T.income }}>● Einnahmen</span>
        <span style={{ fontSize: 12, color: T.expense }}>● Ausgaben</span>
      </div>
    </div>
  );
};

// ─── Modal ────────────────────────────────────────────────
const Modal = ({ open, onClose, title, children, T }) => {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={onClose}>
      <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(8px)" }}/>
      <div onClick={e => e.stopPropagation()} style={{
        position: "relative", width: "100%", maxWidth: 480, maxHeight: "85vh", background: T.modalBg,
        backdropFilter: T.glassBlur,
        borderRadius: "20px 20px 0 0", padding: "20px 20px 32px", overflowY: "auto",
        border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow,
        animation: "slideUp .3s ease"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: T.textPrimary, fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: T.textMuted, padding: 4 }}><Icon name="x" size={22}/></button>
        </div>
        {children}
      </div>
    </div>
  );
};

// ─── Entry Item ───────────────────────────────────────────
const EntryItem = ({ e, onClick, emojiLookup, colorLookup, T }) => {
  const emoji = emojiLookup ? emojiLookup(e.category, e.type) : "";
  const dotColor = colorLookup ? colorLookup(e.category, e.type) : CAT_COLORS[0].hex;
  return (
    <div onClick={onClick} style={{
      background: T.glassCard, backdropFilter: T.glassBlur, borderRadius: 12,
      border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow,
      display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", cursor: "pointer",
      transition: "all .15s"
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, flexShrink: 0, boxShadow: `0 0 6px ${dotColor}50` }}/>
        {emoji && <span style={{ fontSize: 18 }}>{emoji}</span>}
        <div>
          <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>{e.description || e.category}</div>
          <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{e.category} · {new Date(e.date).toLocaleDateString("de-DE")}</div>
        </div>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: e.type === "income" ? T.income : T.expense }}>
        {e.type === "income" ? "+" : "−"}{fmt(e.amount)}
      </div>
    </div>
  );
};

// ─── Month Nav ────────────────────────────────────────────
const MonthNav = ({ viewMonth, viewYear, prevMonth, nextMonth, goToday, T, btnSecondary }) => (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, margin: "16px 0" }}>
    <button onClick={prevMonth} style={{ ...btnSecondary, padding: "8px", borderRadius: "50%", display: "flex" }}><Icon name="left" size={18}/></button>
    <span style={{ fontSize: 20, fontWeight: 700, color: T.textPrimary, minWidth: 170, textAlign: "center" }}>{monthName(viewMonth, viewYear)}</span>
    <button onClick={nextMonth} style={{ ...btnSecondary, padding: "8px", borderRadius: "50%", display: "flex" }}><Icon name="right" size={18}/></button>
    <button onClick={goToday} style={{ ...btnSecondary, padding: "8px 16px", fontSize: 13, fontWeight: 700 }}>Heute</button>
  </div>
);

// ════════════════════════════════════════════════════════════
//  PAGE COMPONENTS
// ════════════════════════════════════════════════════════════

function CategoriesPage({ data, setData, T, styles }) {
  const { inputStyle, selectStyle, labelStyle, btnPrimary, btnSecondary, chipStyle, glassCardStyle } = styles;
  const [newCat, setNewCat] = useState("");
  const [newEmoji, setNewEmoji] = useState("");
  const [newColor, setNewColor] = useState(CAT_COLORS[0].hex);
  const [catType, setCatType] = useState("expense");
  const [editIdx, setEditIdx] = useState(null);
  const [editForm, setEditForm] = useState({ name: "", emoji: "", color: "" });
  const [showAddForm, setShowAddForm] = useState(false);

  const addCat = () => {
    if (!newCat.trim()) return;
    setData(prev => ({ ...prev, categories: { ...prev.categories, [catType]: [...prev.categories[catType], { name: newCat.trim(), emoji: newEmoji || "", color: newColor }] } }));
    setNewCat(""); setNewEmoji(""); setNewColor(CAT_COLORS[0].hex);
  };
  const removeCat = (type, idx) => {
    const deletedName = catName(cats[idx]);
    setData(prev => ({
      ...prev,
      categories: { ...prev.categories, [type]: prev.categories[type].filter((_, i) => i !== idx) },
      entries: prev.entries.map(e =>
        e.type === type && e.category === deletedName ? { ...e, category: "Nicht zugeordnet" } : e
      )
    }));
    if (editIdx === idx) setEditIdx(null);
  };

  const openEdit = (i) => {
    if (editIdx === i) { setEditIdx(null); return; }
    const cat = cats[i];
    setEditForm({ name: catName(cat), emoji: catEmoji(cat), color: catColorVal(cat) });
    setEditIdx(i);
  };

  const saveEdit = () => {
    if (editIdx === null || !editForm.name.trim()) return;
    setData(prev => {
      const updated = [...prev.categories[catType]];
      updated[editIdx] = { name: editForm.name.trim(), emoji: editForm.emoji, color: editForm.color };
      return { ...prev, categories: { ...prev.categories, [catType]: updated } };
    });
    setEditIdx(null);
  };

  const cats = (catType === "expense" ? data.categories.expense : data.categories.income)
    .filter(c => catName(c) !== "Nicht zugeordnet");

  const ColorDots = ({ selected, onSelect, size = 18 }) => (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {CAT_COLORS.map(c => (
        <button key={c.hex} onClick={() => onSelect(c.hex)} style={{
          width: size, height: size, borderRadius: "50%", background: c.hex, border: selected === c.hex ? `2px solid ${T.textPrimary}` : "2px solid transparent",
          cursor: "pointer", padding: 0, boxShadow: selected === c.hex ? `0 0 8px ${c.hex}` : "none", transition: "all .15s"
        }} title={c.name}/>
      ))}
    </div>
  );

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Kategorien</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => { setCatType("expense"); setEditIdx(null); }} style={chipStyle(catType === "expense")}>Ausgaben</button>
        <button onClick={() => { setCatType("income"); setEditIdx(null); }} style={chipStyle(catType === "income")}>Einnahmen</button>
      </div>
      {/* Add-Form Modal */}
      {showAddForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 400, display: "flex", alignItems: "flex-end", justifyContent: "center" }} onClick={() => setShowAddForm(false)}>
          <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(6px)" }}/>
          <div onClick={e => e.stopPropagation()} style={{
            position: "relative", width: "100%", maxWidth: 520,
            background: T.modalBg, backdropFilter: T.glassBlur,
            borderRadius: "20px 20px 0 0", padding: "24px 20px 40px",
            border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow, animation: "slideUp .3s ease"
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 14 }}>Neue Kategorie</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <input value={newEmoji} onChange={e => setNewEmoji(e.target.value)} placeholder="😀" style={{ ...inputStyle, width: 52, textAlign: "center", fontSize: 20, padding: "6px" }}/>
              <input value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { addCat(); setShowAddForm(false); } }} placeholder="Neue Kategorie..." style={{ ...inputStyle, flex: 1 }} autoFocus/>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 8 }}>Farbe wählen</div>
              <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{
                width: "100%", height: 40, border: `1px solid ${T.inputBorder}`, borderRadius: 10,
                background: T.inputBg, cursor: "pointer", padding: 2, display: "block", marginBottom: 10
              }}/>
              <ColorDots selected={newColor} onSelect={setNewColor}/>
            </div>
            <button onClick={() => { addCat(); setShowAddForm(false); }} style={{ ...btnPrimary, padding: "10px 16px", fontSize: 13 }}>Hinzufügen</button>
          </div>
        </div>
      )}
      {cats.map((cat, i) => {
        const isEditing = editIdx === i;
        return (
          <SwipeToDelete key={catName(cat) + i} onDelete={() => removeCat(catType, i)} T={T} disabled={isEditing}>
            <div onClick={() => openEdit(i)} style={{
              ...glassCardStyle, display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "12px 16px", cursor: "pointer",
              border: isEditing ? `1px solid ${T.accent}50` : glassCardStyle.border,
              borderRadius: isEditing ? "14px 14px 0 0" : 14,
              transition: "all .15s"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ width: 14, height: 14, borderRadius: "50%", background: catColorVal(cat), flexShrink: 0, boxShadow: `0 0 6px ${catColorVal(cat)}40` }}/>
                <span style={{ fontSize: 18, minWidth: 24, textAlign: "center" }}>{catEmoji(cat) || "·"}</span>
                <span style={{ color: T.textPrimary, fontSize: 14 }}>{catName(cat)}</span>
              </div>
              {isEditing && <Icon name="x" size={15} color={T.textMuted}/>}
            </div>
            {isEditing && (
              <div style={{
                background: T.glassCard, backdropFilter: T.glassBlur,
                borderRadius: "0 0 14px 14px", padding: "14px 16px",
                border: `1px solid ${T.accent}50`, borderTop: "none",
                boxShadow: T.glassShadow
              }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Emoji</div>
                    <input value={editForm.emoji} onChange={e => setEditForm(f => ({ ...f, emoji: e.target.value }))}
                      style={{ ...inputStyle, width: 52, textAlign: "center", fontSize: 22, padding: "6px" }} placeholder="😀"/>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Name</div>
                    <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      onKeyDown={e => e.key === "Enter" && saveEdit()}
                      style={inputStyle} autoFocus/>
                  </div>
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 6 }}>Farbe</div>
                  <input type="color" value={editForm.color} onChange={e => setEditForm(f => ({ ...f, color: e.target.value }))} style={{
                    width: "100%", height: 36, border: `1px solid ${T.inputBorder}`, borderRadius: 10,
                    background: T.inputBg, cursor: "pointer", padding: 2, display: "block", marginBottom: 8
                  }}/>
                  <ColorDots selected={editForm.color} onSelect={(hex) => setEditForm(f => ({ ...f, color: hex }))} size={22}/>
                </div>
                <button onClick={saveEdit} style={{ ...btnPrimary, padding: "10px 16px", fontSize: 13 }}>Speichern</button>
              </div>
            )}
          </SwipeToDelete>
        );
      })}
      {/* FAB – Neue Kategorie */}
      <button onClick={() => setShowAddForm(true)} style={{
        position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
        borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`,
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px ${T.accent}50`, zIndex: 200, color: "#fff"
      }}>
        <Icon name="plus" size={24}/>
      </button>
    </div>
  );
}

function RecurringPage({ data, setData, T, styles }) {
  const { inputStyle, selectStyle, labelStyle, btnPrimary, btnSecondary, chipStyle, glassCardStyle } = styles;
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null); // { id, reset }
  const emptyForm = { type: "expense", category: "", amount: "", description: "", startMonth: String(getToday().month), startYear: String(getToday().year), cycle: "1", endMonth: "", endYear: "", hasEnd: false };
  const [form, setForm] = useState(emptyForm);
  const catsByType = (t) => t === "income" ? data.categories.income : data.categories.expense;

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (r) => {
    setEditId(r.id);
    setForm({ type: r.type, category: r.category, amount: String(r.amount), description: r.description, startMonth: String(r.startMonth), startYear: String(r.startYear), cycle: String(r.cycle), hasEnd: r.endYear != null, endMonth: r.endMonth != null ? String(r.endMonth) : "", endYear: r.endYear != null ? String(r.endYear) : "" });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const saveRecurring = () => {
    if (!form.amount || !form.category) return;
    const parsed = { ...form, amount: parseFloat(form.amount), startMonth: parseInt(form.startMonth), startYear: parseInt(form.startYear), cycle: parseInt(form.cycle), endMonth: form.hasEnd && form.endMonth !== "" ? parseInt(form.endMonth) : null, endYear: form.hasEnd && form.endYear !== "" ? parseInt(form.endYear) : null };
    if (editId) {
      setData(prev => ({ ...prev, recurring: prev.recurring.map(r => r.id === editId ? { ...r, ...parsed } : r) }));
    } else {
      setData(prev => ({ ...prev, recurring: [...prev.recurring, { ...parsed, id: uid() }] }));
    }
    closeForm();
  };

  const deleteRecurring = (id) => {
    setData(prev => ({ ...prev, recurring: prev.recurring.filter(r => r.id !== id) }));
    if (editId === id) closeForm();
  };

  const cycles = [{ v: "1", l: "Monatlich" }, { v: "2", l: "Alle 2 Monate" }, { v: "3", l: "Vierteljährlich" }, { v: "6", l: "Halbjährlich" }, { v: "12", l: "Jährlich" }];
  const months = Array.from({ length: 12 }, (_, i) => ({ v: String(i), l: new Date(2024, i).toLocaleString("de-DE", { month: "long" }) }));
  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Wiederkehrend</h2>
      {data.recurring.length === 0 && <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 32 }}>Keine wiederkehrenden Einträge</div>}

      {/* Form Modal */}
      <Modal open={showForm} onClose={closeForm} title={editId ? "Eintrag bearbeiten" : "Neuer Eintrag"} T={T}>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={() => setForm(f => ({ ...f, type: "expense", category: "" }))} style={chipStyle(form.type === "expense")}>Ausgabe</button>
          <button onClick={() => setForm(f => ({ ...f, type: "income", category: "" }))} style={chipStyle(form.type === "income")}>Einnahme</button>
        </div>
        <label style={labelStyle}>Kategorie</label>
        <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} style={selectStyle}>
          <option value="">Wählen...</option>
          {catsByType(form.type).map(c => <option key={catName(c)} value={catName(c)}>{catEmoji(c)} {catName(c)}</option>)}
        </select>
        <label style={labelStyle}>Betrag (€)</label>
        <input type="number" inputMode="decimal" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} style={inputStyle} placeholder="0.00"/>
        <label style={labelStyle}>Beschreibung</label>
        <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} placeholder="z.B. Netflix Abo"/>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}><label style={labelStyle}>Startmonat</label>
            <select value={form.startMonth} onChange={e => setForm(f => ({ ...f, startMonth: e.target.value }))} style={selectStyle}>
              {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
            </select></div>
          <div style={{ flex: 1 }}><label style={labelStyle}>Startjahr</label>
            <input type="number" value={form.startYear} onChange={e => setForm(f => ({ ...f, startYear: e.target.value }))} style={inputStyle}/></div>
        </div>
        <label style={labelStyle}>Zyklus</label>
        <select value={form.cycle} onChange={e => setForm(f => ({ ...f, cycle: e.target.value }))} style={selectStyle}>
          {cycles.map(c => <option key={c.v} value={c.v}>{c.l}</option>)}
        </select>
        <div style={{ marginTop: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: T.textSecondary, cursor: "pointer" }}>
            <input type="checkbox" checked={form.hasEnd} onChange={e => setForm(f => ({ ...f, hasEnd: e.target.checked }))} style={{ accentColor: T.accent }}/>
            Enddatum festlegen
          </label>
        </div>
        {form.hasEnd && (
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ flex: 1 }}><label style={labelStyle}>Endmonat</label>
              <select value={form.endMonth} onChange={e => setForm(f => ({ ...f, endMonth: e.target.value }))} style={selectStyle}>
                <option value="">Wählen...</option>
                {months.map(m => <option key={m.v} value={m.v}>{m.l}</option>)}
              </select></div>
            <div style={{ flex: 1 }}><label style={labelStyle}>Endjahr</label>
              <input type="number" value={form.endYear} onChange={e => setForm(f => ({ ...f, endYear: e.target.value }))} style={inputStyle} placeholder={String(getToday().year + 1)}/></div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={saveRecurring} style={btnPrimary}>{editId ? "Speichern" : "Hinzufügen"}</button>
        </div>
        {editId && (
          <button onClick={() => { if (window.confirm("Diesen Eintrag wirklich löschen?")) { deleteRecurring(editId); closeForm(); } }} style={{
            marginTop: 12, padding: "10px 18px", background: "none",
            border: `1px solid ${T.expense}40`, borderRadius: 10,
            color: T.expense, fontSize: 13, fontWeight: 600, cursor: "pointer",
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            <Icon name="trash" size={16} color={T.expense}/> Eintrag löschen
          </button>
        )}
      </Modal>

      {/* Swipe-Delete Confirmation Dialog */}
      {pendingDelete && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(6px)" }}/>
          <div style={{
            position: "relative", width: "85%", maxWidth: 340,
            background: T.modalBg, backdropFilter: T.glassBlur,
            borderRadius: 20, padding: "28px 24px 20px", textAlign: "center",
            border: `1px solid ${T.expense}30`, boxShadow: T.glassShadow, animation: "slideUp .3s ease"
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>Eintrag löschen?</div>
            <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 20, lineHeight: 1.5 }}>Dieser wiederkehrende Eintrag wird dauerhaft gelöscht.</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { pendingDelete.reset(); setPendingDelete(null); }} style={{ flex: 1, padding: "11px", background: T.glassCard, border: `1px solid ${T.glassBorder}`, borderRadius: 12, color: T.textPrimary, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Abbrechen</button>
              <button onClick={() => { deleteRecurring(pendingDelete.id); setPendingDelete(null); }} style={{ flex: 1, padding: "11px", background: `linear-gradient(135deg, ${T.expense}, #ff3333)`, border: "none", borderRadius: 12, color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>Löschen</button>
            </div>
          </div>
        </div>
      )}

      {[...data.recurring].sort((a, b) => {
        if (a.type !== b.type) return a.type === "income" ? -1 : 1;
        return b.amount - a.amount;
      }).map(r => {
        const cn = { 1: "Monatlich", 2: "Alle 2 Mo.", 3: "Vierteljährlich", 6: "Halbjährlich", 12: "Jährlich" }[r.cycle] || `Alle ${r.cycle} Mo.`;
        const endStr = r.endYear != null ? ` → ${new Date(r.endYear, r.endMonth || 0).toLocaleString("de-DE", { month: "short", year: "numeric" })}` : "";
        return (
          <SwipeToDelete key={r.id} onDelete={(reset) => setPendingDelete({ id: r.id, reset })} T={T}>
            <div onClick={() => openEdit(r)} style={{ ...glassCardStyle, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", cursor: "pointer", transition: "all .15s", borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div>
                  <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>{r.description || r.category}</div>
                  <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{r.category} · {cn} · ab {new Date(r.startYear, r.startMonth).toLocaleString("de-DE", { month: "short", year: "numeric" })}{endStr}</div>
                </div>
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, color: r.type === "income" ? T.income : T.expense }}>{fmt(r.amount)}</span>
            </div>
          </SwipeToDelete>
        );
      })}
      {/* FAB – Neuer wiederkehrender Eintrag */}
      <button onClick={openNew} style={{
        position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
        borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`,
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px ${T.accent}50`, zIndex: 200, color: "#fff"
      }}>
        <Icon name="plus" size={24}/>
      </button>
    </div>
  );
}

function SavingsPage({ data, setData, T, styles }) {
  const { inputStyle, labelStyle, btnPrimary, btnSecondary, glassCardStyle } = styles;
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const emptyForm = { name: "", target: "", saved: "0", emoji: "" };
  const [form, setForm] = useState(emptyForm);

  const openNew = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (g) => {
    setEditId(g.id);
    setForm({ name: g.name, target: String(g.target), saved: String(g.saved), emoji: g.emoji || "" });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm);
  };

  const saveGoal = () => {
    if (!form.name || !form.target) return;
    if (editId) {
      setData(prev => ({ ...prev, savingsGoals: prev.savingsGoals.map(g => g.id === editId ? { ...g, name: form.name, target: parseFloat(form.target), saved: parseFloat(form.saved) || 0, emoji: form.emoji } : g) }));
    } else {
      setData(prev => ({ ...prev, savingsGoals: [...prev.savingsGoals, { id: uid(), name: form.name, target: parseFloat(form.target), saved: parseFloat(form.saved) || 0, emoji: form.emoji }] }));
    }
    closeForm();
  };

  const deleteGoal = (id) => {
    setData(prev => ({ ...prev, savingsGoals: prev.savingsGoals.filter(g => g.id !== id) }));
    if (editId === id) closeForm();
  };

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Sparziele</h2>
      <Modal open={showForm} onClose={closeForm} title={editId ? "Sparziel bearbeiten" : "Neues Sparziel"} T={T}>
        <div style={{ display: "flex", gap: 8 }}>
          <div>
            <label style={labelStyle}>Emoji</label>
            <input value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} style={{ ...inputStyle, width: 52, textAlign: "center", fontSize: 22, padding: "6px" }} placeholder="🎯"/>
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} placeholder="z.B. Urlaub 2026"/>
          </div>
        </div>
        <label style={labelStyle}>Zielbetrag (€)</label>
        <input type="number" value={form.target} onChange={e => setForm(f => ({ ...f, target: e.target.value }))} style={inputStyle} placeholder="5000"/>
        <label style={labelStyle}>Bereits gespart (€)</label>
        <input type="number" value={form.saved} onChange={e => setForm(f => ({ ...f, saved: e.target.value }))} style={inputStyle} placeholder="0"/>
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={saveGoal} style={btnPrimary}>{editId ? "Speichern" : "Hinzufügen"}</button>
        </div>
        {editId && (
          <button onClick={() => { if (window.confirm("Dieses Sparziel wirklich löschen?")) { deleteGoal(editId); closeForm(); } }} style={{
            marginTop: 12, padding: "10px 18px", background: "none",
            border: `1px solid ${T.expense}40`, borderRadius: 10,
            color: T.expense, fontSize: 13, fontWeight: 600, cursor: "pointer",
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
          }}>
            <Icon name="trash" size={16} color={T.expense}/> Sparziel löschen
          </button>
        )}
      </Modal>
      {data.savingsGoals.length === 0 && !showForm && <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 32 }}>Noch keine Sparziele</div>}
      {data.savingsGoals.map(g => {
        const pct = Math.min((g.saved / g.target) * 100, 100);
        const isEditing = editId === g.id && showForm;
        return (
          <SwipeToDelete key={g.id} onDelete={() => deleteGoal(g.id)} T={T}>
            <div onClick={() => openEdit(g)} style={{ ...glassCardStyle, padding: "16px 18px", cursor: "pointer", border: isEditing ? `1px solid ${T.accent}50` : glassCardStyle.border, transition: "all .15s" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ color: T.textPrimary, fontSize: 15, fontWeight: 700 }}>{g.emoji && <span style={{ marginRight: 6 }}>{g.emoji}</span>}{g.name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSecondary, marginBottom: 6 }}><span>{fmt(g.saved)} gespart</span><span>{pct.toFixed(0)}% von {fmt(g.target)}</span></div>
              <div style={{ height: 8, background: `${T.textMuted}20`, borderRadius: 4, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? T.income : `linear-gradient(90deg, ${T.accent}, #00f0ff)`, borderRadius: 4, transition: "width .5s" }}/>
              </div>
              {pct >= 100 && <div style={{ marginTop: 6, fontSize: 12, color: T.income, fontWeight: 600 }}>✓ Ziel erreicht!</div>}
            </div>
          </SwipeToDelete>
        );
      })}
      {/* FAB – Neues Sparziel */}
      <button onClick={openNew} style={{
        position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
        borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`,
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px ${T.accent}50`, zIndex: 200, color: "#fff"
      }}>
        <Icon name="plus" size={24}/>
      </button>
    </div>
  );
}

// ─── Prediction Page ─────────────────────────────────────
function PredictionPage({ data, T, styles }) {
  const { glassCardStyle, btnSecondary, chipStyle } = styles;
  const [showMethod, setShowMethod] = useState(null);

  // ── Gather historical monthly data ──
  const monthlyData = useMemo(() => {
    const map = {};
    data.entries.forEach(e => {
      const d = new Date(e.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (!map[key]) map[key] = { year: d.getFullYear(), month: d.getMonth(), income: 0, expense: 0 };
      if (e.type === "income") map[key].income += e.amount;
      else map[key].expense += e.amount;
    });
    return Object.values(map).sort((a, b) => a.year - b.year || a.month - b.month);
  }, [data.entries]);

  const expenses = monthlyData.map(m => m.expense);
  const incomes = monthlyData.map(m => m.income);

  // ══════════════════════════════════════════════
  //  ALGORITHMEN
  // ══════════════════════════════════════════════

  // 1) Gewichteter gleitender Durchschnitt (WMA)
  //    Neuere Monate erhalten höheres Gewicht: w_i = i+1
  const weightedMovingAvg = (arr, horizon = 6) => {
    if (arr.length === 0) return Array(horizon).fill(0);
    const n = Math.min(arr.length, 6);
    const slice = arr.slice(-n);
    let wSum = 0, wTotal = 0;
    slice.forEach((v, i) => { const w = i + 1; wSum += v * w; wTotal += w; });
    const avg = wSum / wTotal;
    return Array(horizon).fill(Math.round(avg * 100) / 100);
  };

  // 2) Exponentielle Glättung (Holt's Double Exponential Smoothing)
  //    Erfasst Level UND Trend
  const holtSmoothing = (arr, horizon = 6, alpha = 0.4, beta = 0.2) => {
    if (arr.length < 2) return weightedMovingAvg(arr, horizon);
    let level = arr[0];
    let trend = arr[1] - arr[0];
    for (let i = 1; i < arr.length; i++) {
      const newLevel = alpha * arr[i] + (1 - alpha) * (level + trend);
      const newTrend = beta * (newLevel - level) + (1 - beta) * trend;
      level = newLevel;
      trend = newTrend;
    }
    const result = [];
    for (let h = 1; h <= horizon; h++) {
      result.push(Math.max(0, Math.round((level + trend * h) * 100) / 100));
    }
    return result;
  };

  // 3) Lineare Regression (Least Squares)
  //    y = a + b*x → Trendlinie
  const linearRegression = (arr, horizon = 6) => {
    const n = arr.length;
    if (n < 2) return weightedMovingAvg(arr, horizon);
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    arr.forEach((y, x) => { sumX += x; sumY += y; sumXY += x * y; sumXX += x * x; });
    const b = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const a = (sumY - b * sumX) / n;
    const result = [];
    for (let h = 0; h < horizon; h++) {
      result.push(Math.max(0, Math.round((a + b * (n + h)) * 100) / 100));
    }
    return result;
  };

  // 4) Saisonale Dekomposition
  //    Erkennt wiederkehrende Muster (z.B. Dez teurer als Feb)
  const seasonalForecast = (arr, monthlyArr, horizon = 6) => {
    if (arr.length < 3) return weightedMovingAvg(arr, horizon);
    // Berechne Durchschnitt pro Kalendermonat
    const monthBuckets = Array(12).fill(null).map(() => []);
    monthlyArr.forEach(m => monthBuckets[m.month].push(m.expense));
    const monthAvg = monthBuckets.map(b => b.length > 0 ? b.reduce((s, v) => s + v, 0) / b.length : 0);
    const globalAvg = arr.reduce((s, v) => s + v, 0) / arr.length;
    // Saisonale Indizes
    const seasonIdx = monthAvg.map(a => globalAvg > 0 ? a / globalAvg : 1);
    // Basis-Trend via Holt
    const holtBase = holtSmoothing(arr, horizon, 0.3, 0.15);
    // Letzter bekannter Monat
    const lastEntry = monthlyArr[monthlyArr.length - 1];
    const result = [];
    for (let h = 0; h < horizon; h++) {
      const futureMonth = (lastEntry.month + 1 + h) % 12;
      const idx = seasonIdx[futureMonth] || 1;
      result.push(Math.max(0, Math.round(holtBase[h] * idx * 100) / 100));
    }
    return result;
  };

  // 5) Ensemble: gewichtete Kombination aller Methoden
  //    WMA 15%, Holt 30%, LinReg 20%, Saisonal 35%
  const ensembleForecast = (arr, monthlyArr, horizon = 6) => {
    const wma = weightedMovingAvg(arr, horizon);
    const holt = holtSmoothing(arr, horizon);
    const lr = linearRegression(arr, horizon);
    const seasonal = seasonalForecast(arr, monthlyArr, horizon);
    return Array(horizon).fill(0).map((_, i) =>
      Math.max(0, Math.round((wma[i] * 0.15 + holt[i] * 0.3 + lr[i] * 0.2 + seasonal[i] * 0.35) * 100) / 100)
    );
  };

  // ── Wiederkehrende Kosten als Basis ──
  const recurringExpense = data.recurring.filter(r => r.type === "expense").reduce((s, r) => s + r.amount, 0);
  const recurringIncome = data.recurring.filter(r => r.type === "income").reduce((s, r) => s + r.amount, 0);

  // ── Prognosen berechnen ──
  const HORIZON = 6;
  const expEnsemble = ensembleForecast(expenses, monthlyData, HORIZON);
  const incEnsemble = ensembleForecast(incomes, monthlyData.map(m => ({ ...m, expense: m.income })), HORIZON);

  // Konfidenz-Bänder (±15% als einfache Annäherung, basierend auf historischer Varianz)
  const variance = (arr) => {
    if (arr.length < 2) return 0;
    const mean = arr.reduce((s, v) => s + v, 0) / arr.length;
    return Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / (arr.length - 1));
  };
  const expStd = variance(expenses);
  const incStd = variance(incomes);

  const lastEntry = monthlyData.length > 0 ? monthlyData[monthlyData.length - 1] : { month: getToday().month, year: getToday().year };

  // Forecast-Monate Labels
  const forecastLabels = Array(HORIZON).fill(0).map((_, i) => {
    let m = lastEntry.month + 1 + i;
    let y = lastEntry.year;
    while (m > 11) { m -= 12; y++; }
    return new Date(y, m).toLocaleString("de-DE", { month: "short", year: "2-digit" });
  });

  // ── Chart: Historical + Forecast ──
  const ForecastChart = ({ historical, forecast, forecastHigh, forecastLow, color, label, height = 260 }) => {
    const all = [...historical.slice(-8), ...forecast];
    const w = 500, h = 220, padX = 30, padTop = 28, padBot = 30;
    const chartH = h - padTop - padBot;
    const maxV = Math.max(...all, ...forecastHigh, 1);
    const totalPts = all.length;
    const histCount = Math.min(historical.length, 8);
    const histSlice = historical.slice(-8);

    const histLabels = monthlyData.slice(-(histCount)).map(m =>
      new Date(m.year, m.month).toLocaleString("de-DE", { month: "short" })
    );
    const allLabels = [...histLabels, ...forecastLabels];

    const getX = (i) => padX + (i / (totalPts - 1)) * (w - padX * 2);
    const getY = (v) => padTop + chartH - (v / maxV) * chartH;

    const histCoords = histSlice.map((v, i) => ({ x: getX(i), y: getY(v) }));
    const fcCoords = forecast.map((v, i) => ({ x: getX(histCount + i), y: getY(v) }));
    const hiCoords = forecastHigh.map((v, i) => ({ x: getX(histCount + i), y: getY(v) }));
    const loCoords = forecastLow.map((v, i) => ({ x: getX(histCount + i), y: getY(v) }));

    const histPath = histCoords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");
    const bridgePath = histCoords.length > 0 && fcCoords.length > 0
      ? `M ${histCoords[histCoords.length - 1].x} ${histCoords[histCoords.length - 1].y} L ${fcCoords[0].x} ${fcCoords[0].y}`
      : "";
    const fcPath = fcCoords.map((c, i) => `${i === 0 ? "M" : "L"} ${c.x} ${c.y}`).join(" ");

    // Confidence band area
    const bandPath = hiCoords.length > 0
      ? `M ${hiCoords[0].x} ${hiCoords[0].y} ` +
        hiCoords.slice(1).map(c => `L ${c.x} ${c.y}`).join(" ") + " " +
        loCoords.slice().reverse().map((c, i) => `${i === 0 ? "L" : "L"} ${c.x} ${c.y}`).join(" ") + " Z"
      : "";

    const gid = `fc-${color.replace("#", "")}-${Math.random().toString(36).slice(2, 6)}`;

    return (
      <div style={{ width: "100%" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>{label}</div>
        <svg viewBox={`0 0 ${w} ${h}`} style={{ width: "100%", height, display: "block" }} preserveAspectRatio="xMidYMid meet">
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
            const gy = padTop + chartH - f * chartH;
            return <line key={i} x1={padX} y1={gy} x2={w - padX} y2={gy} stroke={T.gridLine} strokeWidth={0.5}/>;
          })}
          {/* Divider line between history and forecast */}
          {histCoords.length > 0 && <line x1={histCoords[histCoords.length - 1].x + 6} y1={padTop} x2={histCoords[histCoords.length - 1].x + 6} y2={padTop + chartH} stroke={T.textMuted} strokeWidth={0.5} strokeDasharray="4 4"/>}
          {/* Confidence band */}
          {bandPath && <path d={bandPath} fill={color} opacity={0.08}/>}
          {/* Historical line */}
          <path d={histPath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round"/>
          {/* Bridge */}
          {bridgePath && <path d={bridgePath} fill="none" stroke={color} strokeWidth={1.5} strokeDasharray="4 4" opacity={0.5}/>}
          {/* Forecast line */}
          <path d={fcPath} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeDasharray="6 3"/>
          {/* Historical dots */}
          {histCoords.map((c, i) => <circle key={`h${i}`} cx={c.x} cy={c.y} r={3.5} fill={color} stroke={T.donutCenter} strokeWidth={1.5}/>)}
          {/* Forecast dots */}
          {fcCoords.map((c, i) => <circle key={`f${i}`} cx={c.x} cy={c.y} r={4} fill={T.donutCenter} stroke={color} strokeWidth={2}/>)}
          {/* Value labels */}
          {fcCoords.map((c, i) => <text key={`fv${i}`} x={c.x} y={c.y - 10} textAnchor="middle" fill={color} fontSize={10} fontWeight="700">{fmtShort(forecast[i])}</text>)}
          {/* X labels */}
          {allLabels.map((l, i) => <text key={`l${i}`} x={getX(i)} y={h - 6} textAnchor="middle" fill={i >= histCount ? color : T.chartTextMuted} fontSize={9} fontWeight={i >= histCount ? "700" : "500"}>{l}</text>)}
          {/* Legend labels */}
          <text x={padX} y={14} fill={T.chartTextMuted} fontSize={9}>Historisch</text>
          <text x={w - padX} y={14} textAnchor="end" fill={color} fontSize={9} fontWeight="600">Prognose →</text>
        </svg>
      </div>
    );
  };

  // Confidence bands
  const expHigh = expEnsemble.map(v => Math.round((v + expStd * 0.8) * 100) / 100);
  const expLow = expEnsemble.map(v => Math.max(0, Math.round((v - expStd * 0.8) * 100) / 100));
  const incHigh = incEnsemble.map(v => Math.round((v + incStd * 0.6) * 100) / 100);
  const incLow = incEnsemble.map(v => Math.max(0, Math.round((v - incStd * 0.6) * 100) / 100));

  // Einzelmethoden zum Vergleich
  const methods = [
    { key: "wma", name: "Gewichteter Ø", desc: "Neuere Monate zählen stärker. Einfach, stabil, reagiert langsam auf Trendwechsel.", exp: expenses, fn: weightedMovingAvg },
    { key: "holt", name: "Holt-Smoothing", desc: "Erfasst Level + Trend durch exponentielle Glättung mit zwei Parametern (α, β). Reagiert dynamisch auf Veränderungen.", exp: expenses, fn: holtSmoothing },
    { key: "lr", name: "Lineare Regression", desc: "Berechnet die Trendgerade (y = a + bx) per Least-Squares. Gut für konstante Trends, schlecht bei Richtungswechseln.", exp: expenses, fn: linearRegression },
    { key: "seasonal", name: "Saisonale Dekomposition", desc: "Erkennt Muster pro Kalendermonat (z.B. Dezember = teuer). Kombiniert Saisonindizes mit Holt-Basis.", exp: expenses, fn: (arr) => seasonalForecast(arr, monthlyData, HORIZON) },
  ];

  // Prognose-Bilanz
  const balanceForecast = expEnsemble.map((e, i) => incEnsemble[i] - e);

  const dataAvailable = monthlyData.length >= 2;

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>Prognose</h2>
      <p style={{ color: T.textMuted, fontSize: 12, marginBottom: 20, lineHeight: 1.5 }}>
        KI-gestützte Vorhersage deiner Finanzen für die nächsten {HORIZON} Monate
      </p>

      {!dataAvailable ? (
        <div style={{ ...glassCardStyle, padding: 24, textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>📊</div>
          <div style={{ color: T.textPrimary, fontSize: 15, fontWeight: 700, marginBottom: 6 }}>Zu wenig Daten</div>
          <div style={{ color: T.textMuted, fontSize: 13, lineHeight: 1.5 }}>Mindestens 2 Monate mit Einträgen werden benötigt, um eine Prognose zu erstellen.</div>
        </div>
      ) : (
        <>
          {/* Jahresbilanz */}
          {(() => {
            const currentYear = getToday().year;
            // YTD actual balance for current year
            const ytdIncome = monthlyData.filter(m => m.year === currentYear).reduce((s, m) => s + m.income, 0);
            const ytdExpense = monthlyData.filter(m => m.year === currentYear).reduce((s, m) => s + m.expense, 0);
            const ytdBalance = ytdIncome - ytdExpense;
            // Sum forecast months that fall in current year
            let fcIncome = 0, fcExpense = 0;
            balanceForecast.forEach((_, i) => {
              let m = lastEntry.month + 1 + i;
              let y = lastEntry.year;
              while (m > 11) { m -= 12; y++; }
              if (y === currentYear) { fcIncome += incEnsemble[i]; fcExpense += expEnsemble[i]; }
            });
            const projBalance = ytdBalance + fcIncome - fcExpense;
            const projColor = projBalance >= 0 ? T.income : T.expense;
            // 6-month totals
            const totalFcIncome = incEnsemble.reduce((s, v) => s + v, 0);
            const totalFcExpense = expEnsemble.reduce((s, v) => s + v, 0);
            const totalFcBalance = totalFcIncome - totalFcExpense;
            return (
              <div style={{ ...glassCardStyle, padding: "18px 20px", marginBottom: 16, border: `1px solid ${projColor}30` }}>
                <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 10, textTransform: "uppercase", letterSpacing: 0.5 }}>Jahresprognose {currentYear}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontSize: 12, color: T.textSecondary, marginBottom: 2 }}>Erwartete Jahresbilanz</div>
                    <div style={{ fontSize: 28, fontWeight: 800, color: projColor, lineHeight: 1.1 }}>{fmt(projBalance)}</div>
                    <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>YTD {fmt(ytdBalance)} + Prognose {fmt(fcIncome - fcExpense)}</div>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ flex: 1, background: `${T.income}10`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>Prognose Einnahmen</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.income }}>+{fmt(totalFcIncome)}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{HORIZON} Monate</div>
                  </div>
                  <div style={{ flex: 1, background: `${T.expense}10`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>Prognose Ausgaben</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: T.expense }}>−{fmt(totalFcExpense)}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{HORIZON} Monate</div>
                  </div>
                  <div style={{ flex: 1, background: `${totalFcBalance >= 0 ? T.income : T.expense}10`, borderRadius: 10, padding: "10px 12px" }}>
                    <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 2 }}>Prognose Bilanz</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: totalFcBalance >= 0 ? T.income : T.expense }}>{fmt(totalFcBalance)}</div>
                    <div style={{ fontSize: 10, color: T.textMuted }}>{HORIZON} Monate</div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Summary Cards */}
          <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
            {[
              { l: "Ø Ausgaben", v: expEnsemble.reduce((s, v) => s + v, 0) / HORIZON, c: T.expense },
              { l: "Ø Einnahmen", v: incEnsemble.reduce((s, v) => s + v, 0) / HORIZON, c: T.income },
              { l: "Ø Bilanz", v: balanceForecast.reduce((s, v) => s + v, 0) / HORIZON, c: balanceForecast.reduce((s, v) => s + v, 0) / HORIZON >= 0 ? T.income : T.expense },
            ].map(x => (
              <div key={x.l} style={{ flex: "1 1 90px", ...glassCardStyle, padding: "12px 14px" }}>
                <div style={{ fontSize: 10, color: T.textMuted, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.5 }}>{x.l}</div>
                <div style={{ fontSize: 17, fontWeight: 800, color: x.c }}>{fmt(x.v)}</div>
                <div style={{ fontSize: 10, color: T.textMuted, marginTop: 2 }}>/ Monat</div>
              </div>
            ))}
          </div>

          {/* Recurring Basis Info */}
          <div style={{ ...glassCardStyle, padding: "12px 16px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="repeat" size={16} color={T.accent}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: T.textSecondary }}>Feste monatliche Basis</div>
              <div style={{ fontSize: 13, color: T.textPrimary, fontWeight: 600, marginTop: 2 }}>
                <span style={{ color: T.income }}>+{fmt(recurringIncome)}</span>
                {" "}·{" "}
                <span style={{ color: T.expense }}>−{fmt(recurringExpense)}</span>
              </div>
            </div>
          </div>

          {/* Expense Forecast Chart */}
          <div style={{ ...glassCardStyle, padding: "16px 8px", marginBottom: 16 }}>
            <ForecastChart historical={expenses} forecast={expEnsemble} forecastHigh={expHigh} forecastLow={expLow} color={T.expense} label="Ausgaben-Prognose" />
          </div>

          {/* Income Forecast Chart */}
          <div style={{ ...glassCardStyle, padding: "16px 8px", marginBottom: 16 }}>
            <ForecastChart historical={incomes} forecast={incEnsemble} forecastHigh={incHigh} forecastLow={incLow} color={T.income} label="Einnahmen-Prognose" />
          </div>

          {/* Balance Forecast Table */}
          <div style={{ ...glassCardStyle, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 10 }}>Monatsübersicht Prognose</div>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
              <thead><tr style={{ borderBottom: `1px solid ${T.textMuted}30` }}>
                {["Monat", "Einnahmen", "Ausgaben", "Bilanz"].map(h => <th key={h} style={{ padding: "6px 4px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 10, textTransform: "uppercase" }}>{h}</th>)}
              </tr></thead>
              <tbody>{forecastLabels.map((label, i) => (
                <tr key={i} style={{ borderBottom: `1px solid ${T.tableRow}` }}>
                  <td style={{ padding: "8px 4px", color: T.textPrimary, fontWeight: 600 }}>{label}</td>
                  <td style={{ padding: "8px 4px", color: T.income }}>{fmt(incEnsemble[i])}</td>
                  <td style={{ padding: "8px 4px", color: T.expense }}>{fmt(expEnsemble[i])}</td>
                  <td style={{ padding: "8px 4px", color: balanceForecast[i] >= 0 ? T.income : T.expense, fontWeight: 700 }}>{fmt(balanceForecast[i])}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>

          {/* Method Comparison */}
          <div style={{ ...glassCardStyle, padding: 16, marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>Methodenvergleich (Ausgaben)</div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 12, lineHeight: 1.4 }}>
              Die Ensemble-Prognose oben kombiniert alle Methoden gewichtet. Hier siehst du jede einzeln:
            </div>
            {methods.map(m => {
              const vals = m.key === "seasonal" ? m.fn(m.exp) : m.fn(m.exp, HORIZON);
              const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
              return (
                <div key={m.key} style={{ marginBottom: 8 }}>
                  <div onClick={() => setShowMethod(showMethod === m.key ? null : m.key)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", cursor: "pointer", borderBottom: `1px solid ${T.tableRow}` }}>
                    <div>
                      <div style={{ fontSize: 13, color: T.textPrimary, fontWeight: 600 }}>{m.name}</div>
                      {showMethod === m.key && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4, lineHeight: 1.4, maxWidth: 300 }}>{m.desc}</div>}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: T.expense }}>Ø {fmt(avg)}</div>
                      <div style={{ fontSize: 10, color: T.textMuted }}>/ Monat</div>
                    </div>
                  </div>
                  {showMethod === m.key && (
                    <div style={{ display: "flex", gap: 6, padding: "8px 0", overflowX: "auto" }}>
                      {forecastLabels.map((l, i) => (
                        <div key={i} style={{ flex: "0 0 auto", background: `${T.expense}10`, borderRadius: 8, padding: "6px 10px", textAlign: "center", minWidth: 60 }}>
                          <div style={{ fontSize: 10, color: T.textMuted }}>{l}</div>
                          <div style={{ fontSize: 12, color: T.expense, fontWeight: 700, marginTop: 2 }}>{fmt(vals[i])}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Methodology Explanation */}
          <div style={{ ...glassCardStyle, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <Icon name="info" size={16} color={T.accent}/>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary }}>So funktioniert die Prognose</div>
            </div>
            <div style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 10 }}>
                Die Vorhersage nutzt ein <strong style={{ color: T.textPrimary }}>Ensemble-Modell</strong>, das vier unabhängige Algorithmen gewichtet kombiniert:
              </div>

              <div style={{ marginBottom: 8, paddingLeft: 8, borderLeft: `2px solid ${T.accent}30` }}>
                <strong style={{ color: T.textPrimary }}>1. Gewichteter gleitender Durchschnitt (15%)</strong><br/>
                Berechnet den Durchschnitt der letzten 6 Monate, wobei neuere Monate linear stärker gewichtet werden (Gewicht = Position). Stabil, aber träge bei Trendwechseln.
              </div>

              <div style={{ marginBottom: 8, paddingLeft: 8, borderLeft: `2px solid ${T.accent}30` }}>
                <strong style={{ color: T.textPrimary }}>2. Holt's Double Exponential Smoothing (30%)</strong><br/>
                Zwei Parameter (α=0.4 für Level, β=0.2 für Trend) glätten die Zeitreihe exponentiell. Erfasst sowohl das aktuelle Niveau als auch die Richtung der Veränderung. Haupttreiber der Prognose.
              </div>

              <div style={{ marginBottom: 8, paddingLeft: 8, borderLeft: `2px solid ${T.accent}30` }}>
                <strong style={{ color: T.textPrimary }}>3. Lineare Regression (20%)</strong><br/>
                Legt eine Trendgerade (y = a + bx) per Methode der kleinsten Quadrate durch alle historischen Datenpunkte. Gut für langfristige Richtung, ignoriert aber saisonale Schwankungen.
              </div>

              <div style={{ marginBottom: 10, paddingLeft: 8, borderLeft: `2px solid ${T.accent}30` }}>
                <strong style={{ color: T.textPrimary }}>4. Saisonale Dekomposition (35%)</strong><br/>
                Berechnet pro Kalendermonat einen Saisonindex (Dez = höher, Feb = niedriger) und multipliziert diesen mit einer Holt-Basisprognose. Höchste Gewichtung, da Ausgaben-Muster oft saisonal sind.
              </div>

              <div style={{ marginBottom: 8 }}>
                Das <strong style={{ color: T.textPrimary }}>Konfidenzband</strong> (schattierter Bereich im Chart) basiert auf der historischen Standardabweichung deiner Ausgaben (±0.8σ) und zeigt den wahrscheinlichen Schwankungsbereich.
              </div>

              <div style={{ padding: "8px 10px", background: `${T.accent}08`, borderRadius: 8, fontSize: 11, color: T.textMuted }}>
                💡 Die Prognose-Qualität steigt mit der Datenmenge. Ab 6+ Monaten sind die Saisonmuster besonders zuverlässig. Wiederkehrende Buchungen (Miete, Abos) bilden das stabile Fundament.
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Budget Page ─────────────────────────────────────────
function BudgetPage({ data, setData, monthEntries, T, styles }) {
  const { inputStyle, labelStyle, btnPrimary, btnSecondary, glassCardStyle, chipStyle, selectStyle } = styles;
  const [newCat, setNewCat] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editCat, setEditCat] = useState(null); // cat name being edited
  const [editAmount, setEditAmount] = useState("");
  const budgets = data.budgets || {};
  const expenseCats = data.categories.expense || [];

  const addBudget = () => {
    if (!newCat || !newAmount) return;
    setData(prev => ({ ...prev, budgets: { ...prev.budgets, [newCat]: parseFloat(newAmount) } }));
    setNewCat(""); setNewAmount("");
    setShowForm(false);
  };
  const removeBudget = (cat) => {
    setData(prev => { const b = { ...prev.budgets }; delete b[cat]; return { ...prev, budgets: b }; });
  };
  const saveBudgetEdit = () => {
    if (!editCat || !editAmount) return;
    setData(prev => ({ ...prev, budgets: { ...prev.budgets, [editCat]: parseFloat(editAmount) || 0 } }));
    setEditCat(null);
  };
  const openEdit = (cat, limit) => { setEditCat(cat); setEditAmount(String(limit)); };
  const closeEdit = () => setEditCat(null);

  const catsWithBudget = Object.entries(budgets).map(([cat, limit]) => {
    const spent = monthEntries.filter(e => e.type === "expense" && e.category === cat).reduce((s, e) => s + e.amount, 0);
    const pct = limit > 0 ? Math.min((spent / limit) * 100, 150) : 0;
    return { cat, limit, spent, pct, remaining: limit - spent };
  }).sort((a, b) => b.pct - a.pct);

  const availableCats = expenseCats.filter(c => !budgets[catName(c)]);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Monatsbudgets</h2>

      {catsWithBudget.length === 0 && (
        <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 32 }}>
          {availableCats.length === 0 ? "Erstelle zuerst Ausgaben-Kategorien" : "Noch keine Budgets gesetzt – tippe auf + um zu beginnen"}
        </div>
      )}

      {catsWithBudget.map(({ cat, limit, spent, pct, remaining }) => {
        const overBudget = remaining < 0;
        const warn = pct >= 80 && pct < 100;
        const barColor = overBudget ? T.expense : warn ? T.warning : T.income;
        const emoji = (() => { const found = expenseCats.find(c => catName(c) === cat); return found ? catEmoji(found) : ""; })();
        return (
          <SwipeToDelete key={cat} onDelete={() => removeBudget(cat)} T={T}>
            <div onClick={() => openEdit(cat, limit)} style={{ ...glassCardStyle, padding: "14px 16px", cursor: "pointer" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 14, fontWeight: 600, color: T.textPrimary }}>{emoji && <span style={{ marginRight: 6 }}>{emoji}</span>}{cat}</span>
                <span style={{ fontSize: 12, color: T.textMuted }}>{pct.toFixed(0)}%</span>
              </div>
              <div style={{ height: 8, background: `${T.textMuted}20`, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
                <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: barColor, borderRadius: 4, transition: "width .5s" }}/>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: T.textSecondary }}>{fmt(spent)} von {fmt(limit)}</span>
                <span style={{ color: overBudget ? T.expense : warn ? T.warning : T.income, fontWeight: 600 }}>
                  {overBudget ? `${fmt(Math.abs(remaining))} über Budget!` : `${fmt(remaining)} übrig`}
                </span>
              </div>
            </div>
          </SwipeToDelete>
        );
      })}

      {/* Edit Modal */}
      <Modal open={!!editCat} onClose={closeEdit} title="Budget bearbeiten" T={T}>
        <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 4 }}>Kategorie</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary, marginBottom: 16 }}>
          {editCat && (() => { const found = expenseCats.find(c => catName(c) === editCat); return found ? `${catEmoji(found)} ${editCat}` : editCat; })()}
        </div>
        <label style={labelStyle}>Monatliches Limit (€)</label>
        <input type="number" inputMode="decimal" value={editAmount} onChange={e => setEditAmount(e.target.value)} style={inputStyle} autoFocus/>
        <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
          <button onClick={saveBudgetEdit} style={btnPrimary}>Speichern</button>
        </div>
        <button onClick={() => { if (window.confirm("Budget wirklich löschen?")) { removeBudget(editCat); closeEdit(); } }} style={{
          marginTop: 12, padding: "10px 18px", background: "none",
          border: `1px solid ${T.expense}40`, borderRadius: 10,
          color: T.expense, fontSize: 13, fontWeight: 600, cursor: "pointer",
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}>
          <Icon name="trash" size={16} color={T.expense}/> Budget löschen
        </button>
      </Modal>

      {/* Add Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setNewCat(""); setNewAmount(""); }} title="Budget setzen" T={T}>
        {availableCats.length === 0 ? (
          <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: "16px 0" }}>Alle Kategorien haben bereits ein Budget.</div>
        ) : (
          <>
            <label style={labelStyle}>Kategorie</label>
            <select value={newCat} onChange={e => setNewCat(e.target.value)} style={selectStyle}>
              <option value="">Kategorie wählen...</option>
              {availableCats.map(c => <option key={catName(c)} value={catName(c)}>{catEmoji(c)} {catName(c)}</option>)}
            </select>
            <label style={labelStyle}>Monatliches Limit (€)</label>
            <input type="number" inputMode="decimal" value={newAmount} onChange={e => setNewAmount(e.target.value)} style={inputStyle} placeholder="0.00"/>
            <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
              <button onClick={addBudget} style={btnPrimary}>Budget setzen</button>
            </div>
          </>
        )}
      </Modal>

      {/* FAB – Neues Budget */}
      <button onClick={() => setShowForm(true)} style={{
        position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
        borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`,
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px ${T.accent}50`, zIndex: 200, color: "#fff"
      }}>
        <Icon name="plus" size={24}/>
      </button>
    </div>
  );
}

// ─── Search Page ─────────────────────────────────────────
function SearchPage({ data, openEdit, onDeleteEntry, emojiLookup, colorLookup, T, styles }) {
  const { inputStyle, selectStyle, chipStyle, glassCardStyle } = styles;
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState("all"); // all | income | expense
  const [filterCat, setFilterCat] = useState("");
  const [sortBy, setSortBy] = useState("date"); // date | amount
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const allCats = [...(data.categories.income || []), ...(data.categories.expense || [])];
  const uniqueCats = [...new Set(allCats.map(c => catName(c)))];

  const results = useMemo(() => {
    let filtered = data.entries;
    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(e => (e.description || "").toLowerCase().includes(q) || (e.category || "").toLowerCase().includes(q));
    }
    if (filterType !== "all") filtered = filtered.filter(e => e.type === filterType);
    if (filterCat) filtered = filtered.filter(e => e.category === filterCat);
    if (dateFrom) filtered = filtered.filter(e => e.date >= dateFrom);
    if (dateTo) filtered = filtered.filter(e => e.date <= dateTo);
    if (sortBy === "date") filtered = [...filtered].sort((a, b) => new Date(b.date) - new Date(a.date));
    else filtered = [...filtered].sort((a, b) => b.amount - a.amount);
    return filtered;
  }, [data.entries, query, filterType, filterCat, sortBy, dateFrom, dateTo]);

  const totalIncome = results.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0);
  const totalExpense = results.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0);

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 16 }}>Suche & Filter</h2>

      <div style={{ position: "relative", marginBottom: 12 }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Beschreibung oder Kategorie suchen..." style={{ ...inputStyle, paddingLeft: 36 }}/>
        <svg viewBox="0 0 24 24" style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", width: 16, height: 16, fill: "none", stroke: T.textMuted, strokeWidth: 2 }}>
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </div>

      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
        <button onClick={() => setFilterType("all")} style={chipStyle(filterType === "all")}>Alle</button>
        <button onClick={() => setFilterType("income")} style={chipStyle(filterType === "income")}>Einnahmen</button>
        <button onClick={() => setFilterType("expense")} style={chipStyle(filterType === "expense")}>Ausgaben</button>
        <button onClick={() => setShowFilters(!showFilters)} style={{ ...chipStyle(showFilters), marginLeft: "auto" }}>
          {showFilters ? "Filter ▲" : "Filter ▼"}
        </button>
      </div>

      {showFilters && (
        <div style={{ ...glassCardStyle, padding: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Von</div>
              <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Bis</div>
              <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ ...inputStyle, padding: "6px 10px", fontSize: 12 }}/>
            </div>
          </div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Kategorie</div>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} style={{ ...selectStyle, padding: "6px 10px", fontSize: 12 }}>
              <option value="">Alle Kategorien</option>
              {uniqueCats.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>Sortierung</div>
            <div style={{ display: "flex", gap: 6 }}>
              <button onClick={() => setSortBy("date")} style={chipStyle(sortBy === "date")}>Datum</button>
              <button onClick={() => setSortBy("amount")} style={chipStyle(sortBy === "amount")}>Betrag</button>
            </div>
          </div>
          {(dateFrom || dateTo || filterCat) && (
            <button onClick={() => { setDateFrom(""); setDateTo(""); setFilterCat(""); }} style={{ marginTop: 8, background: "none", border: "none", color: T.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Filter zurücksetzen</button>
          )}
        </div>
      )}

      <div style={{ ...glassCardStyle, padding: "10px 14px", marginBottom: 16, display: "flex", justifyContent: "space-between", fontSize: 12 }}>
        <span style={{ color: T.textSecondary }}>{results.length} Ergebnis{results.length !== 1 ? "se" : ""}</span>
        <span><span style={{ color: T.income, fontWeight: 600 }}>+{fmt(totalIncome)}</span> <span style={{ color: T.textMuted, margin: "0 4px" }}>|</span> <span style={{ color: T.expense, fontWeight: 600 }}>−{fmt(totalExpense)}</span></span>
      </div>

      {results.length === 0 ? (
        <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 32 }}>Keine Einträge gefunden</div>
      ) : results.slice(0, 50).map(e => (
        <SwipeToDelete key={e.id} onDelete={() => onDeleteEntry(e.id)} T={T}>
          <EntryItem e={e} onClick={() => openEdit(e)} emojiLookup={emojiLookup} colorLookup={colorLookup} T={T}/>
        </SwipeToDelete>
      ))}
      {results.length > 50 && <div style={{ color: T.textMuted, fontSize: 12, textAlign: "center", padding: 16 }}>Zeige 50 von {results.length} Ergebnissen. Nutze Filter um einzugrenzen.</div>}
    </div>
  );
}

// ─── Swipe-to-Delete Wrapper (universal) ─────────────────
// Mobile: Weit nach links swipen (>50% der Breite) und loslassen = löschen.
//         Zurückswipen zur Ausgangsposition = abbrechen.
// Desktop: Kein Swipe, stattdessen Löschbutton im onClick-Modal.
const SwipeToDelete = ({ onDelete, children, T, disabled, onSwipeActive }) => {
  const ref = useRef(null);
  const containerRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isSwiping = useRef(false);
  const containerWidth = useRef(300);
  const [deleteReady, setDeleteReady] = useState(false);
  // Threshold: wie weit muss man swipen um zu löschen (Anteil der Breite)
  const DELETE_THRESHOLD = 0.45;

  if (disabled) return <div style={{ marginBottom: 6 }}>{children}</div>;

  const handleTouchStart = (ev) => {
    startX.current = ev.touches[0].clientX;
    currentX.current = 0;
    isSwiping.current = false;
    setDeleteReady(false);
    if (containerRef.current) containerWidth.current = containerRef.current.offsetWidth;
  };
  const handleTouchMove = (ev) => {
    const diff = ev.touches[0].clientX - startX.current;
    if (diff < -8) {
      isSwiping.current = true;
      // Signalisiere dem übergeordneten Container dass ein Eintrag geswipt wird
      if (onSwipeActive) onSwipeActive();
      // Maximale Swipe-Distanz: 80% der Containerbreite
      const maxSwipe = containerWidth.current * 0.8;
      currentX.current = Math.max(diff, -maxSwipe);
      if (ref.current) {
        ref.current.style.transition = "none";
        ref.current.style.transform = `translateX(${currentX.current}px)`;
      }
      // Visuelles Feedback: ab Schwellwert zeigen wir "Loslassen = Löschen"
      const swipeRatio = Math.abs(currentX.current) / containerWidth.current;
      setDeleteReady(swipeRatio >= DELETE_THRESHOLD);
    }
  };
  const handleTouchEnd = () => {
    if (!ref.current) return;
    const swipeRatio = Math.abs(currentX.current) / containerWidth.current;
    if (swipeRatio >= DELETE_THRESHOLD) {
      // Weit genug geswipt UND losgelassen → löschen mit Animation
      ref.current.style.transition = "transform .3s ease, opacity .3s ease";
      ref.current.style.transform = `translateX(-${containerWidth.current}px)`;
      ref.current.style.opacity = "0";
      const reset = () => {
        if (ref.current) {
          ref.current.style.transition = "transform .3s ease, opacity .3s ease";
          ref.current.style.transform = "translateX(0)";
          ref.current.style.opacity = "1";
        }
      };
      setTimeout(() => onDelete(reset), 300);
    } else {
      // Nicht weit genug → zurück zur Ausgangsposition
      ref.current.style.transition = "transform .3s ease";
      ref.current.style.transform = "translateX(0)";
      setTimeout(() => { isSwiping.current = false; }, 50);
    }
    setDeleteReady(false);
  };
  const handleClickCapture = (ev) => {
    if (isSwiping.current) { ev.stopPropagation(); ev.preventDefault(); }
  };

  return (
    <div ref={containerRef} style={{ position: "relative", overflow: "hidden", borderRadius: 14, marginBottom: 6 }}>
      {/* Hintergrund: zeigt Lösch-Indikator */}
      <div style={{
        position: "absolute", right: 0, top: 0, bottom: 0, left: 0,
        background: deleteReady
          ? `linear-gradient(135deg, ${T.expense}, #ff3333)`
          : `linear-gradient(135deg, ${T.expense}90, #ff6b35aa)`,
        display: "flex", alignItems: "center", justifyContent: "flex-end",
        paddingRight: 24, borderRadius: 14,
        transition: "background .2s"
      }}>
        <div style={{
          color: "#fff", fontSize: 12, fontWeight: 700,
          display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
          opacity: isSwiping.current ? 1 : 0.6,
          transition: "opacity .2s, transform .2s",
          transform: deleteReady ? "scale(1.15)" : "scale(1)"
        }}>
          <Icon name="trash" size={22} color="#fff"/>
          {deleteReady ? "Loslassen" : "← Weiter"}
        </div>
      </div>
      <div ref={ref} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}
        onClickCapture={handleClickCapture}
        style={{ position: "relative", zIndex: 1, transform: "translateX(0)", transition: "transform .3s ease", background: T.glassCardOpaque || T.bg, borderRadius: 14 }}>
        {children}
      </div>
    </div>
  );
};

// ─── Entry Modal ──────────────────────────────────────────
function EntryModal({ open, onClose, editEntry, onSave, onDelete, categories, viewMonth, viewYear, T, styles }) {
  const { inputStyle, selectStyle, labelStyle, btnPrimary, btnSecondary, chipStyle } = styles;
  const isEdit = !!editEntry;
  const [form, setForm] = useState({ type: "expense", category: "", amount: "", description: "", date: dateStr(viewYear, viewMonth, getToday().day) });
  const [errors, setErrors] = useState({});
  useEffect(() => {
    if (editEntry) setForm({ type: editEntry.type, category: editEntry.category, amount: String(editEntry.amount), description: editEntry.description, date: editEntry.date });
    else setForm({ type: "expense", category: "", amount: "", description: "", date: dateStr(viewYear, viewMonth, getToday().day) });
    setErrors({});
  }, [editEntry, open, viewMonth, viewYear]);
  const catsByType = (t) => t === "income" ? categories.income : categories.expense;
  const errorStyle = { fontSize: 11, color: T.expense, marginTop: 4, marginBottom: 4 };
  const inputErr = (field) => ({ ...inputStyle, borderColor: errors[field] ? T.expense : inputStyle.borderColor });
  const selectErr = (field) => ({ ...selectStyle, borderColor: errors[field] ? T.expense : selectStyle.borderColor });
  const save = () => {
    const errs = {};
    if (!form.category) errs.category = "Bitte eine Kategorie auswählen.";
    const amt = parseFloat(form.amount);
    if (!form.amount || isNaN(amt) || amt <= 0) errs.amount = "Bitte einen gültigen Betrag größer als 0 eingeben.";
    else if (amt > 1_000_000) errs.amount = "Betrag darf 1.000.000 € nicht überschreiten.";
    if (!form.date) errs.date = "Bitte ein Datum auswählen.";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    onSave({ ...(editEntry || {}), ...form, amount: amt });
  };
  return (
    <Modal open={open} onClose={onClose} title={isEdit ? "Eintrag bearbeiten" : "Neuer Eintrag"} T={T}>
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setForm(f => ({ ...f, type: "expense", category: "" }))} style={chipStyle(form.type === "expense")}>Ausgabe</button>
        <button onClick={() => setForm(f => ({ ...f, type: "income", category: "" }))} style={chipStyle(form.type === "income")}>Einnahme</button>
      </div>
      <label style={labelStyle}>Kategorie</label>
      <select value={form.category} onChange={e => { setForm(f => ({ ...f, category: e.target.value })); setErrors(er => ({ ...er, category: null })); }} style={selectErr("category")}>
        <option value="">Kategorie wählen...</option>
        {catsByType(form.type).map(c => <option key={catName(c)} value={catName(c)}>{catEmoji(c)} {catName(c)}</option>)}
      </select>
      {errors.category && <div style={errorStyle}>⚠ {errors.category}</div>}
      <label style={labelStyle}>Betrag (€)</label>
      <input type="number" inputMode="decimal" value={form.amount} onChange={e => { setForm(f => ({ ...f, amount: e.target.value })); setErrors(er => ({ ...er, amount: null })); }} style={inputErr("amount")} placeholder="0.00"/>
      {errors.amount && <div style={errorStyle}>⚠ {errors.amount}</div>}
      <label style={labelStyle}>Beschreibung</label>
      <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} style={inputStyle} placeholder="Wofür?"/>
      <label style={labelStyle}>Datum</label>
      <input type="date" value={form.date} onChange={e => { setForm(f => ({ ...f, date: e.target.value })); setErrors(er => ({ ...er, date: null })); }} style={{ ...inputErr("date"), display: "block", WebkitAppearance: "none", appearance: "none", minWidth: 0 }}/>
      {errors.date && <div style={errorStyle}>⚠ {errors.date}</div>}
      <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
        <button onClick={save} style={btnPrimary}>{isEdit ? "Speichern" : "Hinzufügen"}</button>
      </div>
      {isEdit && (
        <button onClick={() => { if (window.confirm("Diesen Eintrag wirklich löschen?")) onDelete(editEntry.id); }} style={{
          marginTop: 12, padding: "10px 18px", background: "none",
          border: `1px solid ${T.expense}40`, borderRadius: 10,
          color: T.expense, fontSize: 13, fontWeight: 600, cursor: "pointer",
          width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all .2s"
        }}>
          <Icon name="trash" size={16} color={T.expense}/> Eintrag löschen
        </button>
      )}
    </Modal>
  );
}

// ════════════════════════════════════════════════════════════
//  SETTINGS PAGE
// ════════════════════════════════════════════════════════════
function SettingsPage({ data, setData, T, styles, theme, toggleTheme }) {
  const { btnPrimary, glassCardStyle } = styles;
  const settings = data.settings || {};
  const [reminderEnabled, setReminderEnabled] = useState(!!settings.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || "08:00");
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "default"
  );
  const [saved, setSaved] = useState(false);

  const requestPermission = async () => {
    if (typeof Notification === "undefined") return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    return perm;
  };

  const handleSave = async () => {
    let perm = notifPermission;
    if (reminderEnabled && perm !== "granted") {
      perm = await requestPermission();
      if (perm !== "granted") return;
    }
    setData(prev => ({ ...prev, settings: { ...(prev.settings || {}), reminderEnabled, reminderTime } }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleStyle = (active) => ({
    position: "relative", display: "inline-flex", width: 44, height: 24, borderRadius: 12,
    background: active ? T.accent : `${T.textMuted}40`, border: "none", cursor: "pointer",
    transition: "background .2s", flexShrink: 0, padding: 0
  });
  const knobStyle = (active) => ({
    position: "absolute", top: 3, left: active ? 23 : 3, width: 18, height: 18,
    background: "#fff", borderRadius: "50%", transition: "left .2s",
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
  });

  const swSupported = "serviceWorker" in navigator;
  const notifSupported = typeof Notification !== "undefined";

  return (
    <div style={{ padding: "0 16px 100px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: T.textPrimary, marginBottom: 20, marginTop: 8 }}>Einstellungen</div>

      {/* Erscheinungsbild */}
      <div style={{ ...glassCardStyle, padding: "20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Icon name={theme === "dark" ? "moon" : "sun"} size={18} color={T.accent}/>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>Erscheinungsbild</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>Dark Mode</div>
            <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>{theme === "dark" ? "Dunkles Design aktiv" : "Helles Design aktiv"}</div>
          </div>
          <button onClick={toggleTheme} style={toggleStyle(theme === "dark")}>
            <span style={knobStyle(theme === "dark")}/>
          </button>
        </div>
      </div>

      {/* Tägliche Erinnerung */}
      <div style={{ ...glassCardStyle, padding: "20px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <Icon name="bell" size={18} color={T.accent}/>
          <div style={{ fontSize: 15, fontWeight: 700, color: T.textPrimary }}>Tägliche Erinnerung</div>
        </div>

        {!swSupported || !notifSupported ? (
          <div style={{ fontSize: 13, color: T.textMuted, padding: "10px 14px", background: `${T.textMuted}10`, borderRadius: 10, lineHeight: 1.5 }}>
            Dein Browser unterstützt keine Push-Benachrichtigungen.
          </div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 14, color: T.textPrimary, fontWeight: 600 }}>Erinnerung aktivieren</div>
                <div style={{ fontSize: 12, color: T.textMuted, marginTop: 2 }}>Täglich erinnern, Einnahmen & Ausgaben einzutragen</div>
              </div>
              <button onClick={() => setReminderEnabled(v => !v)} style={toggleStyle(reminderEnabled)}>
                <span style={knobStyle(reminderEnabled)}/>
              </button>
            </div>

            {reminderEnabled && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: T.textSecondary, display: "block", marginBottom: 6 }}>Uhrzeit (24h-Format)</label>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                  style={{
                    background: T.inputBg, border: `1px solid ${T.inputBorder}`, borderRadius: 10,
                    color: T.inputText, fontSize: 20, fontWeight: 700, padding: "10px 14px",
                    outline: "none", width: "100%", cursor: "pointer"
                  }}
                />
              </div>
            )}

            {notifPermission === "denied" && (
              <div style={{ fontSize: 12, color: T.expense, padding: "8px 12px", background: `${T.expense}10`, borderRadius: 8, marginBottom: 12, lineHeight: 1.5 }}>
                ⚠ Benachrichtigungen sind im Browser blockiert. Bitte erlaube sie in den Browser-Einstellungen.
              </div>
            )}
            {reminderEnabled && notifPermission === "default" && (
              <div style={{ fontSize: 12, color: T.warning, padding: "8px 12px", background: `${T.warning}10`, borderRadius: 8, marginBottom: 12, lineHeight: 1.5 }}>
                Beim Speichern wirst du nach der Berechtigung für Benachrichtigungen gefragt.
              </div>
            )}
          </>
        )}

        <button
          onClick={handleSave}
          style={{ ...btnPrimary, marginTop: 4, display: "flex", alignItems: "center", gap: 8, justifyContent: "center" }}
        >
          {saved ? "✓ Gespeichert" : "Einstellungen speichern"}
        </button>
      </div>

      {/* Info */}
      <div style={{ ...glassCardStyle, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <Icon name="info" size={16} color={T.textMuted}/>
          <div style={{ fontSize: 13, fontWeight: 600, color: T.textSecondary }}>Hinweis zur Erinnerung</div>
        </div>
        <div style={{ fontSize: 12, color: T.textMuted, lineHeight: 1.6 }}>
          Die Erinnerung wird als Browser-Benachrichtigung angezeigt. Sie funktioniert solange der Browser geöffnet ist.
          Für zuverlässige Hintergrund-Benachrichtigungen empfehlen wir, die App zum Home-Bildschirm hinzuzufügen (PWA).
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  MAIN APP
// ════════════════════════════════════════════════════════════
export default function BudgetPlanner() {
  const [data, setData] = useState(null); // null = not loaded yet
  const [userId, setUserId] = useState(null);
  const [userInfo, setUserInfo] = useState(null); // { name, email, photo }
  const [authReady, setAuthReady] = useState(false);
  const [dataReady, setDataReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState("connecting"); // "connecting" | "synced" | "offline"
  const [loginError, setLoginError] = useState(null);
  const skipNextSync = useRef(false);
  const firestoreLoaded = useRef(false);
  const [viewMonth, setViewMonth] = useState(getToday().month);
  const [viewYear, setViewYear] = useState(getToday().year);
  const [page, setPage] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [theme, setTheme] = useState(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem("budget-planner-theme") : null;
    if (saved === "dark" || saved === "light") return saved;
    if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark";
    }
    return "light";
  });
  const fileInputRef = useRef(null);
  const swRef = useRef(null); // Service Worker registration

  const T = themes[theme];
  const isDark = theme === "dark";

  const toggleTheme = () => setTheme(t => {
    const next = t === "dark" ? "light" : "dark";
    localStorage.setItem("budget-planner-theme", next);
    return next;
  });

  const balanceColor = (val) => val < 0 ? T.expense : val <= 500 ? T.warning : T.income;

  // ─── Service Worker + Push Notifications ─────────────────
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(reg => {
        swRef.current = reg;
      }).catch(() => {});
    }
  }, []);

  // Reminder neu planen wenn Einstellungen sich ändern
  const scheduleReminder = useCallback((settings) => {
    if (!settings || !settings.reminderEnabled) return;
    if (!swRef.current) return;
    const [hour, minute] = (settings.reminderTime || "08:00").split(":").map(Number);
    swRef.current.active?.postMessage({ type: "SCHEDULE_REMINDER", hour, minute });
  }, []);

  useEffect(() => {
    if (!data) return;
    const settings = data.settings || {};
    if (settings.reminderEnabled && swRef.current) {
      scheduleReminder(settings);
    } else if (!settings.reminderEnabled && swRef.current) {
      swRef.current.active?.postMessage({ type: "CANCEL_REMINDER" });
    }
  }, [data && (data.settings || {}).reminderEnabled, data && (data.settings || {}).reminderTime, swRef.current]);

  // ─── Firebase Auth (Google) ───────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
        setUserInfo({ name: user.displayName || "User", email: user.email, photo: user.photoURL });
      } else {
        setUserId(null);
        setUserInfo(null);
        setSyncStatus("connecting");
      }
      setAuthReady(true);
    });
    // Check for redirect result (mobile flow)
    getRedirectResult(auth).catch(() => {});
    return unsub;
  }, []);

  const handleLogin = async () => {
    setLoginError(null);
    try {
      // Try popup first (works on desktop)
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (err.code === "auth/popup-blocked" || err.code === "auth/popup-closed-by-user") {
        // Fallback to redirect (works on mobile/iPad)
        try { await signInWithRedirect(auth, googleProvider); } catch { setLoginError("Anmeldung fehlgeschlagen. Bitte versuche es erneut."); }
      } else if (err.code === "auth/cancelled-popup-request") {
        // User cancelled, do nothing
      } else {
        setLoginError("Anmeldung fehlgeschlagen: " + (err.message || "Unbekannter Fehler"));
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    // Lokale Daten löschen für Sicherheit auf geteilten Geräten
    if (userId) { try { localStorage.removeItem(STORAGE_KEY + "_" + userId); } catch {} }
    setData(null);
    setDataReady(false);
    firestoreLoaded.current = false;
    setUserId(null);
    setUserInfo(null);
    setSyncStatus("connecting");
  };

  // ─── Firestore Realtime Listener ──────────────────────────
  // Firestore ist die Single Source of Truth. Beim Login wird IMMER
  // zuerst der Firestore-Stand geladen. Lokale Daten dienen nur als
  // Offline-Fallback und werden NIE über neuere Remote-Daten geschrieben.
  const remoteTimestamp = useRef(null); // Letzter bekannter Remote-Zeitstempel
  const initialLoadDone = useRef(false); // Verhindert Race Conditions beim ersten Laden

  useEffect(() => {
    if (!userId) { setDataReady(false); firestoreLoaded.current = false; initialLoadDone.current = false; remoteTimestamp.current = null; return; }
    const userLocalKey = STORAGE_KEY + "_" + userId;
    const docRef = doc(db, "budgets", userId);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        const snapData = snap.data();
        const remote = snapData.data;
        const remoteUpdatedAt = snapData.updatedAt || null;
        if (remote) {
          const parsed = typeof remote === "string" ? JSON.parse(remote) : remote;
          // Remote-Zeitstempel merken um Konflikte zu vermeiden
          remoteTimestamp.current = remoteUpdatedAt;
          skipNextSync.current = true;
          setData({ ...emptyData(), ...parsed, budgets: parsed.budgets || {} });
          // Lokalen Cache verschlüsselt aktualisieren
          encryptLS(JSON.stringify({ _ts: remoteUpdatedAt, ...parsed }))
            .then(enc => localStorage.setItem(userLocalKey, enc))
            .catch(() => {});
        }
      } else {
        // Kein Dokument in Firestore → erster Login auf diesem Account
        // Lokale Daten NUR verwenden wenn kein Remote-Dokument existiert
        if (!initialLoadDone.current) {
          const fresh = emptyData();
          fresh.categories = { income: [...DEFAULT_INCOME_CATS], expense: [...DEFAULT_EXPENSE_CATS] };
          setData(fresh);
          remoteTimestamp.current = null;
        }
      }
      initialLoadDone.current = true;
      firestoreLoaded.current = true;
      setDataReady(true);
      setSyncStatus("synced");
    }, async () => {
      // Offline → lokale Daten (verschlüsselt) laden als Fallback
      if (!initialLoadDone.current) {
        const local = await (async () => {
          try {
            const r = localStorage.getItem(userLocalKey);
            if (!r) return null;
            const plain = await decryptLS(r);
            return plain ? JSON.parse(plain) : null;
          } catch { return null; }
        })();
        if (local) {
          const { _ts, ...rest } = local;
          remoteTimestamp.current = _ts || null;
          setData({ ...emptyData(), ...rest });
        } else {
          const fresh = emptyData();
          fresh.categories = { income: [...DEFAULT_INCOME_CATS], expense: [...DEFAULT_EXPENSE_CATS] };
          setData(fresh);
        }
        initialLoadDone.current = true;
      }
      firestoreLoaded.current = true;
      setDataReady(true);
      setSyncStatus("offline");
    });
    return unsub;
  }, [userId]);

  // ─── Save to Firestore + localStorage on data change ──────
  const saveTimeout = useRef(null);
  useEffect(() => {
    if (!data || !userId || !firestoreLoaded.current) return;
    const userLocalKey = STORAGE_KEY + "_" + userId;
    const nowIso = new Date().toISOString();
    // Lokalen Cache verschlüsselt aktualisieren
    encryptLS(JSON.stringify({ _ts: nowIso, ...data }))
      .then(enc => localStorage.setItem(userLocalKey, enc))
      .catch(() => {});
    if (skipNextSync.current) { skipNextSync.current = false; return; }
    // Debounce Firestore writes (500ms)
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      const docRef = doc(db, "budgets", userId);
      const updatedAt = new Date().toISOString();
      setDoc(docRef, { data: JSON.stringify(data), updatedAt }, { merge: true })
        .then(() => { remoteTimestamp.current = updatedAt; setSyncStatus("synced"); })
        .catch(() => setSyncStatus("offline"));
    }, 500);
    return () => clearTimeout(saveTimeout.current);
  }, [data, userId]);

  // ─── Themed Form Styles ─────────────────────────────────
  const inputStyle = { width: "100%", padding: "10px 14px", background: T.inputBg, backdropFilter: T.glassBlur, border: `1px solid ${T.inputBorder}`, borderRadius: 10, color: T.inputText, fontSize: 14, outline: "none", boxSizing: "border-box", transition: "all .2s" };
  const selectStyle = { ...inputStyle, appearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23${isDark ? '888' : '6b7280'}' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center" };
  const labelStyle = { display: "block", fontSize: 12, color: T.textMuted, marginBottom: 4, marginTop: 12 };
  const btnPrimary = { padding: "12px 24px", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`, border: "none", borderRadius: 12, color: "#fff", fontSize: 15, fontWeight: 700, cursor: "pointer", width: "100%", boxShadow: `0 4px 16px ${T.accent}30`, transition: "all .2s" };
  const btnSecondary = { padding: "10px 18px", background: T.glassCard, backdropFilter: T.glassBlur, border: `1px solid ${T.glassBorder}`, borderRadius: 10, color: T.textPrimary, fontSize: 13, cursor: "pointer", transition: "all .2s" };
  const chipStyle = (active) => ({ padding: "8px 18px", borderRadius: 20, border: "none", fontSize: 13, fontWeight: 600, cursor: "pointer", background: active ? `linear-gradient(135deg, ${T.accent}, ${T.accentPink})` : T.chipInactiveBg, color: active ? "#fff" : T.chipInactiveText, transition: "all .2s" });
  const glassCardStyle = { background: T.glassCard, backdropFilter: T.glassBlur, borderRadius: 14, border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow, transition: "all .2s" };

  const styles = { inputStyle, selectStyle, labelStyle, btnPrimary, btnSecondary, chipStyle, glassCardStyle };


  // Apply recurring
  useEffect(() => {
    if (!data) return;
    const now = getToday();
    const applied = { ...data.appliedRecurring };
    let ne = [];
    (data.recurring || []).forEach(rec => {
      const sY = parseInt(rec.startYear), sM = parseInt(rec.startMonth), cy = parseInt(rec.cycle) || 1;
      const hasEnd = rec.endYear != null && rec.endYear !== "";
      const eY = hasEnd ? parseInt(rec.endYear) : null;
      const eM = hasEnd ? parseInt(rec.endMonth || 0) : null;
      let cY = sY, cM = sM;
      while (cY < now.year || (cY === now.year && cM <= now.month)) {
        if (hasEnd && (cY > eY || (cY === eY && cM > eM))) break;
        const key = `${rec.id}_${cY}_${cM}`;
        if (!applied[key]) { applied[key] = true; ne.push({ id: uid(), type: rec.type, category: rec.category, amount: parseFloat(rec.amount), description: rec.description + " (wiederkehrend)", date: dateStr(cY, cM, 1) }); }
        cM += cy; while (cM > 11) { cM -= 12; cY++; }
      }
    });
    if (ne.length > 0) setData(prev => prev ? ({ ...prev, entries: [...prev.entries, ...ne], appliedRecurring: applied }) : prev);
  }, [data && data.recurring]);

  const monthEntries = useMemo(() => data ? data.entries.filter(e => { const d = new Date(e.date); return d.getMonth() === viewMonth && d.getFullYear() === viewYear; }) : [], [data && data.entries, viewMonth, viewYear]);
  const income = useMemo(() => monthEntries.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0), [monthEntries]);
  const expense = useMemo(() => monthEntries.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0), [monthEntries]);
  const balance = income - expense;

  const prevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); };
  const goToday = () => { setViewMonth(getToday().month); setViewYear(getToday().year); };

  const handleSaveEntry = (entry) => {
    if (entry.id) setData(prev => ({ ...prev, entries: prev.entries.map(e => e.id === entry.id ? entry : e) }));
    else setData(prev => ({ ...prev, entries: [...prev.entries, { ...entry, id: uid() }] }));
    setNewEntryOpen(false); setEditEntry(null);
  };
  const handleDeleteEntry = (id) => { setData(prev => ({ ...prev, entries: prev.entries.filter(e => e.id !== id) })); setNewEntryOpen(false); setEditEntry(null); };
  const openEdit = (e) => { setEditEntry(e); setNewEntryOpen(true); };
  const navigate = (p) => { setPage(p); setMenuOpen(false); };

  const [exportPreview, setExportPreview] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const exportText = useMemo(() => JSON.stringify(data, null, 2), [data, exportPreview]);

  const handleExport = () => {
    try {
      const blob = new Blob([exportText], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `budget_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setExportPreview(true);
    }
  };

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch {
      const ta = document.getElementById("export-textarea");
      if (ta) { ta.select(); document.execCommand("copy"); setCopySuccess(true); setTimeout(() => setCopySuccess(false), 2000); }
    }
  };

  const [importMsg, setImportMsg] = useState(null);
  const importMsgTimer = useRef(null);
  const showImportMsg = useCallback((msg) => {
    if (importMsgTimer.current) clearTimeout(importMsgTimer.current);
    setImportMsg(msg);
    // Erfolgsmeldungen schließen sich nach 6 Sekunden automatisch
    if (msg.type === "success") {
      importMsgTimer.current = setTimeout(() => setImportMsg(null), 6000);
    }
  }, []);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleReset = () => {
    setData(emptyData());
    setConfirmReset(false);
    showImportMsg({ type: "success", title: "Daten gelöscht", text: "Alle Einträge, Kategorien, Sparziele und wiederkehrende Buchungen wurden gelöscht." });
  };

  const importJSON = (ev) => {
    const file = ev.target.files[0]; if (!file) return;
    // Dateigröße begrenzen (max. 5 MB)
    if (file.size > 5 * 1024 * 1024) {
      showImportMsg({ type: "error", text: "Die Datei ist zu groß (max. 5 MB)." });
      ev.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imp = JSON.parse(e.target.result);
        // Grundlegende Strukturvalidierung
        if (!imp || typeof imp !== "object" || Array.isArray(imp)) {
          showImportMsg({ type: "error", text: "Die Datei enthält keine gültigen Budget-Daten." });
          return;
        }
        if (!Array.isArray(imp.entries)) {
          showImportMsg({ type: "error", text: "Die Datei enthält keine gültigen Budget-Daten." });
          return;
        }
        // Jeden Eintrag validieren (Typ, Betrag, Datum)
        const validTypes = ["income", "expense"];
        const validEntries = imp.entries.filter(entry =>
          entry && typeof entry === "object" &&
          validTypes.includes(entry.type) &&
          typeof entry.amount === "number" && isFinite(entry.amount) && entry.amount >= 0 && entry.amount <= 1_000_000 &&
          typeof entry.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) &&
          typeof entry.category === "string" && entry.category.length <= 100 &&
          (entry.description === undefined || (typeof entry.description === "string" && entry.description.length <= 500))
        );
        if (validEntries.length === 0 && imp.entries.length > 0) {
          showImportMsg({ type: "error", text: "Keine gültigen Einträge gefunden. Bitte prüfe das Dateiformat." });
          return;
        }
        const sanitized = { ...emptyData(), ...imp, entries: validEntries };
        setData(sanitized);
        showImportMsg({ type: "success", title: "Import erfolgreich", text: `${validEntries.length} Einträge geladen aus „${file.name}".` });
      } catch {
        showImportMsg({ type: "error", text: "Ungültige JSON-Datei. Bitte prüfe das Dateiformat." });
      }
    };
    reader.readAsText(file);
    ev.target.value = "";
  };

  const groupByCategory = (entries) => { const g = {}; entries.forEach(e => { g[e.category] = (g[e.category] || 0) + e.amount; }); return Object.entries(g).map(([cat, val]) => ({ category: cat, value: val })); };

  const emojiLookup = (categoryName, type) => {
    const cats = type === "income" ? data.categories.income : data.categories.expense;
    const found = cats.find(c => catName(c) === categoryName);
    return found ? catEmoji(found) : "";
  };

  const colorLookup = (categoryName, type) => {
    const cats = type === "income" ? data.categories.income : data.categories.expense;
    const found = cats.find(c => catName(c) === categoryName);
    return found ? catColorVal(found) : CAT_COLORS[0].hex;
  };

  // ─── Swipe gestures for month navigation ─────────────────
  // entrySwipeActive wird von SwipeToDelete gesetzt wenn ein Eintrag
  // gerade geswipt wird → Monatswechsel soll dann NICHT ausgelöst werden
  const entrySwipeActive = useRef(false);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const handlePageTouchStart = (ev) => { touchStartX.current = ev.touches[0].clientX; touchStartY.current = ev.touches[0].clientY; };
  const handlePageTouchEnd = (ev) => {
    // Wenn gerade ein Eintrag geswipt wurde, Monatswechsel ignorieren
    if (entrySwipeActive.current) { entrySwipeActive.current = false; return; }
    const dx = ev.changedTouches[0].clientX - touchStartX.current;
    const dy = ev.changedTouches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0) prevMonth(); else nextMonth();
    }
  };

  // ─── Budget warnings for home page ──────────────────────
  const budgetWarnings = useMemo(() => {
    if (!data) return [];
    const budgets = data.budgets || {};
    return Object.entries(budgets).map(([cat, limit]) => {
      const spent = monthEntries.filter(e => e.type === "expense" && e.category === cat).reduce((s, e) => s + e.amount, 0);
      const pct = limit > 0 ? (spent / limit) * 100 : 0;
      return { cat, limit, spent, pct, remaining: limit - spent };
    }).filter(b => b.pct >= 75).sort((a, b) => b.pct - a.pct);
  }, [data && data.budgets, monthEntries]);

  // ─── HOME ───────────────────────────────────────
  const renderHome = () => (
    <div style={{ padding: "0 16px 100px" }} onTouchStart={handlePageTouchStart} onTouchEnd={handlePageTouchEnd}>
      <MonthNav viewMonth={viewMonth} viewYear={viewYear} prevMonth={prevMonth} nextMonth={nextMonth} goToday={goToday} T={T} btnSecondary={btnSecondary}/>
      {/* Balance Card */}
      <div style={{
        background: isDark
          ? `linear-gradient(135deg, rgba(123,97,255,0.15), rgba(0,232,123,0.06))`
          : `linear-gradient(135deg, rgba(124,58,237,0.08), rgba(192,38,211,0.06), rgba(6,182,212,0.05))`,
        backdropFilter: T.glassBlur,
        border: `1px solid ${isDark ? 'rgba(123,97,255,0.25)' : 'rgba(255,255,255,0.7)'}`,
        borderRadius: 20, padding: "28px 24px", textAlign: "center",
        boxShadow: T.glassShadow,
        marginBottom: 20
      }}>
        <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 4, textTransform: "uppercase", letterSpacing: 1 }}>Bilanz</div>
        <div style={{ fontSize: 36, fontWeight: 800, color: balanceColor(balance), lineHeight: 1.2 }}>{fmt(balance)}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 32, marginTop: 20 }}>
          <div onClick={() => setPage("income-analysis")} style={{ cursor: "pointer" }}><div style={{ fontSize: 11, color: T.income, marginBottom: 2 }}>▲ Einnahmen →</div><div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary }}>{fmt(income)}</div></div>
          <div style={{ width: 1, background: `${T.textMuted}30` }}/>
          <div onClick={() => setPage("expense-analysis")} style={{ cursor: "pointer" }}><div style={{ fontSize: 11, color: T.expense, marginBottom: 2 }}>▼ Ausgaben →</div><div style={{ fontSize: 18, fontWeight: 700, color: T.textPrimary }}>{fmt(expense)}</div></div>
        </div>
      </div>
      {/* Savings Goals */}
      <div style={{ ...glassCardStyle, padding: "16px 20px", marginBottom: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, display: "flex", alignItems: "center", gap: 8 }}><Icon name="target" size={16} color={T.warning}/> Sparziele</div>
          <button onClick={() => setPage("savings")} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Verwalten →</button>
        </div>
        {data.savingsGoals.length === 0 ? <div style={{ color: T.textMuted, fontSize: 13, padding: "8px 0" }}>Noch keine Sparziele definiert</div>
        : data.savingsGoals.map(g => { const pct = Math.min((g.saved / g.target) * 100, 100); return (
          <div key={g.id} style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: T.textSecondary, marginBottom: 4 }}><span>{g.emoji && <span style={{ marginRight: 4 }}>{g.emoji}</span>}{g.name}</span><span>{fmt(g.saved)} / {fmt(g.target)}</span></div>
            <div style={{ height: 6, background: `${T.textMuted}20`, borderRadius: 3, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: pct >= 100 ? T.income : `linear-gradient(90deg, ${T.accent}, #00f0ff)`, borderRadius: 3, transition: "width .5s" }}/></div>
          </div>
        ); })}
      </div>
      {/* Budget Warnings */}
      {budgetWarnings.length > 0 && (
        <div style={{ ...glassCardStyle, padding: "14px 16px", marginBottom: 16, border: `1px solid ${T.warning}30` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 16 }}>⚠️</span> Budget-Warnungen
            </div>
            <button onClick={() => setPage("budget")} style={{ background: "none", border: "none", color: T.accent, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>Verwalten →</button>
          </div>
          {budgetWarnings.slice(0, 3).map(b => {
            const overBudget = b.remaining < 0;
            return (
              <div key={b.cat} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 3 }}>
                  <span style={{ color: T.textSecondary }}>{b.cat}</span>
                  <span style={{ color: overBudget ? T.expense : T.warning, fontWeight: 600 }}>
                    {overBudget ? `${fmt(Math.abs(b.remaining))} drüber` : `${fmt(b.remaining)} übrig`}
                  </span>
                </div>
                <div style={{ height: 4, background: `${T.textMuted}20`, borderRadius: 2, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(b.pct, 100)}%`, background: overBudget ? T.expense : T.warning, borderRadius: 2 }}/>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {/* Recent Entries */}
      <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 12 }}>Letzte Einträge</div>
      {monthEntries.length === 0 ? <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 24 }}>Keine Einträge in diesem Monat</div>
      : [...monthEntries].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10).map(e => (
        <SwipeToDelete key={e.id} onDelete={() => handleDeleteEntry(e.id)} T={T} onSwipeActive={() => { entrySwipeActive.current = true; }}>
          <EntryItem e={e} onClick={() => openEdit(e)} emojiLookup={emojiLookup} colorLookup={colorLookup} T={T}/>
        </SwipeToDelete>
      ))}
      {/* FAB – Neuer Eintrag */}
      <button onClick={() => { setEditEntry(null); setNewEntryOpen(true); }} style={{
        position: "fixed", bottom: 24, right: 24, width: 56, height: 56,
        borderRadius: "50%", background: `linear-gradient(135deg, ${T.accent}, ${T.accentPink})`,
        border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: `0 4px 20px ${T.accent}50`, zIndex: 200, color: "#fff"
      }}>
        <Icon name="plus" size={24}/>
      </button>
    </div>
  );

  // ─── ANALYSIS ───────────────────────────────────
  const renderAnalysis = (type) => {
    const tl = type === "income" ? "Einnahmen" : "Ausgaben";
    const color = type === "income" ? T.income : T.expense;
    const mot = monthEntries.filter(e => e.type === type);
    const grouped = groupByCategory(mot);
    const dd = grouped.map((g) => ({ label: `${emojiLookup(g.category, type)} ${g.category}`.trim(), value: g.value, color: colorLookup(g.category, type) })).sort((a, b) => b.value - a.value);
    const lp = [];
    for (let i = 11; i >= 0; i--) { let m = viewMonth - i, y = viewYear; while (m < 0) { m += 12; y--; } lp.push({ v: data.entries.filter(e => { const d = new Date(e.date); return e.type === type && d.getMonth() === m && d.getFullYear() === y; }).reduce((s, e) => s + e.amount, 0), label: new Date(y, m).toLocaleString("de-DE", { month: "short" }) }); }
    return (
      <div style={{ padding: "0 16px 100px" }}>
        <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 4 }}>{tl}-Analyse</h2>
        <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 16 }}>{monthName(viewMonth, viewYear)}</p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
          <button onClick={prevMonth} style={{ ...btnSecondary, padding: "6px 10px", fontSize: 12 }}>← Zurück</button>
          <button onClick={nextMonth} style={{ ...btnSecondary, padding: "6px 10px", fontSize: 12 }}>Weiter →</button>
          <button onClick={goToday} style={{ ...btnSecondary, padding: "6px 10px", fontSize: 12 }}>Heute</button>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 24 }}>
          <div style={{ flex: "1 1 200px", display: "flex", justifyContent: "center" }}><DonutChart data={dd} size={200} T={T}/></div>
          <div style={{ flex: "1 1 200px" }}>{(() => { const total = dd.reduce((s, d) => s + d.value, 0); return dd.map((d, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: `1px solid ${T.tableRow}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, display: "inline-block" }}/><span style={{ color: T.textSecondary, fontSize: 13 }}>{d.label}</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ color: T.textMuted, fontSize: 12 }}>{total > 0 ? Math.round(d.value / total * 100) : 0}%</span>
                <span style={{ color: T.textPrimary, fontSize: 13, fontWeight: 600, minWidth: 70, textAlign: "right" }}>{fmt(d.value)}</span>
              </div>
            </div>
          )); })()}</div>
        </div>
        <div style={{ ...glassCardStyle, padding: "16px 8px", marginBottom: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.textPrimary, marginBottom: 8, paddingLeft: 8 }}>Verlauf (12 Monate)</div>
          <LineChart points={lp} color={color} height={220} T={T}/>
        </div>
        <div style={{ fontSize: 14, fontWeight: 700, color: T.textPrimary, marginBottom: 12 }}>Alle {tl} ({monthName(viewMonth, viewYear)})</div>
        {mot.length === 0 ? <div style={{ color: T.textMuted, fontSize: 13, textAlign: "center", padding: 20 }}>Keine {tl}</div>
        : [...mot].sort((a, b) => new Date(b.date) - new Date(a.date)).map(e => <EntryItem key={e.id} e={e} onClick={() => openEdit(e)} emojiLookup={emojiLookup} colorLookup={colorLookup} T={T}/>)}
      </div>
    );
  };

  // ─── YEARLY ─────────────────────────────────────
  const renderYearly = () => {
    const yr = viewYear;
    const md = Array.from({ length: 12 }, (_, m) => { const me = data.entries.filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === yr; }); return { label: new Date(yr, m).toLocaleString("de-DE", { month: "short" }), income: me.filter(e => e.type === "income").reduce((s, e) => s + e.amount, 0), expense: me.filter(e => e.type === "expense").reduce((s, e) => s + e.amount, 0) }; });
    md.forEach(m => m.balance = m.income - m.expense);
    const tI = md.reduce((s, m) => s + m.income, 0), tE = md.reduce((s, m) => s + m.expense, 0);
    return (
      <div style={{ padding: "0 16px 100px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, margin: 0 }}>Jahresübersicht {yr}</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setViewYear(y => y - 1)} style={{ ...btnSecondary, padding: "6px 10px" }}><Icon name="left" size={16}/></button>
            <button onClick={() => setViewYear(getToday().year)} style={{ ...btnSecondary, padding: "6px 10px", fontSize: 11 }}>Aktuell</button>
            <button onClick={() => setViewYear(y => y + 1)} style={{ ...btnSecondary, padding: "6px 10px" }}><Icon name="right" size={16}/></button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginBottom: 20, flexWrap: "wrap" }}>
          {[{ l: "Einnahmen", v: tI, c: T.income }, { l: "Ausgaben", v: tE, c: T.expense }, { l: "Bilanz", v: tI - tE, c: balanceColor(tI - tE) }].map(x => (
            <div key={x.l} style={{ flex: "1 1 100px", ...glassCardStyle, padding: "14px 16px" }}>
              <div style={{ fontSize: 11, color: T.textMuted, marginBottom: 4 }}>{x.l}</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: x.c }}>{fmt(x.v)}</div>
            </div>
          ))}
        </div>
        <div style={{ ...glassCardStyle, padding: 16, marginBottom: 20 }}><BarChart data={md} T={T}/></div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead><tr style={{ borderBottom: `1px solid ${T.textMuted}30` }}>{["Monat", "Einnahmen", "Ausgaben", "Bilanz"].map(h => <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: T.textMuted, fontWeight: 600, fontSize: 11, textTransform: "uppercase" }}>{h}</th>)}</tr></thead>
            <tbody>{md.map((m, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${T.tableRow}`, cursor: "pointer" }} onClick={() => { setViewMonth(i); setPage("home"); }}>
                <td style={{ padding: 10, color: T.textPrimary, fontWeight: 600 }}>{m.label}</td>
                <td style={{ padding: 10, color: T.income }}>{fmt(m.income)}</td>
                <td style={{ padding: 10, color: T.expense }}>{fmt(m.expense)}</td>
                <td style={{ padding: 10, color: balanceColor(m.balance), fontWeight: 700 }}>{fmt(m.balance)}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    );
  };

  // ─── IMPORT/EXPORT ──────────────────────────────
  const renderImportExport = () => (
    <div style={{ padding: "0 16px 100px" }}>
      <h2 style={{ color: T.textPrimary, fontSize: 20, fontWeight: 800, marginBottom: 20 }}>Import / Export</h2>
      <div style={{ ...glassCardStyle, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><Icon name="download" size={20} color={isDark ? "#00f0ff" : T.accent}/><span style={{ color: T.textPrimary, fontSize: 16, fontWeight: 700 }}>Export</span></div>
        <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 14 }}>Budget-Datenbasis als JSON exportieren.</p>
        <div style={{ display: "flex", gap: 8, marginBottom: exportPreview ? 12 : 0 }}>
          <button onClick={handleExport} style={{ ...btnPrimary, flex: 1 }}>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Icon name="download" size={18}/> Herunterladen</span>
          </button>
          <button onClick={() => setExportPreview(p => !p)} style={{ ...btnSecondary, flex: "0 0 auto" }}>
            {exportPreview ? "Ausblenden" : "Daten anzeigen"}
          </button>
        </div>
        {exportPreview && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 12, color: T.textMuted }}>JSON-Daten ({Math.round(exportText.length / 1024)} KB)</span>
              <button onClick={handleCopyExport} style={{ ...btnSecondary, padding: "6px 14px", fontSize: 12, background: copySuccess ? T.incomeGlow : T.glassCard, color: copySuccess ? T.income : T.textPrimary }}>
                {copySuccess ? "✓ Kopiert!" : "In Zwischenablage kopieren"}
              </button>
            </div>
            <textarea id="export-textarea" readOnly value={exportText} style={{
              width: "100%", height: 180, padding: 12, background: T.exportBg, border: `1px solid ${T.inputBorder}`,
              borderRadius: 10, color: T.exportText, fontSize: 11, fontFamily: "monospace", resize: "vertical",
              outline: "none", boxSizing: "border-box"
            }} onFocus={e => e.target.select()}/>
          </div>
        )}
      </div>
      <div style={{ ...glassCardStyle, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><Icon name="upload" size={20} color={T.accentPink}/><span style={{ color: T.textPrimary, fontSize: 16, fontWeight: 700 }}>Import</span></div>
        <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 14 }}>JSON-Datei importieren (überschreibt Daten).</p>
        <button onClick={() => fileInputRef.current?.click()} style={{ ...btnPrimary, background: `linear-gradient(135deg, ${T.accentPink}, ${T.accent})` }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Icon name="upload" size={18}/> JSON importieren</span>
        </button>
      </div>
      <div style={{ ...glassCardStyle, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}><Icon name="trash" size={20} color={T.expense}/><span style={{ color: T.textPrimary, fontSize: 16, fontWeight: 700 }}>Zurücksetzen</span></div>
        <p style={{ color: T.textMuted, fontSize: 13, marginBottom: 14 }}>Alle Daten löschen.</p>
        <button onClick={() => setConfirmReset(true)} style={{ ...btnPrimary, background: `linear-gradient(135deg, ${T.expense}, #ff6b35)` }}>
          <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}><Icon name="trash" size={18}/> Alle Daten löschen</span>
        </button>
      </div>
      <input ref={fileInputRef} type="file" accept=".json" onChange={importJSON} style={{ display: "none" }}/>
    </div>
  );

  const menuItems = [
    { id: "home", icon: "home", label: "Übersicht" },
    { id: "search", icon: "search", label: "Suche & Filter" },
    { id: "income-analysis", icon: "trendUp", label: "Einnahmen-Analyse" },
    { id: "expense-analysis", icon: "trendDown", label: "Ausgaben-Analyse" },
    { id: "categories", icon: "tag", label: "Kategorien" },
    { id: "budget", icon: "wallet", label: "Budgets" },
    { id: "recurring", icon: "repeat", label: "Wiederkehrend" },
    { id: "savings", icon: "target", label: "Sparziele" },
    { id: "yearly", icon: "calendar", label: "Jahresübersicht" },
    { id: "prediction", icon: "zap", label: "Prognose" },
    { id: "import-export", icon: "download", label: "Import / Export" },
    { id: "settings", icon: "settings", label: "Einstellungen" },
  ];

  const renderPage = () => {
    switch (page) {
      case "home": return renderHome();
      case "budget": return <BudgetPage key="budget" data={data} setData={setData} monthEntries={monthEntries} T={T} styles={styles}/>;
      case "search": return <SearchPage key="search" data={data} openEdit={openEdit} onDeleteEntry={handleDeleteEntry} emojiLookup={emojiLookup} colorLookup={colorLookup} T={T} styles={styles}/>;
      case "income-analysis": return renderAnalysis("income");
      case "expense-analysis": return renderAnalysis("expense");
      case "categories": return <CategoriesPage key="categories" data={data} setData={setData} T={T} styles={styles}/>;
      case "recurring": return <RecurringPage key="recurring" data={data} setData={setData} T={T} styles={styles}/>;
      case "savings": return <SavingsPage key="savings" data={data} setData={setData} T={T} styles={styles}/>;
      case "yearly": return renderYearly();
      case "prediction": return <PredictionPage key="prediction" data={data} T={T} styles={styles}/>;
      case "import-export": return renderImportExport();
      case "settings": return <SettingsPage key="settings" data={data} setData={setData} T={T} styles={styles} theme={theme} toggleTheme={toggleTheme}/>;
      default: return renderHome();
    }
  };

  // ─── Login Screen ──────────────────────────────────────────
  if (authReady && !userId) {
    return (
      <div style={{
        fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
        background: T.bgGradient,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        position: "relative",
        overflow: "hidden"
      }}>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');
          * { box-sizing: border-box; }
          body { margin: 0; background: ${T.bg}; }
          @keyframes floatOrb1 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(30px,20px); } }
          @keyframes floatOrb2 { 0%,100% { transform: translate(0,0); } 50% { transform: translate(-20px,30px); } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        {isDark ? (
          <>
            <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(123,97,255,0.08) 0%, transparent 70%)", pointerEvents: "none", animation: "floatOrb1 20s ease-in-out infinite" }}/>
            <div style={{ position: "fixed", bottom: -100, left: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(0,232,123,0.05) 0%, transparent 70%)", pointerEvents: "none", animation: "floatOrb2 25s ease-in-out infinite" }}/>
          </>
        ) : (
          <>
            <div style={{ position: "fixed", top: -100, left: -80, width: 450, height: 450, background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.06) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(40px)", animation: "floatOrb1 20s ease-in-out infinite" }}/>
            <div style={{ position: "fixed", bottom: -80, right: -40, width: 420, height: 420, background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.05) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(45px)", animation: "floatOrb2 22s ease-in-out infinite" }}/>
          </>
        )}

        <div style={{
          position: "relative", zIndex: 1,
          background: T.glassCard, backdropFilter: T.glassBlur,
          border: `1px solid ${T.glassBorder}`, boxShadow: T.glassShadow,
          borderRadius: 24, padding: "40px 32px", maxWidth: 380, width: "100%",
          textAlign: "center", animation: "slideUp .5s ease"
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1, marginBottom: 4 }}>
            <span style={{ color: T.titleGlow1, textShadow: isDark ? T.titleShadow1 : "none" }}>Budget</span>{" "}
            <span style={{ color: T.titleGlow2, textShadow: isDark ? T.titleShadow2 : "none" }}>Planer</span>
          </div>
          <div style={{ fontSize: 13, color: T.textMuted, marginBottom: 32 }}>Deine Finanzen im Blick – auf allen Geräten</div>

          <button onClick={handleLogin} style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
            width: "100%", padding: "14px 20px",
            background: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.85)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.12)"}`,
            borderRadius: 14, cursor: "pointer", fontSize: 15, fontWeight: 600,
            color: T.textPrimary, transition: "all .2s",
            boxShadow: isDark ? "0 4px 16px rgba(0,0,0,0.3)" : "0 2px 12px rgba(0,0,0,0.08)"
          }}>
            <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59A14.5 14.5 0 019.5 24c0-1.59.28-3.14.76-4.59l-7.98-6.19A23.998 23.998 0 000 24c0 3.77.9 7.35 2.56 10.53l7.97-5.94z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 5.94C6.51 42.62 14.62 48 24 48z"/></svg>
            Mit Google anmelden
          </button>

          {loginError && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: `${T.expense}15`, border: `1px solid ${T.expense}30`, borderRadius: 10, fontSize: 12, color: T.expense, lineHeight: 1.5 }}>
              {loginError}
            </div>
          )}

          <div style={{ marginTop: 24, fontSize: 11, color: T.textMuted, lineHeight: 1.6 }}>
            Melde dich mit deinem Google-Konto an,<br/>um deine Daten auf allen Geräten zu synchronisieren.
          </div>

          <button onClick={toggleTheme} style={{
            marginTop: 20, background: "none", border: "none", cursor: "pointer",
            color: T.textMuted, fontSize: 12, display: "flex", alignItems: "center", gap: 6,
            margin: "20px auto 0"
          }}>
            <Icon name={isDark ? "sun" : "moon"} size={14} color={T.textMuted}/>
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>
        </div>
      </div>
    );
  }

  // ─── Loading Screen ──────────────────────────────────────
  if (!authReady || (authReady && userId && !dataReady)) {
    return (
      <div style={{
        fontFamily: "'JetBrains Mono', monospace", background: T.bgGradient,
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: T.textMuted
      }}>
        <style>{`body { margin: 0; background: ${T.bg}; }`}</style>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>💰</div>
          <div style={{ fontSize: 14 }}>{userId ? "Daten werden geladen..." : "Laden..."}</div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      background: T.bgGradient,
      minHeight: "100vh",
      color: T.textPrimary,
      position: "relative",
      overflow: "hidden",
      maxWidth: 520,
      margin: "0 auto",
      transition: "background .4s ease, color .3s ease"
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&display=swap');
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        body { margin: 0; background: ${T.bg}; transition: background .4s ease; }
        input:focus, select:focus { border-color: ${T.accent}80 !important; box-shadow: 0 0 0 2px ${T.accent}20; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: ${T.scrollThumb}; border-radius: 2px; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideIn { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes neonPulse { 0%, 100% { filter: brightness(1); } 50% { filter: brightness(1.15); } }
        @keyframes floatOrb1 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(40px, -30px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.95); } }
        @keyframes floatOrb2 { 0%, 100% { transform: translate(0, 0) scale(1); } 33% { transform: translate(-50px, 20px) scale(0.9); } 66% { transform: translate(30px, -40px) scale(1.08); } }
        @keyframes floatOrb3 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(25px, 35px) scale(1.05); } }
        @keyframes importCountdown { from { width: 100%; } to { width: 0%; } }
      `}</style>

      {/* ─── Animated Background Orbs ─── */}
      {isDark ? (
        <>
          <div style={{ position: "fixed", top: -100, right: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(123,97,255,0.08) 0%, transparent 70%)", pointerEvents: "none", animation: "floatOrb1 20s ease-in-out infinite" }}/>
          <div style={{ position: "fixed", bottom: -100, left: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(0,232,123,0.05) 0%, transparent 70%)", pointerEvents: "none", animation: "floatOrb2 25s ease-in-out infinite" }}/>
        </>
      ) : (
        <>
          {/* Large soft pastel orbs for glassmorphism backdrop */}
          {/* Lavender orb — top left */}
          <div style={{ position: "fixed", top: -100, left: -80, width: 450, height: 450, background: "radial-gradient(circle, rgba(124,58,237,0.18) 0%, rgba(124,58,237,0.06) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(40px)", animation: "floatOrb1 20s ease-in-out infinite" }}/>
          {/* Pink orb — top right */}
          <div style={{ position: "fixed", top: -40, right: -60, width: 380, height: 380, background: "radial-gradient(circle, rgba(236,72,153,0.16) 0%, rgba(236,72,153,0.05) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(45px)", animation: "floatOrb2 24s ease-in-out infinite" }}/>
          {/* Peach / warm orb — center right */}
          <div style={{ position: "fixed", top: "35%", right: -30, width: 350, height: 350, background: "radial-gradient(circle, rgba(251,146,60,0.14) 0%, rgba(251,146,60,0.04) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(50px)", animation: "floatOrb3 18s ease-in-out infinite" }}/>
          {/* Cyan / teal orb — bottom left */}
          <div style={{ position: "fixed", bottom: -80, left: -40, width: 420, height: 420, background: "radial-gradient(circle, rgba(6,182,212,0.15) 0%, rgba(6,182,212,0.05) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(45px)", animation: "floatOrb2 22s ease-in-out infinite reverse" }}/>
          {/* Soft violet orb — bottom center */}
          <div style={{ position: "fixed", bottom: -60, left: "40%", width: 360, height: 360, background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, rgba(139,92,246,0.04) 45%, transparent 70%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(50px)", animation: "floatOrb1 26s ease-in-out infinite reverse" }}/>
          {/* Soft green accent — center left */}
          <div style={{ position: "fixed", top: "50%", left: -60, width: 300, height: 300, background: "radial-gradient(circle, rgba(52,211,153,0.1) 0%, transparent 60%)", pointerEvents: "none", borderRadius: "50%", filter: "blur(40px)", animation: "floatOrb3 16s ease-in-out infinite reverse" }}/>
        </>
      )}

      {/* Header */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px",
        background: T.headerBg, backdropFilter: T.glassBlur,
        borderBottom: `1px solid ${T.headerBorder}`,
        position: "fixed", top: 0, zIndex: 100,
        width: "100%", maxWidth: 520, left: "50%", transform: "translateX(-50%)",
        boxShadow: isDark ? "none" : "0 4px 20px rgba(100,80,160,0.06)"
      }}>
        <button onClick={() => setMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: T.textPrimary }}><Icon name="menu" size={22}/></button>
        <span onClick={() => setPage("home")} style={{ fontSize: 20, fontWeight: 800, letterSpacing: 1.5, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, ...(isDark ? { animation: "neonPulse 3s ease-in-out infinite" } : {}) }}>
          <span style={{ color: T.titleGlow1, textShadow: T.titleShadow1 }}>Budget</span>{" "}
          <span style={{ color: T.titleGlow2, textShadow: T.titleShadow2 }}>Planer</span>
          <span title={syncStatus === "synced" ? "Cloud-Sync aktiv" : syncStatus === "connecting" ? "Verbinde..." : "Offline – Daten lokal gespeichert"} style={{
            width: 7, height: 7, borderRadius: "50%", marginLeft: 4, flexShrink: 0,
            background: syncStatus === "synced" ? T.income : syncStatus === "connecting" ? T.warning : T.expense,
            boxShadow: `0 0 6px ${syncStatus === "synced" ? T.income : syncStatus === "connecting" ? T.warning : T.expense}60`,
            animation: syncStatus === "connecting" ? "neonPulse 1.5s ease-in-out infinite" : "none"
          }}/>
        </span>
        <div style={{ width: 32 }}/>
      </div>

      {/* Side Menu */}
      {menuOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 500, animation: "fadeIn .2s" }} onClick={() => setMenuOpen(false)}>
          <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(6px)" }}/>
          <div onClick={e => e.stopPropagation()} style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 280,
            background: T.menuBg, backdropFilter: T.glassBlur,
            borderRight: `1px solid ${T.menuBorder}`,
            padding: "24px 0", boxShadow: isDark ? "8px 0 40px rgba(0,0,0,0.5)" : "8px 0 40px rgba(100,80,160,0.08)",
            animation: "slideIn .3s ease"
          }}>
            <div style={{ padding: "0 20px 20px", borderBottom: `1px solid ${T.headerBorder}`, marginBottom: 8 }}>
              <div onClick={() => navigate("home")} style={{ fontSize: 22, fontWeight: 800, letterSpacing: 1, cursor: "pointer" }}>
                <span style={{ color: T.titleGlow1, textShadow: isDark ? T.titleShadow1 : "none" }}>Budget</span>{" "}
                <span style={{ color: T.titleGlow2, textShadow: isDark ? T.titleShadow2 : "none" }}>Planer</span>
              </div>
              <div style={{ fontSize: 11, color: T.textMuted, marginTop: 4 }}>Deine Finanzen im Blick</div>
              {userInfo && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, padding: "8px 0" }}>
                  {userInfo.photo && <img src={userInfo.photo} alt="" style={{ width: 24, height: 24, borderRadius: "50%" }} referrerPolicy="no-referrer"/>}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, color: T.textPrimary, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userInfo.name}</div>
                    <div style={{ fontSize: 10, color: T.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{userInfo.email}</div>
                  </div>
                </div>
              )}
            </div>
            {menuItems.map(item => (
              <button key={item.id} onClick={() => navigate(item.id)} style={{
                display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "13px 20px",
                background: page === item.id ? `${T.accent}18` : "transparent",
                border: "none", borderLeft: page === item.id ? `3px solid ${T.accent}` : "3px solid transparent",
                color: page === item.id ? T.textPrimary : T.textMuted, fontSize: 14, fontWeight: page === item.id ? 700 : 500,
                cursor: "pointer", transition: "all .15s", textAlign: "left"
              }}><Icon name={item.icon} size={18} color={page === item.id ? T.accent : T.textMuted}/>{item.label}</button>
            ))}
            <div style={{ borderTop: `1px solid ${T.headerBorder}`, marginTop: 8, paddingTop: 8 }}>
              <button onClick={() => { handleLogout(); setMenuOpen(false); }} style={{
                display: "flex", alignItems: "center", gap: 14, width: "100%", padding: "13px 20px",
                background: "transparent", border: "none", borderLeft: "3px solid transparent",
                color: T.expense, fontSize: 14, fontWeight: 500, cursor: "pointer", textAlign: "left"
              }}>
                <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: "none", stroke: T.expense, strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round" }}>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                Abmelden
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ paddingTop: 69, position: "relative", zIndex: 1 }}>{renderPage()}</div>

      <EntryModal open={newEntryOpen} onClose={() => { setNewEntryOpen(false); setEditEntry(null); }} editEntry={editEntry} onSave={handleSaveEntry} onDelete={handleDeleteEntry} categories={data.categories} viewMonth={viewMonth} viewYear={viewYear} T={T} styles={styles}/>

      {/* Import Message Box */}
      {importMsg && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setImportMsg(null)}>
          <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(6px)" }}/>
          <div onClick={e => e.stopPropagation()} style={{
            position: "relative", width: "85%", maxWidth: 380, background: T.modalBg, backdropFilter: T.glassBlur,
            borderRadius: 20, padding: "28px 24px 20px", textAlign: "center",
            border: `1px solid ${importMsg.type === "success" ? `${T.income}40` : `${T.expense}40`}`,
            boxShadow: T.glassShadow, animation: "slideUp .3s ease", overflow: "hidden"
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>{importMsg.type === "success" ? "✅" : "❌"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>{importMsg.title || (importMsg.type === "success" ? "Erfolgreich" : "Fehlgeschlagen")}</div>
            <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 20, lineHeight: 1.6 }}>{importMsg.text}</div>
            <button onClick={() => setImportMsg(null)} style={{ ...btnPrimary, background: importMsg.type === "success" ? T.income : T.expense }}>OK</button>
            {importMsg.type === "success" && (
              <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 3, background: `${T.income}20`, borderRadius: "0 0 20px 20px" }}>
                <div style={{ height: "100%", background: T.income, borderRadius: "0 0 20px 20px", animation: "importCountdown 6s linear forwards" }}/>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Reset Dialog */}
      {confirmReset && (
        <div style={{ position: "fixed", inset: 0, zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmReset(false)}>
          <div style={{ position: "absolute", inset: 0, background: T.modalOverlay, backdropFilter: "blur(6px)" }}/>
          <div onClick={e => e.stopPropagation()} style={{
            position: "relative", width: "85%", maxWidth: 360, background: T.modalBg, backdropFilter: T.glassBlur,
            borderRadius: 20, padding: "28px 24px", textAlign: "center",
            border: `1px solid ${T.expense}30`, boxShadow: T.glassShadow,
            animation: "slideUp .3s ease"
          }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.textPrimary, marginBottom: 8 }}>Alle Daten löschen?</div>
            <div style={{ fontSize: 13, color: T.textSecondary, marginBottom: 20, lineHeight: 1.5 }}>
              Einträge, Kategorien, Sparziele und wiederkehrende Buchungen werden unwiderruflich gelöscht.
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmReset(false)} style={{ ...btnSecondary, flex: 1, padding: "12px 16px", fontSize: 15, fontWeight: 700 }}>Abbrechen</button>
              <button onClick={handleReset} style={{ ...btnPrimary, flex: 1, background: `linear-gradient(135deg, ${T.expense}, #ff6b35)` }}>Löschen</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
