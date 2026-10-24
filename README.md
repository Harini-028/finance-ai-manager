# FinPilot AI – AI-Powered Personal Finance and Wealth Management System

FinPilot AI is a modern, full-stack personal finance and wealth management platform built with React, Vite, TypeScript, Express, MongoDB (with automatic MongoMemoryServer fallback), and AI-driven financial analytics.

---

## 🌟 Advanced & Unique Features

### 1. 🤖 AI Financial Coach (`/app/ai-coach`)
- **Real Data Integration**: Answers complex financial questions using the authenticated user's actual transactions, budgets, subscriptions, and savings data.
- **Mathematical Transparency**: Displays exact formulas, numerical inputs, and underlying assumptions behind every answer with an interactive "Calculations & Underlying Assumptions" accordion.
- **Actionable Scenarios Supported**:
  - *"How much can I save this month?"* — Computes monthly income minus current and projected remaining expenses to derive safe savings capacity.
  - *"Which category has the highest spending?"* — Identifies top expense drivers and percentage share of total outflow.
  - *"How can I save ₹2,000 next month?"* — Calculates exact proportional cuts needed across discretionary categories (Food, Shopping, Entertainment).
  - *"Can I afford a ₹10,000 purchase based on my current budget?"* — Evaluates purchase against current cash surplus and emergency safety margins.
- **Privacy & Security**: Zero private data leakage; strictly owner-scoped. Intelligent rule-based calculation engine with optional external LLM enhancement via `AI_API_KEY`.

### 2. 🎯 Smart Savings Goals (`/app/goals`)
- **Full Lifecycle Management**: Create, edit, pause, resume, complete, and delete goals.
- **Milestone Templates**: Quick-start presets for *Emergency Fund*, *MacBook / Tech Purchase*, *Travel & Vacation*, *Higher Education*, and *Vehicle Downpayment*.
- **Intelligent Financial Calculations**:
  - Progress percentage: `(currentAmount / targetAmount) * 100` (safe handling of zero target).
  - Required monthly contribution: `remainingAmount / monthsRemaining`.
  - Estimated completion date: Projected based on monthly contribution rate.
- **Contribution & Withdrawal Ledger**: Log deposits and withdrawals with notes and a complete timestamped transaction history.
- **Unrealistic Target Warnings**: Flags goals whose target deadlines require monthly contributions that exceed user cashflow or have already elapsed.

### 3. 💳 Subscription & Recurring Payment Manager (`/app/subscriptions`)
- **Multi-Frequency Support**: Track Weekly, Monthly, Quarterly, and Yearly/Annual billing cycles with automatic monthly and annual normalized cost projections.
- **Duplicate Subscription Detection**: Automated heuristic engine flags duplicate charges (e.g. matching services or identical costs in the same category) for user audit.
- **Upcoming Payment Timeline**: Chronological visual feed of upcoming billing dates categorized by urgency (*Due Today*, *Due in Next 7 Days*, *Overdue*).
- **In-App Reminders**: Smart alerts for impending billing dates with duplicate notification prevention.
- **Isolated from Real Transactions**: Prevents artificial double-counting. Includes an explicit **"Log Payment"** button to record an actual expense transaction and automatically advance the next billing cycle upon user confirmation.

### 4. 🎛️ What-If Financial Simulator (`/app/simulator`)
- **Hypothetical Scenario Modeling**: Test changes in monthly income (-40% to +100%) and category-by-category expense reductions (-70% to +50%).
- **Interactive Presets**:
  - *Reduce Food Expenses by 10%*
  - *Reduce Shopping by 20%*
  - *+15% Salary Increment / Side Gig*
  - *Frugal Living Mode (Cut discretionary by 25%)*
- **Real-Time Side-by-Side Impact**: Compares baseline cashflow with simulated projections, displaying monthly net delta and 1-year compounded savings.
- **12-Month Cumulative Wealth Chart**: Recharts area visualization comparing baseline trajectory against the simulated scenario path.
- **Scenario Persistence**: Save, load, and delete custom scenarios.
- **Zero Real Data Mutation**: Strictly operates in simulation mode; actual accounts, budgets, and transactions are never modified.

### 5. 🧾 Smart Receipt Scanner (`/app/receipts`)
- **Receipt Upload & Validation**: Supports JPEG, PNG, WebP, and PDF with server-side validation and a 5 MB file size limit.
- **OCR Text Extraction**: Powered by OCR text recognition with heuristic parsing for Merchant, Date, Total Amount, Currency symbol, and Expense Category.
- **Editable Review Form**: Extracted metadata is loaded into an editable verification form so users can correct any OCR misreads.
- **Duplicate Receipt Detection**: Warns if a matching transaction or receipt already exists within a ±2 day window.
- **Private Encrypted Storage**: Uploads are stored privately on the server (`uploads/receipts/`) and streamed only through an authenticated, owner-verified endpoint (`GET /api/receipts/:id/file`). Files are never exposed via public URLs.
- **Explicit Confirmation**: Expenses are never added automatically without user confirmation via the *"Confirm & Add to Expenses"* action.

### 6. 🏛️ Net Worth Tracker (`/app/net-worth`)
- **Balance Sheet Architecture**: Total Assets minus Total Liabilities, cleanly isolated from monthly cashflow transactions.
- **Asset Portfolios**: Cash & Bank Accounts, Investments & Mutual Funds, Stocks, Real Estate, Vehicles, Retirement, Gold & Valuables.
- **Liability Portfolios**: Mortgages, Auto Loans, Student Loans, Credit Card Balances, Personal Loans, Business Debt.
- **Debt-to-Asset Ratio & Allocation**: Visual donut/pie charts of asset allocation and debt distribution.
- **Historical Snapshots**: Take dated valuation snapshots and view net worth growth over time on an area chart.
- **Valuation Recency**: Manually entered valuations display last-updated dates for complete auditability.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technology | Details |
|---|---|---|
| **Frontend** | React 18, Vite, TypeScript | Modern component architecture, Strict TypeScript types |
| **Styling** | Tailwind CSS, Framer Motion | Fintech dark navy theme, smooth micro-animations |
| **Charts** | Recharts | Responsive Area, Donut, and Bar charts |
| **Icons** | Lucide React | Clean, scalable fintech iconography |
| **Backend API** | Node.js, Express (ES Modules) | RESTful API, Express Rate Limit, Multer |
| **Database** | MongoDB / Mongoose | Auto-fallback to `mongodb-memory-server` for instant local execution |
| **OCR Engine** | Tesseract.js | In-engine character recognition with robust regex heuristic fallbacks |
| **Auth** | JWT + bcryptjs | Protected Bearer token authentication with owner-scoped DB queries |

---

## 📡 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register new user
- `POST /api/auth/login` — Authenticate and receive JWT
- `GET /api/auth/me` — Get authenticated user profile

### AI Financial Coach (`/api/ai`)
- `GET /api/ai/analysis` — Complete financial health analysis
- `POST /api/ai/coach` — Q&A endpoint with calculations, inputs, and assumptions breakdown
- `POST /api/ai/chat` — Compatible chat endpoint

### Smart Savings Goals (`/api/savings`)
- `GET /api/savings` — Get all user goals with required monthly contributions & deadlines
- `POST /api/savings` — Create a savings goal
- `PUT /api/savings/:id` — Update savings goal
- `DELETE /api/savings/:id` — Delete savings goal
- `POST /api/savings/:id/transaction` — Record a deposit or withdrawal with note
- `PATCH /api/savings/:id/status` — Toggle status (`active`, `paused`, `completed`)

### Subscriptions (`/api/subscriptions`)
- `GET /api/subscriptions` — List subscriptions with normalized costs, duplicate alerts, and reminders
- `POST /api/subscriptions` — Add subscription (weekly, monthly, quarterly, yearly)
- `PUT /api/subscriptions/:id` — Update subscription
- `DELETE /api/subscriptions/:id` — Remove subscription
- `PATCH /api/subscriptions/:id/status` — Pause or resume subscription
- `POST /api/subscriptions/:id/log-payment` — Confirm & log payment as an actual transaction

### What-If Simulator (`/api/scenarios`)
- `POST /api/scenarios/calculate` — Non-destructive live simulation calculation
- `GET /api/scenarios` — List saved scenarios
- `POST /api/scenarios` — Save a scenario
- `PUT /api/scenarios/:id` — Update scenario
- `DELETE /api/scenarios/:id` — Delete scenario

### Smart Receipt Scanner (`/api/receipts`)
- `POST /api/receipts/upload` — Upload receipt image, run OCR, and return extracted fields
- `GET /api/receipts` — List scanned receipts
- `GET /api/receipts/:id/file` — Stream private receipt image (owner-verified)
- `POST /api/receipts/:id/confirm` — Confirm details and convert into a real expense transaction
- `DELETE /api/receipts/:id` — Delete receipt and disk file

### Net Worth Tracker (`/api/net-worth`)
- `GET /api/net-worth` — Get total assets, total liabilities, net worth, and historical snapshots
- `POST /api/net-worth/items` — Add asset or liability
- `PUT /api/net-worth/items/:id` — Update item value or valuation date
- `DELETE /api/net-worth/items/:id` — Remove item
- `POST /api/net-worth/snapshots` — Record a dated net worth snapshot

---

## 🚀 Running the Application Locally

### Quick Start (Both Backend & Frontend in One Command)

From the project root:
```bash
npm run dev:all    # Concurrently starts both backend (port 5000) and frontend (port 5173)
```

---

### Alternative: Running in Separate Terminals

#### Terminal 1 — Backend:
```bash
cd backend
npm run dev        # Starts Express server on http://localhost:5000 (with nodemon)
# or: npm start
```

*Note: If a local MongoDB instance is not detected on `mongodb://localhost:27017`, the backend automatically spins up an in-memory MongoDB server (`mongodb-memory-server`) with zero external configuration required.*

#### Terminal 2 — Frontend:
```bash
# In the project root:
npm run dev       # Starts Vite dev server on http://localhost:5173
npm run build     # Compiles production bundle
npm run typecheck # Validates 100% TypeScript type safety
```

### 3. Automated API & Security Verification Tests

```bash
cd backend
node test-api.js                 # Tests core auth, transactions, and budgets
node test-advanced-api.js        # Tests all 6 new modules (Coach, Goals, Subscriptions, Simulator, Receipts, Net Worth)
node test-cross-user-security.js # Tests multi-tenant isolation, unauthorized access blocks, and 401 token checks
```

---

## 🔒 Security & Privacy Guarantees

1. **Owner-Scoped Queries**: Every database query filters strictly by `userId: req.user._id`. Users cannot view, modify, or delete any record belonging to another user.
2. **Private File Storage**: Receipts are saved in `backend/uploads/receipts/` outside the public web root. Access is routed through authenticated endpoints with explicit ownership checks.
3. **No Unconfirmed Mutations**: Subscriptions and scanned receipts are never converted into transactions without explicit user confirmation.
4. **Simulator Isolation**: What-If calculations are computed entirely in memory and never mutate production transactions, budgets, or balances.
5. **No Key Exposure**: External AI keys and secrets remain strictly in backend environment variables.
