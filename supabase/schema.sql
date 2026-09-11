-- Babi-Savings Database Schema for Supabase (PostgreSQL)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  partner_key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  nickname TEXT,
  email TEXT NOT NULL,
  avatar_url TEXT,
  theme_accent TEXT DEFAULT '#6366f1',
  has_pin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT DEFAULT 'expense',
  date TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  paid_by TEXT NOT NULL,
  split_ratio TEXT DEFAULT '50/50',
  partner_a_split_percentage NUMERIC DEFAULT 50,
  goal_id TEXT,
  is_recurring BOOLEAN DEFAULT FALSE,
  needs_approval BOOLEAN DEFAULT FALSE,
  approved_by_partner BOOLEAN DEFAULT TRUE,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Budgets Table
CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  icon TEXT NOT NULL,
  monthly_limit NUMERIC NOT NULL,
  spent_amount NUMERIC DEFAULT 0,
  rollover_enabled BOOLEAN DEFAULT TRUE,
  rollover_accumulated NUMERIC DEFAULT 0,
  alert_threshold NUMERIC DEFAULT 0.9,
  month_year TEXT
);

-- 4. Goals Table
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC DEFAULT 0,
  target_date TEXT,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  partner_a_contribution NUMERIC DEFAULT 0,
  partner_b_contribution NUMERIC DEFAULT 0,
  roundup_enabled BOOLEAN DEFAULT FALSE,
  roundup_unit NUMERIC DEFAULT 1,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Recurring Bills Table
CREATE TABLE IF NOT EXISTS recurring (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  frequency TEXT DEFAULT 'monthly',
  billing_day NUMERIC NOT NULL,
  category TEXT NOT NULL,
  paid_by TEXT NOT NULL,
  last_billed_date TEXT,
  previous_amount NUMERIC,
  last_active_date TEXT,
  status TEXT DEFAULT 'active',
  notes TEXT
);

-- 6. Settlements Table
CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  from_partner TEXT NOT NULL,
  to_partner TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'settled',
  note TEXT
);

-- 7. App Settings Table (Shared monthly income, etc.)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL
);

-- Seed default shared income setting ($7,800 or customized)
INSERT INTO app_settings (key, value)
VALUES ('shared_income', '{"combinedTotalIncome": 7800}')
ON CONFLICT (key) DO NOTHING;

-- Seed default user profiles if not present
INSERT INTO users (id, partner_key, name, nickname, email, theme_accent)
VALUES
  ('user_a', 'partner_a', 'Partner A', '', 'hanzangelobernabe212@gmail.com', '#6366f1'),
  ('user_b', 'partner_b', 'Partner B', '', 'causon.julia@gmail.com', '#0d9488')
ON CONFLICT (partner_key) DO NOTHING;
