# DocuLedger: B2B Invoice & Bank Statement Extraction Platform

DocuLedger is an enterprise-grade MicroSaaS that extracts, audits, and exports financial invoices and bank statements with 100% mathematical certainty.

---

## Key Features

- **Split-Screen Interactive Workspace:** Side-by-side 50/50 view connecting digital PDF tokens with extracted table cells via live bounding-box highlights.
- **Mobile-First Responsiveness:** Automatically adapts to screens `<768px` with dedicated tabbed views (`[PDF Viewer]` & `[Extracted Data]`).
- **Separation of Extraction vs Computation:** LLM extracts verbatim data only; deterministic Python (`pandas`) executes all mathematical calculations and reconciliations.
- **OCR Fallback Pipeline:** Dual-stage extraction using `pdfplumber` for digital PDFs, automatically falling back to OCR when text length is `<50` characters.
- **Hot-Swapping Circuit Breaker:** High-availability routing between Claude 3.5 Haiku (Primary) and GPT-4o-mini (Fallback) on 5xx errors or timeouts (>4s).
- **Automated Stripe Subscription Billing:** Integrated Stripe Checkout, 1-click self-service Customer Portal, and idempotent Webhook listeners.
- **Strict Multi-Tenancy & RLS:** Complete tenant isolation enforced with PostgreSQL Row-Level Security (RLS) policies.
- **Zero-Cost Cloud Deployment:** Built for 100% free hosting using Vercel (Front-end), Render (FastAPI + Celery), Supabase (PostgreSQL), and Upstash (Redis).

---

## Tech Stack

- **Front-End:** Next.js 14 (App Router), Tailwind CSS, TanStack Table v8, Lucide Icons, Zustand.
- **Back-End:** FastAPI, Uvicorn, Celery, Redis, SQLAlchemy, Pydantic v2.
- **Database & Storage:** Supabase (PostgreSQL 15), Upstash (Serverless Redis).
- **Billing & FinTech:** Stripe API (Checkout Sessions, Billing Portal, Webhooks).
- **AI & OCR:** Anthropic Claude 3.5 Haiku, OpenAI GPT-4o-mini, pdfplumber, pypdf, Tesseract OCR.
- **CI/CD & DevOps:** GitHub Actions, Docker, Render Blueprints (`render.yaml`), Vercel (`vercel.json`).

---

## Quick Start (Local Development)

### 1. Back-End
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On macOS/Linux:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be accessible at: `http://localhost:8000/api/v1/docs`

### 2. Front-End
```bash
cd frontend
npm install
npm run dev
```
Web Application will be accessible at: `http://localhost:3000`

---

## Deployment Guide

See [DEPLOYMENT.md](DEPLOYMENT.md) for full step-by-step instructions on deploying the full stack onto zero-cost cloud hosting.
