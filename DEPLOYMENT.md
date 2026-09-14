# DocuLedger B2B Platform - Zero-Cost Cloud Deployment & Architecture Guide

This guide details how to deploy the entire DocuLedger stack onto a **100% Free Cloud Infrastructure** with automated CI/CD pipelines, SSL certificates, multi-tenant isolation, and zero downtime.

---

## 1. Zero-Cost Cloud Infrastructure Stack Overview

| Layer | Provider | Free Tier Specification | Cost |
| :--- | :--- | :--- | :--- |
| **Front-End** | **Vercel** | Unlimited static edge hosting, free global SSL, automatic branch previews | **$0.00 / mo** |
| **Back-End API** | **Render** | Docker Container (Web Service with health checks & auto-deploy) | **$0.00 / mo** |
| **Queue Worker** | **Render** | Docker Celery Background Worker running asynchronous extraction tasks | **$0.00 / mo** |
| **Database & RLS** | **Supabase** | Free PostgreSQL 15 (500MB storage, Row-Level Security, connection pooling) | **$0.00 / mo** |
| **Redis Cache** | **Upstash** or **Render** | 10,000 commands/day serverless Redis for Celery queue & JWT blacklist | **$0.00 / mo** |
| **CI / CD Pipeline** | **GitHub Actions** | 2,000 free runner minutes / month for automated testing & builds | **$0.00 / mo** |
| **Total Monthly Infrastructure Cost** | | | **$0.00** |

---

## 2. Step-by-Step Deployment Guide

### Step 1: Database Setup (Supabase Free Tier)
1. Navigate to [supabase.com](https://supabase.com) and create a new project: `doculedger-db`.
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Paste and execute the contents of [`backend/supabase_schema.sql`](backend/supabase_schema.sql).
   - This creates the multi-tenant tables: `tenants`, `users`, `documents`, `parsing_jobs`, `parsing_logs`, `processed_webhook_events`.
   - Enables PostgreSQL Row-Level Security (RLS) policies for tenant data isolation.
4. Copy your database connection string from **Project Settings > Database**:
   - Connection string (Session pooler):
     `postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres`

---

### Step 2: Redis Setup (Upstash Serverless Redis)
1. Go to [upstash.com](https://upstash.com) and create a free Redis database: `doculedger-redis`.
2. Select your closest primary region (e.g. Frankfurt or US-East).
3. Copy the standard Redis connection string:
   `rediss://default:[PASSWORD]@[HOST]:[PORT]`

---

### Step 3: Back-End & Celery Worker Deployment (Render Blueprint)
1. Push this repository to GitHub: `github.com/[your-user]/doculedger`.
2. Log in to [render.com](https://render.com) and click **New > Blueprint**.
3. Select your GitHub repository. Render will automatically detect [`render.yaml`](render.yaml).
4. Configure the environment variables in the Render Dashboard:
   - `DATABASE_URL`: `postgresql+asyncpg://postgres:[PASSWORD]@[HOST]:5432/postgres`
   - `SYNC_DATABASE_URL`: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`
   - `REDIS_URL`: Your Upstash Redis URL (or let Render create the internal Redis).
   - `STRIPE_SECRET_KEY`: `sk_test_...` (or live key)
   - `STRIPE_WEBHOOK_SECRET`: `whsec_...`
   - `ANTHROPIC_API_KEY`: `sk-ant-...`
   - `OPENAI_API_KEY`: `sk-...`
   - `FRONTEND_URL`: `https://doculedger.vercel.app`
5. Click **Apply**. Render will automatically build the `backend/Dockerfile` and deploy:
   - `doculedger-api`: FastAPI REST API at `https://doculedger-api.onrender.com`.
   - `doculedger-worker`: Celery Background Worker for async OCR and AI extraction.

---

### Step 4: Front-End Deployment (Vercel)
1. Log in to [vercel.com](https://vercel.com) and click **Add New > Project**.
2. Select your repository and set the **Root Directory** to `frontend`.
3. In **Environment Variables**, set:
   - `NEXT_PUBLIC_BACKEND_API_URL`: `https://doculedger-api.onrender.com`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`: `pk_test_...`
4. Click **Deploy**. Vercel will build Next.js 14 and assign your custom production domain with free SSL.

---

### Step 5: Stripe Webhook Configuration
1. Go to your [Stripe Dashboard > Developers > Webhooks](https://dashboard.stripe.com/webhooks).
2. Click **Add endpoint** with URL:
   `https://doculedger-api.onrender.com/api/v1/payments/webhook`
3. Select the events to listen to:
   - `checkout.session.completed`
   - `invoice.payment_succeeded`
   - `customer.subscription.deleted`
   - `customer.subscription.updated`
4. Copy the **Signing secret** (`whsec_...`) and save it to `STRIPE_WEBHOOK_SECRET` on Render.

---

## 3. Zero-Downtime Release Checklist

Before every production deployment, verify the following checklist:

- [x] **Automated Tests:** All 34 tests pass cleanly (`pytest backend/tests -v`).
- [x] **Next.js Production Build:** `npm run build` exits with code `0`.
- [x] **Database Migrations:** Schema applied with RLS policies enabled.
- [x] **CORS Configuration:** `BACKEND_CORS_ORIGINS` includes your Vercel production domain.
- [x] **Docker Healthcheck:** `curl -f http://localhost:8000/health` returns `200 OK`.
- [x] **Webhook Idempotency:** Duplicate events checked against `processed_webhook_events`.
- [x] **Mobile Responsiveness:** Split-Screen automatically converts to tabbed layout on screens `<768px`.
- [x] **Data Privacy:** Raw PDFs auto-deleted upon extraction completion.
