-- Heartbreak Hub Database Schema
-- Migration: Initial Schema Setup

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PATHWAYS TABLE
-- ============================================
CREATE TABLE pathways (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  duration_days INTEGER NOT NULL DEFAULT 30,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER_PROFILES TABLE
-- ============================================
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  breakup_type TEXT,
  time_since TEXT,
  pathway_id UUID REFERENCES pathways(id) ON DELETE SET NULL,
  show_days_counter BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================
-- PATHWAY_CONTENT TABLE
-- ============================================
CREATE TABLE pathway_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pathway_id UUID NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  exercise_prompt TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(pathway_id, day_number, type)
);

-- ============================================
-- COHORTS TABLE
-- ============================================
CREATE TABLE cohorts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pathway_id UUID NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  max_members INTEGER NOT NULL DEFAULT 10,
  breakup_type_match TEXT,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- COHORT_MEMBERS TABLE
-- ============================================
CREATE TABLE cohort_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  anonymous_name TEXT NOT NULL,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(cohort_id, user_id)
);

-- ============================================
-- USER_PROGRESS TABLE
-- ============================================
CREATE TABLE user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pathway_id UUID NOT NULL REFERENCES pathways(id) ON DELETE CASCADE,
  current_day INTEGER NOT NULL DEFAULT 1,
  recovery_score INTEGER NOT NULL DEFAULT 0,
  streak_count INTEGER NOT NULL DEFAULT 0,
  milestones_json JSONB DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, pathway_id)
);

-- ============================================
-- JOURNAL_ENTRIES TABLE
-- ============================================
CREATE TABLE journal_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- MILESTONES TABLE
-- ============================================
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  criteria_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- THERAPIST_DIRECTORY TABLE
-- ============================================
CREATE TABLE therapist_directory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  specialty TEXT,
  location TEXT,
  website_url TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- CONTENT_LIBRARY TABLE
-- ============================================
CREATE TABLE content_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[],
  content_url TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  pathway_id UUID REFERENCES pathways(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- ENCOURAGEMENTS TABLE
-- ============================================
CREATE TABLE encouragements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id UUID NOT NULL REFERENCES cohorts(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feed_item_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- BOOKMARKS TABLE
-- ============================================
CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content_library(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, content_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_pathway_content_pathway_id ON pathway_content(pathway_id);
CREATE INDEX idx_pathway_content_day_number ON pathway_content(day_number);
CREATE INDEX idx_cohort_members_cohort_id ON cohort_members(cohort_id);
CREATE INDEX idx_cohort_members_user_id ON cohort_members(user_id);
CREATE INDEX idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);
CREATE INDEX idx_journal_entries_created_at ON journal_entries(created_at);
CREATE INDEX idx_content_library_category ON content_library(category);
CREATE INDEX idx_encouragements_cohort_id ON encouragements(cohort_id);
CREATE INDEX idx_encouragements_to_user_id ON encouragements(to_user_id);
CREATE INDEX idx_bookmarks_user_id ON bookmarks(user_id);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE pathway_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohorts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cohort_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapist_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE encouragements ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- USER_PROFILES policies
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- PATHWAYS policies (public read, admin write)
CREATE POLICY "Anyone can view pathways"
  ON pathways FOR SELECT
  USING (true);

-- PATHWAY_CONTENT policies (public read)
CREATE POLICY "Anyone can view pathway content"
  ON pathway_content FOR SELECT
  USING (true);

-- COHORTS policies
CREATE POLICY "Anyone can view open cohorts"
  ON cohorts FOR SELECT
  USING (true);

-- COHORT_MEMBERS policies
CREATE POLICY "Users can view cohort members in their cohorts"
  ON cohort_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cohort_members cm
      WHERE cm.cohort_id = cohort_members.cohort_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join cohorts"
  ON cohort_members FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave cohorts"
  ON cohort_members FOR DELETE
  USING (auth.uid() = user_id);

-- USER_PROGRESS policies
CREATE POLICY "Users can view their own progress"
  ON user_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
  ON user_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
  ON user_progress FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own progress"
  ON user_progress FOR DELETE
  USING (auth.uid() = user_id);

-- JOURNAL_ENTRIES policies
CREATE POLICY "Users can view their own journal entries"
  ON journal_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own journal entries"
  ON journal_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own journal entries"
  ON journal_entries FOR DELETE
  USING (auth.uid() = user_id);

-- MILESTONES policies (public read)
CREATE POLICY "Anyone can view milestones"
  ON milestones FOR SELECT
  USING (true);

-- THERAPIST_DIRECTORY policies (public read)
CREATE POLICY "Anyone can view therapist directory"
  ON therapist_directory FOR SELECT
  USING (true);

-- CONTENT_LIBRARY policies (public read for non-premium, authenticated for premium)
CREATE POLICY "Anyone can view non-premium content"
  ON content_library FOR SELECT
  USING (is_premium = false OR auth.uid() IS NOT NULL);

-- ENCOURAGEMENTS policies
CREATE POLICY "Users can view encouragements in their cohorts"
  ON encouragements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM cohort_members cm
      WHERE cm.cohort_id = encouragements.cohort_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send encouragements in their cohorts"
  ON encouragements FOR INSERT
  WITH CHECK (
    auth.uid() = from_user_id
    AND EXISTS (
      SELECT 1 FROM cohort_members cm
      WHERE cm.cohort_id = encouragements.cohort_id
      AND cm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own encouragements"
  ON encouragements FOR DELETE
  USING (auth.uid() = from_user_id);

-- BOOKMARKS policies
CREATE POLICY "Users can view their own bookmarks"
  ON bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
  ON bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
