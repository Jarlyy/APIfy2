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

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_tests_user_id ON public.api_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_api_tests_created_at ON public.api_tests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_test_history_test_id ON public.test_history(test_id);
CREATE INDEX IF NOT EXISTS idx_test_history_user_id ON public.test_history(user_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_documentation ENABLE ROW LEVEL SECURITY;

-- Users policies (optimized with select auth.uid())
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
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_api_tests_updated_at BEFORE UPDATE ON public.api_tests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
