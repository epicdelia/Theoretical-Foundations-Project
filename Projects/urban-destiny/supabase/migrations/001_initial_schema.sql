-- Urban Destiny Database Schema
-- Migration: 001_initial_schema
-- Description: Complete database schema for user assessments and city data

-- ============================================================================
-- CITIES TABLE
-- ============================================================================
-- Core city data with various indexes for matching
CREATE TABLE cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  population INTEGER NOT NULL,
  cost_index DECIMAL(5,2) NOT NULL, -- 0-100 scale
  career_score DECIMAL(5,2) NOT NULL, -- 0-100 scale
  lifestyle_score DECIMAL(5,2) NOT NULL, -- 0-100 scale
  happiness_index DECIMAL(5,2) NOT NULL, -- 0-100 scale
  climate TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT cities_name_country_unique UNIQUE (name, country),
  CONSTRAINT cities_cost_index_range CHECK (cost_index >= 0 AND cost_index <= 100),
  CONSTRAINT cities_career_score_range CHECK (career_score >= 0 AND career_score <= 100),
  CONSTRAINT cities_lifestyle_score_range CHECK (lifestyle_score >= 0 AND lifestyle_score <= 100),
  CONSTRAINT cities_happiness_index_range CHECK (happiness_index >= 0 AND happiness_index <= 100)
);

CREATE INDEX idx_cities_country ON cities(country);
CREATE INDEX idx_cities_cost_index ON cities(cost_index);
CREATE INDEX idx_cities_career_score ON cities(career_score);
CREATE INDEX idx_cities_lifestyle_score ON cities(lifestyle_score);
CREATE INDEX idx_cities_happiness_index ON cities(happiness_index);

-- ============================================================================
-- CITY_METRICS TABLE
-- ============================================================================
-- Detailed metrics for each city with historical tracking
CREATE TABLE city_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  metric_type TEXT NOT NULL,
  value DECIMAL(10,2) NOT NULL,
  year INTEGER NOT NULL,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT city_metrics_year_range CHECK (year >= 1900 AND year <= 2100)
);

CREATE INDEX idx_city_metrics_city_id ON city_metrics(city_id);
CREATE INDEX idx_city_metrics_type ON city_metrics(metric_type);
CREATE INDEX idx_city_metrics_year ON city_metrics(year);

-- ============================================================================
-- ASSESSMENT_CATEGORIES TABLE
-- ============================================================================
-- Categories for assessment questions (career, lifestyle, cost, happiness)
CREATE TABLE assessment_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT assessment_categories_name_check CHECK (name IN ('career', 'lifestyle', 'cost', 'happiness'))
);

CREATE INDEX idx_assessment_categories_name ON assessment_categories(name);

-- ============================================================================
-- ASSESSMENT_QUESTIONS TABLE
-- ============================================================================
-- Questions for each assessment category
CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES assessment_categories(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_order INTEGER NOT NULL DEFAULT 0,
  min_label TEXT NOT NULL DEFAULT 'Strongly Disagree',
  max_label TEXT NOT NULL DEFAULT 'Strongly Agree',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_assessment_questions_category ON assessment_questions(category_id);

-- ============================================================================
-- USER_PROFILES TABLE
-- ============================================================================
-- User profile data linked to Supabase auth
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_city TEXT,
  assessment_complete BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_assessment_complete ON user_profiles(assessment_complete);

-- ============================================================================
-- ASSESSMENT_RESPONSES TABLE
-- ============================================================================
-- User responses to assessment questions
CREATE TABLE assessment_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  question_id UUID NOT NULL REFERENCES assessment_questions(id) ON DELETE CASCADE,
  answer_value INTEGER NOT NULL,
  weight DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT assessment_responses_answer_range CHECK (answer_value >= 1 AND answer_value <= 5),
  CONSTRAINT assessment_responses_weight_range CHECK (weight >= 0 AND weight <= 1),
  CONSTRAINT assessment_responses_user_question_unique UNIQUE (user_id, question_id)
);

CREATE INDEX idx_assessment_responses_user_id ON assessment_responses(user_id);
CREATE INDEX idx_assessment_responses_category ON assessment_responses(category);
CREATE INDEX idx_assessment_responses_question_id ON assessment_responses(question_id);

-- ============================================================================
-- CITY_MATCHES TABLE
-- ============================================================================
-- Computed city matches for users based on assessment
CREATE TABLE city_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  overall_score DECIMAL(5,2) NOT NULL,
  dimension_scores_json JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT city_matches_overall_score_range CHECK (overall_score >= 0 AND overall_score <= 100),
  CONSTRAINT city_matches_user_city_unique UNIQUE (user_id, city_id)
);

CREATE INDEX idx_city_matches_user_id ON city_matches(user_id);
CREATE INDEX idx_city_matches_city_id ON city_matches(city_id);
CREATE INDEX idx_city_matches_overall_score ON city_matches(overall_score DESC);

-- ============================================================================
-- SAVED_CITIES TABLE
-- ============================================================================
-- Cities saved/bookmarked by users
CREATE TABLE saved_cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES cities(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT saved_cities_user_city_unique UNIQUE (user_id, city_id)
);

CREATE INDEX idx_saved_cities_user_id ON saved_cities(user_id);
CREATE INDEX idx_saved_cities_city_id ON saved_cities(city_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_cities ENABLE ROW LEVEL SECURITY;

-- Cities: Public read access
CREATE POLICY "cities_select_policy" ON cities
  FOR SELECT USING (true);

-- City Metrics: Public read access
CREATE POLICY "city_metrics_select_policy" ON city_metrics
  FOR SELECT USING (true);

-- Assessment Categories: Public read access
CREATE POLICY "assessment_categories_select_policy" ON assessment_categories
  FOR SELECT USING (true);

-- Assessment Questions: Public read access
CREATE POLICY "assessment_questions_select_policy" ON assessment_questions
  FOR SELECT USING (true);

-- User Profiles: Users can only access their own profile
CREATE POLICY "user_profiles_select_policy" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_insert_policy" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_profiles_update_policy" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_profiles_delete_policy" ON user_profiles
  FOR DELETE USING (auth.uid() = user_id);

-- Assessment Responses: Users can only access their own responses
CREATE POLICY "assessment_responses_select_policy" ON assessment_responses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "assessment_responses_insert_policy" ON assessment_responses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "assessment_responses_update_policy" ON assessment_responses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "assessment_responses_delete_policy" ON assessment_responses
  FOR DELETE USING (auth.uid() = user_id);

-- City Matches: Users can only access their own matches
CREATE POLICY "city_matches_select_policy" ON city_matches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "city_matches_insert_policy" ON city_matches
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "city_matches_update_policy" ON city_matches
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "city_matches_delete_policy" ON city_matches
  FOR DELETE USING (auth.uid() = user_id);

-- Saved Cities: Users can only access their own saved cities
CREATE POLICY "saved_cities_select_policy" ON saved_cities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "saved_cities_insert_policy" ON saved_cities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "saved_cities_update_policy" ON saved_cities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "saved_cities_delete_policy" ON saved_cities
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_cities_updated_at
  BEFORE UPDATE ON cities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assessment_responses_updated_at
  BEFORE UPDATE ON assessment_responses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
