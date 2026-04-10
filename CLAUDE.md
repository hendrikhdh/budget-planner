# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Personal budget planner PWA (German UI) built with React 19 + Vite. Single-page app with Firebase backend (Auth via Google, Firestore for data persistence). Deployed to GitHub Pages via GitHub Actions.

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build (outputs to `dist/`)
- `npm run preview` — Preview production build locally
- `npm run deploy` — Build and deploy to GitHub Pages via `gh-pages`
- ESLint is configured but has no dedicated script; run with `npx eslint .`

## Architecture

`src/App.jsx` is a thin orchestrator (~200 lines): it composes hooks, holds page/menu/modal UI state, and routes the active page. There is no routing library — navigation is in-component state (`page` variable in `BudgetPlanner`).

### Module layout

```
src/
├── App.jsx                          Root: composes hooks, routes pages
├── main.jsx                         Vite entry
├── firebase.js                      Firebase init from VITE_FIREBASE_* env
├── theme.js                         Dark/light theme tokens
├── hooks/
│   ├── useTheme.js                  Theme state + persistence
│   ├── useAuth.js                   Google sign-in/out, auth state
│   ├── useFirestoreSync.js          Realtime sync, offline fallback, debounced writes
│   ├── useServiceWorker.js          SW registration + reminder scheduling
│   ├── useApplyRecurring.js         Auto-applies due recurring entries
│   └── useFormStyles.js             Themed inline-style objects (input/btn/card)
├── lib/
│   └── dataIO.js                    Export download / clipboard / import-validate
├── utils/
│   ├── helpers.js                   uid, fmt, fmtWhole, fmtShort, date helpers
│   ├── categories.js                CAT_COLORS, defaults, catName/Emoji/Color
│   ├── data.js                      emptyData factory
│   ├── storage.js                   STORAGE_KEY, AES encryptLS/decryptLS
│   ├── prediction.js                WMA, Holt, linear regression, ensemble
│   └── styles.js
├── charts/                          DonutChart, LineChart, BarChart
├── components/
│   ├── Icon.jsx                     SVG icon set
│   ├── Modal.jsx, EntryItem.jsx, MonthNav.jsx, SwipeToDelete.jsx, EntryModal.jsx
│   └── layout/
│       ├── AppHeader.jsx            Top bar with menu button + sync dot
│       ├── SideMenu.jsx             Drawer + menu items list
│       ├── LoginScreen.jsx          Pre-auth screen
│       ├── LoadingScreen.jsx        Auth/data loading screen
│       ├── BackgroundOrbs.jsx       Animated decorative gradients
│       ├── AppShellStyles.jsx       Global <style> block (keyframes, scrollbar)
│       └── ConfirmDialog.jsx        Generic confirm + import-message dialog
└── pages/
    ├── HomePage.jsx                 Balance card, savings, warnings, recent entries
    ├── AnalysisPage.jsx             Income/expense analysis (donut + 12-month line)
    ├── YearlyPage.jsx               12-month bar chart + table
    ├── ImportExportPage.jsx         Export, import, reset data
    ├── BudgetPage.jsx, CategoriesPage.jsx, RecurringPage.jsx, SavingsPage.jsx
    └── PredictionPage.jsx, SearchPage.jsx, SettingsPage.jsx
```

Firestore is the single source of truth — `useFirestoreSync` always loads remote first; the encrypted localStorage cache is only used as offline fallback and never overwrites newer remote data.

### Data model

All user data is stored as a single Firestore document per user. The data object contains:
- `entries` — Array of income/expense transactions with `{id, type, amount, category, date, note}`
- `categories` / `expenseCategories` — Custom category lists with `{name, emoji, color}`
- `recurring` — Recurring transaction definitions
- `savings` — Savings goals
- `budgets` — Monthly budget limits per category

### Tech stack (actual, not aspirational)

- **React 19** with JSX (plain JavaScript, not TypeScript)
- **Vite 8** as build tool
- **Firebase** (Auth + Firestore) — not Supabase
- **Inline styles** via JS objects — not Tailwind, not CSS modules
- **No UI library** — all components are custom-built
- **No state management library** — React useState/useEffect only
- **GitHub Pages** deployment (base path: `/budget-planner/`)

### Environment variables

Firebase config is loaded from env vars (see `.env.local`). GitHub Actions secrets mirror these for CI deployment:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

### PWA

- `public/manifest.json` — Web app manifest (standalone, portrait)
- `public/sw.js` — Service worker
- PNG icons at 180, 192, and 512px in `public/`

## Important notes

- The app UI is entirely in **German** (category names, labels, buttons, notifications)
- Currency is EUR, formatted with `de-DE` locale
- All styling uses inline JS style objects with theme tokens — maintain this pattern
- The `base` in `vite.config.js` is `/budget-planner/` (required for GitHub Pages)
- No tests exist in this project
