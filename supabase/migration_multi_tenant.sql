-- Multi-tenant migration v2: Fix RLS policies
-- Run this in Supabase SQL Editor

-- 1. Add user_id columns (ignore if already exists)
DO $$ BEGIN
  ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE command_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null;
END $$;
DO $$ BEGIN
  ALTER TABLE device_pins ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_column THEN null;
END $$;

-- 2. Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  cloud_id text,
  api_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Helper function: get current user's cloud_id
CREATE OR REPLACE FUNCTION get_user_cloud_id()
RETURNS text AS $$
  SELECT cloud_id FROM user_settings WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ============================================================
-- 4. ENABLE RLS + DROP OLD POLICIES (safe to re-run)
-- ============================================================

-- user_settings
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

CREATE POLICY "Users can read own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Service role can insert users" ON users;
DROP POLICY IF EXISTS "Service role can update users" ON users;
DROP POLICY IF EXISTS "Users can delete own data" ON users;

CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (cloud_id = get_user_cloud_id());
CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update users" ON users
  FOR UPDATE USING (true);
CREATE POLICY "Users can delete own data" ON users
  FOR DELETE USING (cloud_id = get_user_cloud_id());

-- attendance_logs
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own attendance" ON attendance_logs;
DROP POLICY IF EXISTS "Service role can insert attendance" ON attendance_logs;

CREATE POLICY "Users can read own attendance" ON attendance_logs
  FOR SELECT USING (cloud_id = get_user_cloud_id());
CREATE POLICY "Service role can insert attendance" ON attendance_logs
  FOR INSERT WITH CHECK (true);

-- api_logs
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own api_logs" ON api_logs;
DROP POLICY IF EXISTS "Service role can insert api_logs" ON api_logs;
DROP POLICY IF EXISTS "Service role can update api_logs" ON api_logs;

CREATE POLICY "Users can read own api_logs" ON api_logs
  FOR SELECT USING (cloud_id = get_user_cloud_id());
CREATE POLICY "Service role can insert api_logs" ON api_logs
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update api_logs" ON api_logs
  FOR UPDATE USING (true);

-- command_logs
ALTER TABLE command_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own command_logs" ON command_logs;
DROP POLICY IF EXISTS "Service role can insert command_logs" ON command_logs;

CREATE POLICY "Users can read own command_logs" ON command_logs
  FOR SELECT USING (cloud_id = get_user_cloud_id());
CREATE POLICY "Service role can insert command_logs" ON command_logs
  FOR INSERT WITH CHECK (true);

-- webhook_logs
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own webhook_logs" ON webhook_logs;
DROP POLICY IF EXISTS "Service role can insert webhook_logs" ON webhook_logs;

CREATE POLICY "Users can read own webhook_logs" ON webhook_logs
  FOR SELECT USING (cloud_id = get_user_cloud_id());
CREATE POLICY "Service role can insert webhook_logs" ON webhook_logs
  FOR INSERT WITH CHECK (true);

-- device_pins
ALTER TABLE device_pins ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own device_pins" ON device_pins;
DROP POLICY IF EXISTS "Service role can upsert device_pins" ON device_pins;
DROP POLICY IF EXISTS "Service role can update device_pins" ON device_pins;

CREATE POLICY "Users can read own device_pins" ON device_pins
  FOR SELECT USING (cloud_id = get_user_cloud_id());
CREATE POLICY "Service role can upsert device_pins" ON device_pins
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can update device_pins" ON device_pins
  FOR UPDATE USING (true);

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_users_cloud_id ON users(cloud_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_cloud_id ON attendance_logs(cloud_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_cloud_id ON api_logs(cloud_id);
CREATE INDEX IF NOT EXISTS idx_command_logs_cloud_id ON command_logs(cloud_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_cloud_id ON webhook_logs(cloud_id);
CREATE INDEX IF NOT EXISTS idx_device_pins_cloud_id ON device_pins(cloud_id);
