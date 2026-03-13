-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Tests table
CREATE TABLE IF NOT EXISTS public.api_tests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  test_status TEXT CHECK (test_status IN ('success', 'failed', 'pending')) DEFAULT 'pending',
  response_time INTEGER,
  response_body TEXT,
  response_status INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test History table
CREATE TABLE IF NOT EXISTS public.test_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  test_id UUID NOT NULL REFERENCES public.api_tests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  request_params JSONB,
  request_headers JSONB,
  request_method TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- API Documentation table
CREATE TABLE IF NOT EXISTS public.api_documentation (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT NOT NULL UNIQUE,
  documentation_url TEXT,
  endpoints JSONB,
  auth_methods JSONB,
  last_scanned TIMESTAMPTZ
);

-- Unified runtime history table (used by frontend code)
CREATE TABLE IF NOT EXISTS public.api_test_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  test_name TEXT,
  url TEXT NOT NULL,
  method TEXT NOT NULL,
  headers JSONB,
  body TEXT,
  auth_type TEXT,
  auth_token TEXT,
  status_code INTEGER,
  response_data JSONB,
  response_time INTEGER,
  error_message TEXT,
  test_status TEXT CHECK (test_status IN ('success', 'error', 'pending')) DEFAULT 'pending',
  ai_provider TEXT CHECK (ai_provider IN ('gemini', 'huggingface')),
  ai_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Favorites table (used by frontend code)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL,
  headers JSONB,
  body TEXT,
  auth_type TEXT,
  auth_token TEXT,
  ai_provider TEXT CHECK (ai_provider IN ('gemini', 'huggingface')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, url, method)
);


-- Monitoring configs for scheduled checks
CREATE TABLE IF NOT EXISTS public.monitor_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  method TEXT NOT NULL DEFAULT 'GET',
  headers JSONB,
  body TEXT,
  interval_minutes INTEGER NOT NULL DEFAULT 1440 CHECK (interval_minutes >= 1),
  expected_status INTEGER NOT NULL DEFAULT 200,
  sla_target NUMERIC(5,2) NOT NULL DEFAULT 99.90,
  alert_on_failure BOOLEAN NOT NULL DEFAULT true,
  active BOOLEAN NOT NULL DEFAULT true,
  next_run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_run_at TIMESTAMPTZ,
  consecutive_failures INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monitoring execution history
CREATE TABLE IF NOT EXISTS public.monitor_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  monitor_id UUID NOT NULL REFERENCES public.monitor_configs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status_code INTEGER,
  response_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert channels (Slack/Telegram/Email)
CREATE TABLE IF NOT EXISTS public.alert_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('slack', 'telegram', 'email')),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_tests_user_id ON public.api_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tests_created_at ON public.api_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_history_test_id ON public.test_history(test_id);
CREATE INDEX IF NOT EXISTS idx_test_history_user_id ON public.test_history(user_id);
CREATE INDEX IF NOT EXISTS idx_api_test_history_user_id ON public.api_test_history(user_id);
CREATE INDEX IF NOT EXISTS idx_api_test_history_created_at ON public.api_test_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_monitor_configs_user_id ON public.monitor_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_monitor_configs_next_run_at ON public.monitor_configs(next_run_at) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_monitor_runs_monitor_id ON public.monitor_runs(monitor_id);
CREATE INDEX IF NOT EXISTS idx_monitor_runs_user_id ON public.monitor_runs(user_id);
CREATE INDEX IF NOT EXISTS idx_monitor_runs_executed_at ON public.monitor_runs(executed_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_channels_user_id ON public.alert_channels(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_documentation ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_test_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monitor_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_channels ENABLE ROW LEVEL SECURITY;

-- Users policies (optimized with select auth.uid())
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can view own tests" ON public.api_tests;
DROP POLICY IF EXISTS "Users can create own tests" ON public.api_tests;
DROP POLICY IF EXISTS "Users can update own tests" ON public.api_tests;
DROP POLICY IF EXISTS "Users can delete own tests" ON public.api_tests;
DROP POLICY IF EXISTS "Users can view own test history" ON public.test_history;
DROP POLICY IF EXISTS "Users can create own test history" ON public.test_history;
DROP POLICY IF EXISTS "Anyone can view API documentation" ON public.api_documentation;
DROP POLICY IF EXISTS "Users can view own api test history" ON public.api_test_history;
DROP POLICY IF EXISTS "Users can create own api test history" ON public.api_test_history;
DROP POLICY IF EXISTS "Users can update own api test history" ON public.api_test_history;
DROP POLICY IF EXISTS "Users can delete own api test history" ON public.api_test_history;
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can create own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can update own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can view own monitor configs" ON public.monitor_configs;
DROP POLICY IF EXISTS "Users can create own monitor configs" ON public.monitor_configs;
DROP POLICY IF EXISTS "Users can update own monitor configs" ON public.monitor_configs;
DROP POLICY IF EXISTS "Users can delete own monitor configs" ON public.monitor_configs;
DROP POLICY IF EXISTS "Users can view own monitor runs" ON public.monitor_runs;
DROP POLICY IF EXISTS "System can create monitor runs" ON public.monitor_runs;
DROP POLICY IF EXISTS "Users can view own alert channels" ON public.alert_channels;
DROP POLICY IF EXISTS "Users can create own alert channels" ON public.alert_channels;
DROP POLICY IF EXISTS "Users can update own alert channels" ON public.alert_channels;
DROP POLICY IF EXISTS "Users can delete own alert channels" ON public.alert_channels;
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING ((select auth.uid()) = id);

-- API Tests policies (optimized with select auth.uid())
CREATE POLICY "Users can view own tests" ON public.api_tests
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own tests" ON public.api_tests
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own tests" ON public.api_tests
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own tests" ON public.api_tests
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Test History policies (optimized with select auth.uid())
CREATE POLICY "Users can view own test history" ON public.test_history
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own test history" ON public.test_history
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- API Documentation policies (public read, admin write)
CREATE POLICY "Anyone can view API documentation" ON public.api_documentation
  FOR SELECT USING (true);

-- API test history policies
CREATE POLICY "Users can view own api test history" ON public.api_test_history
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own api test history" ON public.api_test_history
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own api test history" ON public.api_test_history
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own api test history" ON public.api_test_history
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Favorites policies
CREATE POLICY "Users can view own favorites" ON public.favorites
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own favorites" ON public.favorites
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own favorites" ON public.favorites
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own favorites" ON public.favorites
  FOR DELETE USING ((select auth.uid()) = user_id);


-- Monitoring configs policies
CREATE POLICY "Users can view own monitor configs" ON public.monitor_configs
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own monitor configs" ON public.monitor_configs
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own monitor configs" ON public.monitor_configs
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own monitor configs" ON public.monitor_configs
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Monitoring runs policies
CREATE POLICY "Users can view own monitor runs" ON public.monitor_runs
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "System can create monitor runs" ON public.monitor_runs
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

-- Alert channels policies
CREATE POLICY "Users can view own alert channels" ON public.alert_channels
  FOR SELECT USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can create own alert channels" ON public.alert_channels
  FOR INSERT WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update own alert channels" ON public.alert_channels
  FOR UPDATE USING ((select auth.uid()) = user_id);

CREATE POLICY "Users can delete own alert channels" ON public.alert_channels
  FOR DELETE USING ((select auth.uid()) = user_id);

-- Function to automatically create user profile on signup (with search_path for security)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth;

-- Trigger to create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp (with search_path for security)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_tests_updated_at ON public.api_tests;
CREATE TRIGGER update_api_tests_updated_at BEFORE UPDATE ON public.api_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_test_history_updated_at ON public.api_test_history;
CREATE TRIGGER update_api_test_history_updated_at BEFORE UPDATE ON public.api_test_history
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_monitor_configs_updated_at ON public.monitor_configs;
CREATE TRIGGER update_monitor_configs_updated_at BEFORE UPDATE ON public.monitor_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_alert_channels_updated_at ON public.alert_channels;
CREATE TRIGGER update_alert_channels_updated_at BEFORE UPDATE ON public.alert_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
