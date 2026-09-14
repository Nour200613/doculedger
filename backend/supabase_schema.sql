-- ========================================================================
-- DocuLedger B2B Platform - Supabase PostgreSQL Schema & RLS Policies
-- Multi-Tenancy Architecture with Row-Level Security (RLS)
-- ========================================================================

-- Enable cryptographic UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Tenants Table (Accountants / Firms / Organizations)
CREATE TABLE IF NOT EXISTS tenants (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) DEFAULT 'individual' NOT NULL,
    plan_status VARCHAR(50) DEFAULT 'active' NOT NULL,
    monthly_credit_limit INT DEFAULT 100 NOT NULL,
    invoices_processed INT DEFAULT 0 NOT NULL,
    auto_delete_original_pdf BOOLEAN DEFAULT TRUE NOT NULL,
    api_key VARCHAR(100) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(100),
    stripe_subscription_id VARCHAR(100),
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_stripe_cust ON tenants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenants_stripe_sub ON tenants(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);

-- 2. Users Table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'member' NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 3. Documents Table (Financial Invoices & Bank Statements)
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size INT DEFAULT 0,
    storage_path VARCHAR(500),
    is_deleted_from_storage BOOLEAN DEFAULT FALSE NOT NULL,
    vendor_name VARCHAR(255),
    invoice_number VARCHAR(100),
    invoice_date VARCHAR(50),
    total_amount DOUBLE PRECISION DEFAULT 0.0,
    confidence_score DOUBLE PRECISION DEFAULT 1.0,
    status VARCHAR(50) DEFAULT 'completed', -- 'verified', 'warning', 'failed'
    extracted_data_json TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_documents_tenant ON documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_documents_created ON documents(created_at DESC);

-- 4. Parsing Jobs Table (Asynchronous Celery Queue Jobs)
CREATE TABLE IF NOT EXISTS parsing_jobs (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id VARCHAR(64) REFERENCES documents(id) ON DELETE SET NULL,
    file_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'queued' NOT NULL, -- 'queued', 'processing', 'completed', 'failed'
    progress INT DEFAULT 0 NOT NULL,
    error_message TEXT,
    result_data TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_tenant ON parsing_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON parsing_jobs(status);

-- 5. Parsing Logs Table (Token Consumption & Cost Logger)
CREATE TABLE IF NOT EXISTS parsing_logs (
    id VARCHAR(64) PRIMARY KEY DEFAULT uuid_generate_v4()::text,
    tenant_id VARCHAR(64) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id VARCHAR(64) REFERENCES documents(id) ON DELETE SET NULL,
    job_id VARCHAR(64) REFERENCES parsing_jobs(id) ON DELETE SET NULL,
    model_used VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    fallback_triggered BOOLEAN DEFAULT FALSE NOT NULL,
    input_tokens INT DEFAULT 0 NOT NULL,
    output_tokens INT DEFAULT 0 NOT NULL,
    total_cost_usd DOUBLE PRECISION DEFAULT 0.0 NOT NULL,
    latency_ms INT DEFAULT 0 NOT NULL,
    ocr_used BOOLEAN DEFAULT FALSE NOT NULL,
    math_audit_passed BOOLEAN DEFAULT TRUE NOT NULL,
    confidence_score DOUBLE PRECISION DEFAULT 1.0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parsing_logs_tenant ON parsing_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_parsing_logs_job ON parsing_logs(job_id);

-- 6. Processed Webhook Events Table (Stripe Idempotency Protection)
CREATE TABLE IF NOT EXISTS processed_webhook_events (
    event_id VARCHAR(100) PRIMARY KEY,
    event_type VARCHAR(100) NOT NULL,
    tenant_id VARCHAR(100),
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'succeeded'
);

CREATE INDEX IF NOT EXISTS idx_webhook_tenant ON processed_webhook_events(tenant_id);

-- ========================================================================
-- Row-Level Security (RLS) Enforcement
-- ========================================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsing_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE parsing_logs ENABLE ROW LEVEL SECURITY;

-- 1. Tenants RLS Policy
CREATE POLICY "Tenants isolate data by id" ON tenants
    FOR ALL
    USING (id = current_setting('request.jwt.claim.tenant_id', true));

-- 2. Users RLS Policy
CREATE POLICY "Users isolate data by tenant_id" ON users
    FOR ALL
    USING (tenant_id = current_setting('request.jwt.claim.tenant_id', true));

-- 3. Documents RLS Policy
CREATE POLICY "Documents isolate data by tenant_id" ON documents
    FOR ALL
    USING (tenant_id = current_setting('request.jwt.claim.tenant_id', true));

-- 4. Parsing Jobs RLS Policy
CREATE POLICY "Jobs isolate data by tenant_id" ON parsing_jobs
    FOR ALL
    USING (tenant_id = current_setting('request.jwt.claim.tenant_id', true));

-- 5. Parsing Logs RLS Policy
CREATE POLICY "Logs isolate data by tenant_id" ON parsing_logs
    FOR ALL
    USING (tenant_id = current_setting('request.jwt.claim.tenant_id', true));
