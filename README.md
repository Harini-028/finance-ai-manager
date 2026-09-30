# FinPilot AI

**AI-powered personal finance management platform** — track spending, manage budgets, view analytics, and get personalized financial insights.

## Features

- **Premium Landing Page** — Hero with floating finance cards, animated backgrounds, stats, features, how-it-works, testimonials, FAQ, pricing, and CTA sections
- **Authentication** — Email/password sign up, login, forgot password, remember me, JWT-based protected routes, logout
- **Dashboard** — Summary cards (income, expenses, savings, investments, budget, AI score), income vs expense area chart, spending breakdown pie chart, AI insights, recent activity, month-end projection
- **Transactions** — Full CRUD, search, filter by type/category/date range, sort by date or amount, pagination
- **Budget** — Daily/weekly/monthly budgets per category, real-time progress bars, over-budget and approaching-limit alerts, savings goals with progress tracking
- **Reports** — Daily/weekly/monthly/yearly periods, trend bar charts, 6-month line comparison, category breakdown, full transaction log, CSV and PDF (print) export
- **AI Assistant** — Animated AI financial score gauge, personalized insights engine (savings rate, budget utilization, category trends, investment suggestions), interactive chatbot that answers finance questions based on your real data
- **Profile** — Avatar upload, personal info (name, phone, occupation, income, financial goal), currency selection, change password
- **Settings** — Dark/light theme toggle, currency selection (7 currencies), language selection (6 languages), notification preferences, security settings (2FA toggle, login alerts)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, TypeScript, Tailwind CSS, React Router DOM, Framer Motion, Recharts, Lucide Icons |
| Backend | Supabase (PostgreSQL, Auth, Row-Level Security, Storage) |
| AI | Built-in financial insights engine + chatbot (analyzes real transaction data) |

## Design

- Glassmorphism cards, modern gradients, soft shadows, rounded corners
- Dark/light mode with full theme system
- Framer Motion animations throughout (page transitions, hover effects, floating elements)
- Fully responsive (mobile drawer sidebar, adaptive grids, responsive charts)
- 8px spacing system, 6+ color ramps, Inter + Space Grotesk typography

## Database Schema

- **profiles** — Extends auth.users with personal info, preferences, notification settings
- **transactions** — Income/expense records with type, amount, category, description, date
- **budgets** — Category spending limits with daily/weekly/monthly periods
- **savings_goals** — Named targets with current amount and optional target date
- **ai_messages** — Chatbot conversation history

All tables have Row-Level Security enabled with owner-scoped policies (`auth.uid() = user_id`).

## Getting Started

The Supabase project is pre-provisioned with credentials in `.env`. The dev server runs automatically.

```bash
npm install
npm run build   # production build
npm run typecheck  # TypeScript check
```

## Project Structure

```
src/
├── components/          # Reusable UI + feature components
│   ├── ui/              # Logo, Spinner, Modal, SummaryCard
│   ├── dashboard/       # Sidebar, Header
│   └── landing/         # Navbar, Hero, Stats, Features, etc.
├── context/             # Auth, Theme, Toast providers
├── hooks/               # useDashboardData (transactions/budgets/goals)
├── layouts/             # DashboardLayout
├── lib/                 # Supabase client, constants, formatting, analytics, AI chat
├── pages/               # All route pages
├── App.tsx              # Router
└── main.tsx             # Providers + root
```

## AI Financial Score

The AI score (0–100) is calculated from:
- **Savings rate** — percentage of income saved (target: 20%+)
- **Budget utilization** — how closely spending matches budget limits
- **Income consistency** — whether income is being tracked

The chatbot detects intent from natural language and responds with real calculations from your transaction data — summaries, spending breakdowns, budget status, month-over-month comparisons, and personalized advice.
