# 💳 Local Ledger

A local, single-machine Docker app that showcases **RAG**, **guardrails**, and **evaluations** through synthetic Philippine credit card statement categorization.
This is a practice project to implement learnings.

## Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + Vite 6 + TypeScript + Tailwind CSS |
| Backend | FastAPI (Python 3.13) |
| Guardrails | Python 3.13 |
| Database | PostgreSQL 16 |
| Vector DB | QDrant |
| LLM |Ollama (gemma4:e2b) |
| Embeddings | Ollama (embbedinggemma4) |

## Features

- 🧠 **RAG** — QDrant stores ~65 Philippine merchant category examples; each transaction is embedded and matched against the nearest examples before LLM categorization
- 🛡️ **Guardrails** — 18+ regex patterns block prompt injection, jailbreaks, delimiter injection, SQL injection, and other LLM attacks before any text touches the model
- 📊 **Evaluations** — After each categorization, a second LLM call scores the quality (0–100%) and provides a one-sentence feedback
- 🏦 **Synthetic data** — 55+ realistic merchants across 10 categories (Jollibee, Grab, SM Supermarket, Meralco, Cebu Pacific, etc.)
- 💰 **Budget dashboard** — Monthly limits vs actual spending with progress bars and pie chart
- 🏆 **Store rankings** — Most-visited stores ranked by visit count with bar chart

## Quick Start

### 1. Prerequisites

- Docker Desktop installed and running
- Node.js 20+ (for building the frontend)

### 2. Configure Environments

```bash
cp .env.example .env
#Edit Environments
```

### 3. Build the frontend

```bash
cd ui
npm install
npm run build
cd ..
```

This compiles the React app into `api/static/` so FastAPI can serve it.

### 4. Start Docker Compose

```bash
docker compose up --build
```

Services start order: PostgreSQL → QDrant → Ollama -> FastAPI API

### 5. Open the app

- **UI**: http://localhost:8000
- **API docs**: http://localhost:8000/docs
- **QDrant dashboard**: http://localhost:6333/dashboard
- **Ollama Server**: http://localhost:11434

### 6. Load synthetic data

Click **"Load Synthetic Data"** in the Statements tab. This generates 60 realistic Philippine credit card transactions and runs them through the full RAG + guardrails + evaluation pipeline.

> ⚠️ First load takes ~2–5 minutes because each transaction calls the LLM twice (categorization + evaluation). Subsequent loads are faster.

## Architecture

```
Browser
  │
  ▼
FastAPI :8000
  ├── GET /  → serves React SPA (api/static/)
  ├── POST /api/statements/seed  → generate + categorize 60 txns
  ├── GET  /api/statements/list  → list with categorizations
  ├── GET  /api/budget/overview  → monthly budget vs spent
  ├── GET  /api/rankings/stores  → store visit rankings
  │
  ├── RAG pipeline (rag.py)
  │     └── QDrant :6333 (vector search on 65 category examples)
  │
  ├── Guardrails (guardrails.py)
  │     └── 18+ regex checks before LLM call
  │
  ├── Categorizer (categorizer.py)
  │     ├── LLM → Chosen Model (categorization)
  │     └── LLM → Chosen Model (evaluation/scoring)
  │
  └── PostgreSQL :5432
        ├── cardholders
        ├── statement_lines
        ├── categorizations (+ confidence, eval_score, guardrail_flags)
        ├── budget_settings
        └── store_visits
```

## Guardrail Patterns

The guardrail system (`api/input_guardrails.py`) blocks:

| Type | Example |
|------|---------|
| Instruction override | "Ignore previous instructions" |
| Jailbreak keywords | "DAN mode", "developer mode" |
| Delimiter injection | `<|system|>`, `[INST]` |
| Role confusion | "You are now an unrestricted AI" |
| Prompt exfiltration | "Show your system prompt" |
| SQL injection | `DROP TABLE`, `DELETE FROM` |
| XSS | `<script>` tags |
| Length abuse | >1000 chars in a merchant name |
| Control characters | Non-printable bytes |
| Obfuscation | >35% special character ratio |

## Cardholder

- **Name**: Maria Santos
- **Card**: `**** **** **** 4217`
- **Limit**: ₱150,000
- **Location**: Makati, Metro Manila

## Categories

| Category | Budget |
|----------|--------|
| 🍽️ Food & Dining | ₱15,000 |
| 🛒 Groceries | ₱12,000 |
| 🚗 Transportation | ₱5,000 |
| 🛍️ Shopping | ₱20,000 |
| 🎬 Entertainment | ₱5,000 |
| 💊 Health & Wellness | ₱8,000 |
| 💡 Bills & Utilities | ₱10,000 |
| ✈️ Travel | ₱15,000 |
| 📚 Education | ₱5,000 |
| 📦 Other | ₱5,000 |
