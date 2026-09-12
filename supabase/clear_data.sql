-- ============================================================
-- BABI-SAVINGS: DATA REMOVAL & RESET SCRIPTS FOR SUPABASE
-- ============================================================
-- Execute these queries in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/_/sql/new
-- ============================================================

-- ------------------------------------------------------------
-- OPTION 1: CLEAR TRANSACTIONAL & LOGGED DATA ONLY (RECOMMENDED)
-- Keeps your Users, Goal definitions, and Budget categories intact,
-- but wipes all logged transactions, settlements, and resets goal balances to 0.
-- ------------------------------------------------------------

BEGIN;

-- 1. Wipe all transactions (expenses, incomes, savings transfers, settlements)
TRUNCATE TABLE transactions CASCADE;

-- 2. Wipe all settlement history logs
TRUNCATE TABLE settlements CASCADE;

-- 3. Reset Goal balances & contributions back to zero (keeps goal targets & titles)
UPDATE goals 
SET 
  current_amount = 0,
  partner_a_contribution = 0,
  partner_b_contribution = 0;

-- 4. Reset Budget spent amounts back to zero (keeps monthly limits & categories)
UPDATE budgets
SET
  spent_amount = 0,
  rollover_accumulated = 0;

COMMIT;


-- ------------------------------------------------------------
-- OPTION 2: FULL DATA WIPE (FRESH START)
-- Deletes all transactions, settlements, goals, budgets, and recurring bills.
-- Keeps default User profiles and app_settings.
-- ------------------------------------------------------------
/*
BEGIN;

TRUNCATE TABLE transactions CASCADE;
TRUNCATE TABLE settlements CASCADE;
TRUNCATE TABLE goals CASCADE;
TRUNCATE TABLE budgets CASCADE;
TRUNCATE TABLE recurring CASCADE;

-- Optional: Reset shared income back to default
UPDATE app_settings 
SET value = '{"combinedTotalIncome": 0}'
WHERE key = 'shared_income';

COMMIT;
*/


-- ------------------------------------------------------------
-- OPTION 3: SELECTIVE DELETIONS (RUN INDIVIDUALLY AS NEEDED)
-- ------------------------------------------------------------

-- A. Delete only test transactions before a specific date:
-- DELETE FROM transactions WHERE date < '2026-09-01';

-- B. Delete only transactions logged by a specific partner:
-- DELETE FROM transactions WHERE paid_by = 'partner_a';

-- C. Delete only settlements:
-- TRUNCATE TABLE settlements;

-- D. Delete all recurring bills:
-- TRUNCATE TABLE recurring;

-- E. Delete all goals completely:
-- TRUNCATE TABLE goals;

-- F. Delete all custom budget categories:
-- TRUNCATE TABLE budgets;


-- ------------------------------------------------------------
-- OPTION 4: COMPLETE TEARDOWN (DROP ALL TABLES)
-- Use this if you want to completely erase the database schema
-- and re-run schema.sql from scratch.
-- ------------------------------------------------------------
/*
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS settlements CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS budgets CASCADE;
DROP TABLE IF EXISTS recurring CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS users CASCADE;
*/
