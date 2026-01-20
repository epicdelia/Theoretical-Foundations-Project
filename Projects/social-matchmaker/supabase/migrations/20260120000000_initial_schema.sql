-- Social Matchmaker Database Schema
-- Migration: Initial schema setup

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE friend_status AS ENUM ('pending', 'accepted', 'blocked');
CREATE TYPE proposal_status AS ENUM ('pending', 'accepted', 'rejected', 'expired');
CREATE TYPE relationship_status AS ENUM ('dating', 'engaged', 'married', 'broken_up');
CREATE TYPE bet_status AS ENUM ('pending', 'active', 'won', 'lost', 'cancelled', 'refunded');
CREATE TYPE payout_type AS ENUM ('bet_win', 'matchmaker_bonus', 'milestone_bonus', 'refund');
CREATE TYPE milestone_type AS ENUM ('first_date', 'one_month', 'three_months', 'six_months', 'one_year', 'engaged', 'married');
CREATE TYPE notification_type AS ENUM (
  'friend_request',
  'friend_accepted',
  'match_proposal',
  'match_accepted',
  'match_rejected',
  'bet_placed',
  'bet_won',
  'bet_lost',
  'milestone_reached',
  'payout_processed'
);

-- ============================================
-- TABLES
-- ============================================

-- User Profiles
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  matchmaker_score INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  matches_made INTEGER NOT NULL DEFAULT 0,
  successful_matches INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Friend Connections
CREATE TABLE friend_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  friend_user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  status friend_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_friend_connection UNIQUE (user_id, friend_user_id),
  CONSTRAINT no_self_friend CHECK (user_id != friend_user_id)
);

-- Match Proposals
CREATE TABLE match_proposals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  matchmaker_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  person1_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  person2_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  pitch_text TEXT NOT NULL,
  status proposal_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  CONSTRAINT different_people CHECK (person1_id != person2_id),
  CONSTRAINT matchmaker_not_matched CHECK (matchmaker_id != person1_id AND matchmaker_id != person2_id)
);

-- Matches (created when both people accept a proposal)
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proposal_id UUID NOT NULL UNIQUE REFERENCES match_proposals(id) ON DELETE CASCADE,
  person1_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  person2_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  started_dating_at TIMESTAMPTZ,
  relationship_status relationship_status,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Bets
CREATE TABLE bets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  bettor_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  predicted_duration_months INTEGER NOT NULL CHECK (predicted_duration_months > 0),
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  payout_multiplier DECIMAL(5, 2) NOT NULL CHECK (payout_multiplier > 0),
  status bet_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Payouts
CREATE TABLE payouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bet_id UUID REFERENCES bets(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount > 0),
  type payout_type NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Milestones
CREATE TABLE milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  milestone_type milestone_type NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_milestone UNIQUE (match_id, milestone_type)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Wallet
CREATE TABLE wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (balance >= 0),
  pending_balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00 CHECK (pending_balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_friend_connections_user_id ON friend_connections(user_id);
CREATE INDEX idx_friend_connections_friend_user_id ON friend_connections(friend_user_id);
CREATE INDEX idx_friend_connections_status ON friend_connections(status);
CREATE INDEX idx_match_proposals_matchmaker_id ON match_proposals(matchmaker_id);
CREATE INDEX idx_match_proposals_person1_id ON match_proposals(person1_id);
CREATE INDEX idx_match_proposals_person2_id ON match_proposals(person2_id);
CREATE INDEX idx_match_proposals_status ON match_proposals(status);
CREATE INDEX idx_matches_proposal_id ON matches(proposal_id);
CREATE INDEX idx_matches_relationship_status ON matches(relationship_status);
CREATE INDEX idx_bets_match_id ON bets(match_id);
CREATE INDEX idx_bets_bettor_id ON bets(bettor_id);
CREATE INDEX idx_bets_status ON bets(status);
CREATE INDEX idx_payouts_user_id ON payouts(user_id);
CREATE INDEX idx_payouts_bet_id ON payouts(bet_id);
CREATE INDEX idx_milestones_match_id ON milestones(match_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_wallet_user_id ON wallet(user_id);

-- ============================================
-- UPDATED_AT TRIGGER FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_friend_connections_updated_at
  BEFORE UPDATE ON friend_connections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_match_proposals_updated_at
  BEFORE UPDATE ON match_proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bets_updated_at
  BEFORE UPDATE ON bets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_wallet_updated_at
  BEFORE UPDATE ON wallet
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friend_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE bets ENABLE ROW LEVEL SECURITY;
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet ENABLE ROW LEVEL SECURITY;

-- ============================================
-- USER_PROFILES POLICIES
-- ============================================

-- Users can view all profiles (for matchmaking discovery)
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FRIEND_CONNECTIONS POLICIES
-- ============================================

-- Users can view their own friend connections
CREATE POLICY "Users can view own friend connections"
  ON friend_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_user_id);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
  ON friend_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update connections they're part of (accept/block)
CREATE POLICY "Users can update own friend connections"
  ON friend_connections FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_user_id);

-- Users can delete their own friend connections
CREATE POLICY "Users can delete own friend connections"
  ON friend_connections FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = friend_user_id);

-- ============================================
-- MATCH_PROPOSALS POLICIES
-- ============================================

-- Users can view proposals they created or are involved in
CREATE POLICY "Users can view relevant proposals"
  ON match_proposals FOR SELECT
  TO authenticated
  USING (
    auth.uid() = matchmaker_id OR
    auth.uid() = person1_id OR
    auth.uid() = person2_id
  );

-- Users can create match proposals
CREATE POLICY "Users can create proposals"
  ON match_proposals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = matchmaker_id);

-- Matchmakers can update their own proposals
CREATE POLICY "Matchmakers can update own proposals"
  ON match_proposals FOR UPDATE
  TO authenticated
  USING (auth.uid() = matchmaker_id);

-- ============================================
-- MATCHES POLICIES
-- ============================================

-- Users can view matches they're involved in or have bet on
CREATE POLICY "Users can view relevant matches"
  ON matches FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_proposals mp
      WHERE mp.id = matches.proposal_id
      AND (mp.matchmaker_id = auth.uid() OR mp.person1_id = auth.uid() OR mp.person2_id = auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM bets b
      WHERE b.match_id = matches.id AND b.bettor_id = auth.uid()
    )
  );

-- Only the matched users can update match status
CREATE POLICY "Matched users can update match"
  ON matches FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM match_proposals mp
      WHERE mp.id = matches.proposal_id
      AND (mp.person1_id = auth.uid() OR mp.person2_id = auth.uid())
    )
  );

-- System/trigger can insert matches (when proposal is accepted)
CREATE POLICY "Authenticated users can create matches"
  ON matches FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM match_proposals mp
      WHERE mp.id = proposal_id
      AND (mp.person1_id = auth.uid() OR mp.person2_id = auth.uid())
    )
  );

-- ============================================
-- BETS POLICIES
-- ============================================

-- Users can view their own bets
CREATE POLICY "Users can view own bets"
  ON bets FOR SELECT
  TO authenticated
  USING (auth.uid() = bettor_id);

-- Users can place bets
CREATE POLICY "Users can place bets"
  ON bets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = bettor_id);

-- Users cannot update bets directly (handled by system)
-- No UPDATE policy - bets are immutable once placed

-- ============================================
-- PAYOUTS POLICIES
-- ============================================

-- Users can view their own payouts
CREATE POLICY "Users can view own payouts"
  ON payouts FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Payouts are created by the system, not directly by users
-- No INSERT policy for regular users

-- ============================================
-- MILESTONES POLICIES
-- ============================================

-- Users involved in a match can view milestones
CREATE POLICY "Users can view relevant milestones"
  ON milestones FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN match_proposals mp ON mp.id = m.proposal_id
      WHERE m.id = milestones.match_id
      AND (mp.person1_id = auth.uid() OR mp.person2_id = auth.uid() OR mp.matchmaker_id = auth.uid())
    )
  );

-- Matched users can create milestones
CREATE POLICY "Matched users can create milestones"
  ON milestones FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      JOIN match_proposals mp ON mp.id = m.proposal_id
      WHERE m.id = match_id
      AND (mp.person1_id = auth.uid() OR mp.person2_id = auth.uid())
    )
  );

-- ============================================
-- NOTIFICATIONS POLICIES
-- ============================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ============================================
-- WALLET POLICIES
-- ============================================

-- Users can view their own wallet
CREATE POLICY "Users can view own wallet"
  ON wallet FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can create their own wallet
CREATE POLICY "Users can create own wallet"
  ON wallet FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Wallet updates are handled by the system
-- No direct UPDATE policy for users
