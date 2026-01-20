-- Harmonic Match Database Schema
-- Initial migration for all core tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

-- Conflict resolution styles based on Thomas-Kilmann model
CREATE TYPE conflict_style AS ENUM (
  'competing',
  'collaborating',
  'compromising',
  'avoiding',
  'accommodating'
);

-- Music personality types based on listening patterns
CREATE TYPE music_personality_type AS ENUM (
  'explorer',      -- Always seeking new music
  'loyalist',      -- Sticks to favorites
  'eclectic',      -- Wide variety of genres
  'mood_matcher',  -- Listens based on mood
  'social_listener' -- Follows trends/friends
);

-- Personality framework types
CREATE TYPE personality_framework AS ENUM (
  'big_five',
  'mbti',
  'attachment_style',
  'love_language'
);

-- Gender options
CREATE TYPE gender_type AS ENUM (
  'male',
  'female',
  'non_binary',
  'other',
  'prefer_not_to_say'
);

-- ============================================================================
-- USER PROFILES TABLE
-- ============================================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  age INTEGER CHECK (age >= 18 AND age <= 120),
  gender gender_type,
  location TEXT,
  bio TEXT CHECK (char_length(bio) <= 500),
  photos_json JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_user_profile UNIQUE (user_id)
);

-- Index for faster lookups by user_id
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

-- ============================================================================
-- MUSIC PROFILES TABLE
-- ============================================================================

CREATE TABLE music_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  spotify_connected BOOLEAN NOT NULL DEFAULT FALSE,
  spotify_user_id TEXT,
  top_artists_json JSONB DEFAULT '[]'::jsonb,
  top_genres_json JSONB DEFAULT '[]'::jsonb,
  audio_features_avg_json JSONB DEFAULT '{}'::jsonb,
  music_personality music_personality_type,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_music_profile UNIQUE (user_id)
);

-- Index for faster lookups
CREATE INDEX idx_music_profiles_user_id ON music_profiles(user_id);
CREATE INDEX idx_music_profiles_spotify_connected ON music_profiles(spotify_connected);

-- ============================================================================
-- CONFLICT STYLES TABLE
-- ============================================================================

CREATE TABLE conflict_styles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  primary_style conflict_style NOT NULL,
  secondary_style conflict_style,
  assessment_json JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_conflict_style UNIQUE (user_id),
  CONSTRAINT different_styles CHECK (primary_style != secondary_style OR secondary_style IS NULL)
);

-- Index for faster lookups
CREATE INDEX idx_conflict_styles_user_id ON conflict_styles(user_id);

-- ============================================================================
-- PERSONALITY ASSESSMENTS TABLE
-- ============================================================================

CREATE TABLE personality_assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  framework personality_framework NOT NULL,
  scores_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Allow multiple frameworks per user but only one of each type
  CONSTRAINT unique_user_framework UNIQUE (user_id, framework)
);

-- Indexes for faster lookups
CREATE INDEX idx_personality_assessments_user_id ON personality_assessments(user_id);
CREATE INDEX idx_personality_assessments_framework ON personality_assessments(framework);

-- ============================================================================
-- COMPATIBILITY SCORES TABLE
-- ============================================================================

CREATE TABLE compatibility_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  music_score DECIMAL(5,2) CHECK (music_score >= 0 AND music_score <= 100),
  conflict_score DECIMAL(5,2) CHECK (conflict_score >= 0 AND conflict_score <= 100),
  personality_score DECIMAL(5,2) CHECK (personality_score >= 0 AND personality_score <= 100),
  overall_score DECIMAL(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure user1_id < user2_id to prevent duplicate pairs
  CONSTRAINT user_order CHECK (user1_id < user2_id),
  CONSTRAINT unique_compatibility_pair UNIQUE (user1_id, user2_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_compatibility_scores_user1 ON compatibility_scores(user1_id);
CREATE INDEX idx_compatibility_scores_user2 ON compatibility_scores(user2_id);
CREATE INDEX idx_compatibility_scores_overall ON compatibility_scores(overall_score DESC);

-- ============================================================================
-- MATCHES TABLE
-- ============================================================================

CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user1_liked BOOLEAN NOT NULL DEFAULT FALSE,
  user2_liked BOOLEAN NOT NULL DEFAULT FALSE,
  matched_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure user1_id < user2_id to prevent duplicate pairs
  CONSTRAINT matches_user_order CHECK (user1_id < user2_id),
  CONSTRAINT unique_match_pair UNIQUE (user1_id, user2_id)
);

-- Indexes for faster lookups
CREATE INDEX idx_matches_user1 ON matches(user1_id);
CREATE INDEX idx_matches_user2 ON matches(user2_id);
CREATE INDEX idx_matches_matched ON matches(matched_at) WHERE matched_at IS NOT NULL;

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_match_conversation UNIQUE (match_id)
);

-- Index for faster lookups
CREATE INDEX idx_conversations_match_id ON conversations(match_id);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  song_share_json JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================================================
-- SHARED PLAYLISTS TABLE
-- ============================================================================

CREATE TABLE shared_playlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  spotify_playlist_id TEXT NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX idx_shared_playlists_match_id ON shared_playlists(match_id);

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_music_profiles_updated_at
  BEFORE UPDATE ON music_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conflict_styles_updated_at
  BEFORE UPDATE ON conflict_styles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- MATCH TRIGGER - Auto-set matched_at when both users like
-- ============================================================================

CREATE OR REPLACE FUNCTION check_mutual_match()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user1_liked = TRUE AND NEW.user2_liked = TRUE AND NEW.matched_at IS NULL THEN
    NEW.matched_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_check_mutual_match
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION check_mutual_match();
