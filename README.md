# SpendWise

A full-stack personal finance app built for financial discipline. Track earnings, log expenses, set budgets, manage savings goals, scan receipts with AI, and get personalized coaching — all in a clean monochrome interface.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Clone the repo](#1-clone-the-repo)
  - [2. Set up Supabase](#2-set-up-supabase)
  - [3. Configure environment variables](#3-configure-environment-variables)
  - [4. Install dependencies](#4-install-dependencies)
  - [5. Run the app](#5-run-the-app)
- [Environment Variables](#environment-variables)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Key Design Decisions](#key-design-decisions)

---

## Features

| Feature | Description |
|---|---|
| **Dashboard** | Monthly overview — earnings, spending, net position, financial health score, 7-day pulse chart |
| **Earnings** | Log multiple income sources per month (salary, freelance, bonuses) with full history |
| **Transactions** | Record expenses with category tagging, month/category filters, and search |
| **Impulse Blocker** | 10-second countdown modal that fires on non-essential purchases to break spending habits |
| **Scan & Capture** | Photograph a receipt or scan a barcode — Claude Vision extracts every line item automatically |
| **Budgets** | Set monthly spending limits per category with over-budget alerts |
| **Analytics** | Pie and bar charts — category breakdown, essential vs discretionary, multi-month trends |
| **Savings Goals** | Create targets with deadlines, deposit funds, track progress |
| **Reports** | Monthly financial statements with CSV export |
| **AI Audit** | Claude-powered behavioral coaching based on real spending data |
| **Auth** | Email/password sign-up and sign-in via BetterAuth |
| **Mobile Responsive** | Bottom tab navigation, single-column layouts, and bottom-sheet modals on small screens |

---

## Tech Stack

**Frontend**
- [React 18](https://react.dev) — UI
- [Recharts](https://recharts.org) — Charts
- [Vite](https://vitejs.dev) — Dev server and bundler
- [BetterAuth client](https://better-auth.com) — Session management

**Backend**
- [Hono](https://hono.dev) — Lightweight TypeScript web framework
- [BetterAuth](https://better-auth.com) — Authentication (email/password, session cookies)
- [Supabase](https://supabase.com) — PostgreSQL database
- [@anthropic-ai/sdk](https://github.com/anthropic-ai/sdk-python) — Claude API for receipt OCR and AI coaching
- [Node.js](https://nodejs.org) + [tsx](https://github.com/privatenumber/tsx) — Runtime

**Database**
- PostgreSQL (via Supabase) — all auth and app data
- Supabase Session Pooler — IPv4-compatible connection for serverless/local environments

---

## Project Structure

```
spendwise/
├── SpendWise.jsx              # Entire React frontend (single file)
├── index.html                 # Vite entry HTML
├── vite.config.js             # Vite config
├── package.json               # Frontend deps
├── schema.sql                 # Supabase DB schema — run this once to set up tables
│
├── src/
│   ├── main.jsx               # React root mount
│   └── api.js                 # Frontend API client + BetterAuth browser client
│
└── backend/
    ├── .env.example           # Environment variable template
    ├── .gitignore
    ├── package.json
    ├── tsconfig.json
    └── src/
        ├── index.ts           # Hono server entry — mounts all routes
        ├── auth.ts            # BetterAuth configuration
        ├── db.ts              # Supabase service-role client
        ├── middleware/
        │   └── require-auth.ts  # Session guard for protected routes
        └── routes/
            ├── transactions.ts
            ├── earnings.ts
            ├── budgets.ts
            ├── goals.ts
            └── claude.ts      # Claude API proxy (receipt OCR + AI audit)
```

---

## Prerequisites

- [Node.js](https://nodejs.org) v18 or higher
- A [Supabase](https://supabase.com) account (free tier works)
- An [Anthropic](https://console.anthropic.com) API key (for Scanner and AI Audit)
- A [GitHub](https://github.com) account (optional, for deployment)

---

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/LUFA199x/spendwise.git
cd spendwise
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor → New query**, paste the contents of `schema.sql`, and click **Run**
3. Collect the following from **Project Settings → API**:
   - **Project URL** → `SUPABASE_URL`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`
4. Collect the database connection string from **Project Settings → Database → Connection string → Session mode (port 5432)** → `DATABASE_URL`

> **Note:** Use the **Session pooler** connection string (port 5432, format `postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`) rather than the direct host (`db.[ref].supabase.co`). The direct host is IPv6-only on new projects and may not resolve in all environments.

### 3. Configure environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your credentials:

```env
ANTHROPIC_API_KEY=sk-ant-...
DATABASE_URL=postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
BETTER_AUTH_SECRET=<random 32+ char string>
BETTER_AUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
PORT=3000
```

Generate a `BETTER_AUTH_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Install dependencies

```bash
# Frontend
npm install

# Backend
cd backend && npm install
```

### 5. Run the app

Open two terminals:

```bash
# Terminal 1 — Backend (port 3000)
cd backend
npm run dev

# Terminal 2 — Frontend (port 5173)
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — create an account and you're in.

---

## Environment Variables

All secrets live in `backend/.env` (never committed). The frontend has no secrets — it talks only to your own backend.

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Anthropic API key for receipt OCR and AI audit |
| `DATABASE_URL` | Yes | Supabase PostgreSQL Session pooler connection string |
| `SUPABASE_URL` | Yes | Supabase project URL (`https://[ref].supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role JWT — bypasses RLS for server-side queries |
| `BETTER_AUTH_SECRET` | Yes | Secret used to sign session tokens — min 32 characters |
| `BETTER_AUTH_URL` | Yes | Public URL of the backend (e.g. `http://localhost:3000`) |
| `FRONTEND_URL` | Yes | Frontend origin for CORS allow-list |
| `PORT` | No | Backend port (default: `3000`) |

---

## API Reference

All app routes require a valid session cookie (set automatically after sign-in). Auth routes are handled by BetterAuth.

### Auth

Handled by BetterAuth at `/api/auth/**`. Key endpoints:

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/sign-up/email` | Register with name, email, password |
| `POST` | `/api/auth/sign-in/email` | Sign in with email, password |
| `POST` | `/api/auth/sign-out` | Invalidate session |
| `GET` | `/api/auth/get-session` | Return current session and user |

### Transactions

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/transactions` | — | List all transactions for the authenticated user |
| `POST` | `/api/transactions` | `{ id, description, amount, category, date, type, month, year }` | Create a transaction |
| `DELETE` | `/api/transactions/:id` | — | Delete a transaction |

> `amount` is stored in **kobo** (Naira × 100). `type` is `"essential"` or `"discretionary"`.

### Earnings

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/earnings` | — | List all income entries |
| `POST` | `/api/earnings` | `{ id, amount, date, note, month, year }` | Log an income entry |
| `DELETE` | `/api/earnings/:id` | — | Remove an income entry |

### Budgets

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/budgets` | — | List all category budgets |
| `POST` | `/api/budgets` | `{ category, limit }` | Create or update a budget (upserts on `userId + category`) |
| `DELETE` | `/api/budgets/:category` | — | Remove a category budget |

### Goals

| Method | Path | Body | Description |
|---|---|---|---|
| `GET` | `/api/goals` | — | List all savings goals |
| `POST` | `/api/goals` | `{ id, name, target, current, deadline }` | Create a goal |
| `PUT` | `/api/goals/:id` | `{ current }` (partial) | Update a goal (e.g. deposit funds) |
| `DELETE` | `/api/goals/:id` | — | Delete a goal |

### Claude Proxy

| Method | Path | Body | Description |
|---|---|---|---|
| `POST` | `/api/claude` | `{ messages, max_tokens, system? }` | Proxy a Claude API request — adds the server-side API key. Used for receipt scanning and AI audit. |

---

## Database Schema

All tables live in the `public` schema of your Supabase PostgreSQL database. Run `schema.sql` once to create them.

### BetterAuth tables (managed automatically)

| Table | Purpose |
|---|---|
| `user` | Registered users |
| `session` | Active sessions (cookie-based) |
| `account` | OAuth / credential accounts per user |
| `verification` | Email verification tokens |

### App tables

**`transactions`**

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` | Client-generated random ID |
| `userId` | `TEXT` | FK → `user.id` |
| `description` | `TEXT` | |
| `amount` | `BIGINT` | In kobo (Naira × 100) |
| `category` | `TEXT` | Food, Transport, Shopping, Entertainment, Utilities, Health, Education, Other |
| `date` | `TEXT` | `YYYY-MM-DD` |
| `type` | `TEXT` | `essential` or `discretionary` |
| `month` | `INTEGER` | 1–12 |
| `year` | `INTEGER` | |
| `createdAt` | `TIMESTAMPTZ` | |

**`earnings`**

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` | |
| `userId` | `TEXT` | FK → `user.id` |
| `amount` | `BIGINT` | In kobo |
| `date` | `TEXT` | |
| `note` | `TEXT` | Source description |
| `month` | `INTEGER` | |
| `year` | `INTEGER` | |
| `createdAt` | `TIMESTAMPTZ` | |

**`budgets`**

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` | Auto-generated UUID |
| `userId` | `TEXT` | FK → `user.id` |
| `category` | `TEXT` | Unique per user |
| `limit` | `BIGINT` | Monthly cap in kobo |
| `createdAt` | `TIMESTAMPTZ` | |

**`goals`**

| Column | Type | Notes |
|---|---|---|
| `id` | `TEXT` | |
| `userId` | `TEXT` | FK → `user.id` |
| `name` | `TEXT` | |
| `target` | `BIGINT` | In kobo |
| `current` | `BIGINT` | Saved so far, in kobo |
| `deadline` | `TEXT` | Optional `YYYY-MM-DD` |
| `createdAt` | `TIMESTAMPTZ` | |

---

## Key Design Decisions

**Amounts in kobo** — All monetary values are stored and transmitted as integers in kobo (Naira × 100) to avoid floating-point rounding errors. The frontend converts to Naira only for display.

**Optimistic updates** — Mutations update local React state immediately before the API call completes, so the UI feels instant. If the API call fails, the error is logged but the UI is not reverted (acceptable for a personal tool — data reloads on next session).

**Claude API proxy** — The Anthropic API key never touches the browser. The frontend calls `/api/claude` on the backend which adds the key server-side, keeping it out of network tabs and client bundles.

**BetterAuth + Supabase** — BetterAuth manages auth (sessions, hashing, token lifecycle) and stores its tables directly in the Supabase PostgreSQL database. App data is queried via the Supabase JS client using the service role key, which bypasses Row Level Security — safe here because all queries are already scoped to the authenticated `userId` by the backend middleware.

**Single-file frontend** — The entire React app lives in `SpendWise.jsx` for simplicity. All styles are inline JS objects (no CSS files), making the component self-contained and easy to copy into any environment.
