-- ==============================================================================
-- SolGit Supabase Schema Migration
-- Project: mfdyorztvcibwzhnqmsi
-- Created: 2026-10-30
-- Description: Creates users and repositories tables with Row Level Security (RLS)
-- ==============================================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
    address TEXT PRIMARY KEY,
    nickname TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Repositories Table
CREATE TABLE IF NOT EXISTS public.repositories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_address TEXT NOT NULL,
    owner_nickname TEXT NOT NULL,
    description TEXT DEFAULT '',
    contract_address TEXT NOT NULL,
    tx_hash TEXT DEFAULT '',
    sol_code TEXT NOT NULL,
    facet_count INTEGER DEFAULT 1,
    guardian_active BOOLEAN DEFAULT TRUE,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_users_address_lower ON public.users (LOWER(address));
CREATE INDEX IF NOT EXISTS idx_repos_owner_lower ON public.repositories (LOWER(owner_address));

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.repositories ENABLE ROW LEVEL SECURITY;

-- 5. Policies allowing public read and write access for SolGit platform
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public read access on users') THEN
        CREATE POLICY "Allow public read access on users" ON public.users FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Allow public insert/update on users') THEN
        CREATE POLICY "Allow public insert/update on users" ON public.users FOR ALL USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'repositories' AND policyname = 'Allow public read access on repositories') THEN
        CREATE POLICY "Allow public read access on repositories" ON public.repositories FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'repositories' AND policyname = 'Allow public insert/update on repositories') THEN
        CREATE POLICY "Allow public insert/update on repositories" ON public.repositories FOR ALL USING (true);
    END IF;
END $$;

