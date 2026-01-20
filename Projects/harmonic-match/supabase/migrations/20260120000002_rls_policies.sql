-- Row Level Security Policies for Harmonic Match
-- All tables should have RLS enabled to protect user data

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE music_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conflict_styles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personality_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE shared_playlists ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USER PROFILES POLICIES
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view other profiles for matching purposes (basic discovery)
CREATE POLICY "Users can view other profiles for matching"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
  ON user_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MUSIC PROFILES POLICIES
-- ============================================================================

-- Users can view their own music profile
CREATE POLICY "Users can view own music profile"
  ON music_profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view music profiles of potential matches
CREATE POLICY "Users can view other music profiles"
  ON music_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own music profile
CREATE POLICY "Users can insert own music profile"
  ON music_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own music profile
CREATE POLICY "Users can update own music profile"
  ON music_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own music profile
CREATE POLICY "Users can delete own music profile"
  ON music_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- CONFLICT STYLES POLICIES
-- ============================================================================

-- Users can view their own conflict style
CREATE POLICY "Users can view own conflict style"
  ON conflict_styles FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view conflict styles of matched users
CREATE POLICY "Users can view matched users conflict styles"
  ON conflict_styles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.matched_at IS NOT NULL
      AND (
        (m.user1_id = auth.uid() AND m.user2_id = conflict_styles.user_id)
        OR (m.user2_id = auth.uid() AND m.user1_id = conflict_styles.user_id)
      )
    )
  );

-- Users can insert their own conflict style
CREATE POLICY "Users can insert own conflict style"
  ON conflict_styles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own conflict style
CREATE POLICY "Users can update own conflict style"
  ON conflict_styles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own conflict style
CREATE POLICY "Users can delete own conflict style"
  ON conflict_styles FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PERSONALITY ASSESSMENTS POLICIES
-- ============================================================================

-- Users can view their own assessments
CREATE POLICY "Users can view own personality assessments"
  ON personality_assessments FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view assessments of matched users
CREATE POLICY "Users can view matched users assessments"
  ON personality_assessments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.matched_at IS NOT NULL
      AND (
        (m.user1_id = auth.uid() AND m.user2_id = personality_assessments.user_id)
        OR (m.user2_id = auth.uid() AND m.user1_id = personality_assessments.user_id)
      )
    )
  );

-- Users can insert their own assessments
CREATE POLICY "Users can insert own personality assessments"
  ON personality_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own assessments
CREATE POLICY "Users can update own personality assessments"
  ON personality_assessments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own assessments
CREATE POLICY "Users can delete own personality assessments"
  ON personality_assessments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- COMPATIBILITY SCORES POLICIES
-- ============================================================================

-- Users can view compatibility scores where they are involved
CREATE POLICY "Users can view own compatibility scores"
  ON compatibility_scores FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Only system/service role can insert/update compatibility scores
-- (This would be done via a backend service with elevated privileges)
-- For now, we don't allow direct user manipulation

-- ============================================================================
-- MATCHES POLICIES
-- ============================================================================

-- Users can view matches they are part of
CREATE POLICY "Users can view own matches"
  ON matches FOR SELECT
  USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can insert matches (to record their like)
CREATE POLICY "Users can create matches"
  ON matches FOR INSERT
  WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can update matches to record their like
CREATE POLICY "Users can update own matches"
  ON matches FOR UPDATE
  USING (auth.uid() = user1_id OR auth.uid() = user2_id)
  WITH CHECK (
    -- User1 can only update user1_liked
    (auth.uid() = user1_id AND NEW.user2_liked = OLD.user2_liked)
    OR
    -- User2 can only update user2_liked
    (auth.uid() = user2_id AND NEW.user1_liked = OLD.user1_liked)
  );

-- ============================================================================
-- CONVERSATIONS POLICIES
-- ============================================================================

-- Users can view conversations they are part of
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = conversations.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Users can create conversations for their matches
CREATE POLICY "Users can create conversations for matches"
  ON conversations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND m.matched_at IS NOT NULL
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- ============================================================================
-- MESSAGES POLICIES
-- ============================================================================

-- Users can view messages in their conversations
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = messages.conversation_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = conversation_id
      AND m.matched_at IS NOT NULL
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Users can update messages they sent (e.g., mark as read by recipient)
CREATE POLICY "Users can update messages in own conversations"
  ON messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN matches m ON m.id = c.match_id
      WHERE c.id = messages.conversation_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- ============================================================================
-- SHARED PLAYLISTS POLICIES
-- ============================================================================

-- Users can view shared playlists for their matches
CREATE POLICY "Users can view own shared playlists"
  ON shared_playlists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = shared_playlists.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Users can create shared playlists for their matches
CREATE POLICY "Users can create shared playlists"
  ON shared_playlists FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = match_id
      AND m.matched_at IS NOT NULL
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Users can update shared playlists for their matches
CREATE POLICY "Users can update own shared playlists"
  ON shared_playlists FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = shared_playlists.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );

-- Users can delete shared playlists for their matches
CREATE POLICY "Users can delete own shared playlists"
  ON shared_playlists FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM matches m
      WHERE m.id = shared_playlists.match_id
      AND (m.user1_id = auth.uid() OR m.user2_id = auth.uid())
    )
  );
