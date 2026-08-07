-- Multi-tenant migration: Add user_id columns + RLS policies
-- Run this in Supabase SQL Editor

-- 1. Add user_id column to all data tables
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE api_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE command_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE webhook_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE device_pins ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Create user_settings table (per-user cloud_id and api_key)
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  cloud_id text,
  api_key text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE command_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_pins ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for user_settings
CREATE POLICY "Users can read own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- 5. Helper function: get current user's cloud_id
CREATE OR REPLACE FUNCTION get_user_cloud_id()
RETURNS text AS $$
  SELECT cloud_id FROM user_settings WHERE user_id = auth.uid() LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- 6. RLS Policies for users table
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can insert users" ON users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update users" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete own data" ON users
  FOR DELETE USING (user_id = auth.uid());

-- 7. RLS Policies for attendance_logs
CREATE POLICY "Users can read own attendance" ON attendance_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can insert attendance" ON attendance_logs
  FOR INSERT WITH CHECK (true);

-- 8. RLS Policies for api_logs
CREATE POLICY "Users can read own api_logs" ON api_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can insert api_logs" ON api_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update api_logs" ON api_logs
  FOR UPDATE USING (true);

-- 9. RLS Policies for command_logs
CREATE POLICY "Users can read own command_logs" ON command_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can insert command_logs" ON command_logs
  FOR INSERT WITH CHECK (true);

-- 10. RLS Policies for webhook_logs
CREATE POLICY "Users can read own webhook_logs" ON webhook_logs
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can insert webhook_logs" ON webhook_logs
  FOR INSERT WITH CHECK (true);

-- 11. RLS Policies for device_pins
CREATE POLICY "Users can read own device_pins" ON device_pins
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can upsert device_pins" ON device_pins
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can update device_pins" ON device_pins
  FOR UPDATE USING (true);

-- 12. Create index for performance
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_logs_user_id ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_command_logs_user_id ON command_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_user_id ON webhook_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_device_pins_user_id ON device_pins(user_id);
