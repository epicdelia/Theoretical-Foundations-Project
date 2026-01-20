-- Migration: Row Level Security Policies for Marital Matchmaker
-- Ensures users can only access their own data and data they're permitted to see

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================================
ALTER TABLE users_extended ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_dimensions ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE compatibility_quiz_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE intent_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- USERS_EXTENDED POLICIES
-- ============================================================================
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON users_extended FOR SELECT
    USING (auth.uid() = user_id);

-- Users can view other profiles (for matching/discovery) unless blocked
CREATE POLICY "Users can view other profiles for matching"
    ON users_extended FOR SELECT
    USING (
        auth.uid() IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM blocks
            WHERE (blocker_id = users_extended.user_id AND blocked_id = auth.uid())
               OR (blocker_id = auth.uid() AND blocked_id = users_extended.user_id)
        )
    );

-- Users can insert their own profile
CREATE POLICY "Users can create own profile"
    ON users_extended FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON users_extended FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own profile
CREATE POLICY "Users can delete own profile"
    ON users_extended FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- COMPATIBILITY_DIMENSIONS POLICIES
-- Public read access for all authenticated users
-- ============================================================================
CREATE POLICY "Authenticated users can view dimensions"
    ON compatibility_dimensions FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- QUIZ_QUESTIONS POLICIES
-- Public read access for all authenticated users
-- ============================================================================
CREATE POLICY "Authenticated users can view quiz questions"
    ON quiz_questions FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- COMPATIBILITY_QUIZ_RESPONSES POLICIES
-- ============================================================================
-- Users can view their own responses
CREATE POLICY "Users can view own quiz responses"
    ON compatibility_quiz_responses FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can submit quiz responses"
    ON compatibility_quiz_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses
CREATE POLICY "Users can update own quiz responses"
    ON compatibility_quiz_responses FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own responses
CREATE POLICY "Users can delete own quiz responses"
    ON compatibility_quiz_responses FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- USER_PREFERENCES POLICIES
-- ============================================================================
-- Users can view their own preferences
CREATE POLICY "Users can view own preferences"
    ON user_preferences FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own preferences
CREATE POLICY "Users can create own preferences"
    ON user_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own preferences
CREATE POLICY "Users can update own preferences"
    ON user_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
    ON user_preferences FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- INTENT_RESPONSES POLICIES
-- ============================================================================
-- Users can view their own intent responses
CREATE POLICY "Users can view own intent responses"
    ON intent_responses FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own intent responses
CREATE POLICY "Users can submit intent responses"
    ON intent_responses FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own intent responses
CREATE POLICY "Users can update own intent responses"
    ON intent_responses FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own intent responses
CREATE POLICY "Users can delete own intent responses"
    ON intent_responses FOR DELETE
    USING (auth.uid() = user_id);

-- ============================================================================
-- MATCHES POLICIES
-- ============================================================================
-- Users can view matches they're part of
CREATE POLICY "Users can view own matches"
    ON matches FOR SELECT
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can update matches they're part of (e.g., accept/decline)
CREATE POLICY "Users can update own matches"
    ON matches FOR UPDATE
    USING (auth.uid() = user1_id OR auth.uid() = user2_id)
    WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- ============================================================================
-- LIKES POLICIES
-- ============================================================================
-- Users can view likes they've sent
CREATE POLICY "Users can view own sent likes"
    ON likes FOR SELECT
    USING (auth.uid() = from_user_id);

-- Users can view likes they've received
CREATE POLICY "Users can view received likes"
    ON likes FOR SELECT
    USING (auth.uid() = to_user_id);

-- Users can create likes (send a like)
CREATE POLICY "Users can send likes"
    ON likes FOR INSERT
    WITH CHECK (
        auth.uid() = from_user_id
        AND NOT EXISTS (
            SELECT 1 FROM blocks
            WHERE (blocker_id = to_user_id AND blocked_id = auth.uid())
               OR (blocker_id = auth.uid() AND blocked_id = to_user_id)
        )
    );

-- Users can delete their own likes (unlike)
CREATE POLICY "Users can remove own likes"
    ON likes FOR DELETE
    USING (auth.uid() = from_user_id);

-- ============================================================================
-- BLOCKS POLICIES
-- ============================================================================
-- Users can view their own blocks
CREATE POLICY "Users can view own blocks"
    ON blocks FOR SELECT
    USING (auth.uid() = blocker_id);

-- Users can create blocks
CREATE POLICY "Users can create blocks"
    ON blocks FOR INSERT
    WITH CHECK (auth.uid() = blocker_id);

-- Users can remove their own blocks
CREATE POLICY "Users can remove own blocks"
    ON blocks FOR DELETE
    USING (auth.uid() = blocker_id);

-- ============================================================================
-- CONVERSATIONS POLICIES
-- ============================================================================
-- Users can view conversations from their matches
CREATE POLICY "Users can view own conversations"
    ON conversations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM matches
            WHERE matches.id = conversations.match_id
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        )
    );

-- Conversations are created when a match is accepted (via trigger/function)
CREATE POLICY "Users can create conversations for their matches"
    ON conversations FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM matches
            WHERE matches.id = match_id
            AND matches.status = 'accepted'
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
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
            SELECT 1 FROM conversations
            JOIN matches ON matches.id = conversations.match_id
            WHERE conversations.id = messages.conversation_id
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        )
    );

-- Users can send messages in their conversations
CREATE POLICY "Users can send messages in own conversations"
    ON messages FOR INSERT
    WITH CHECK (
        auth.uid() = sender_id
        AND EXISTS (
            SELECT 1 FROM conversations
            JOIN matches ON matches.id = conversations.match_id
            WHERE conversations.id = conversation_id
            AND matches.status = 'accepted'
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        )
    );

-- Users can update messages they've sent (e.g., mark as read by recipient)
CREATE POLICY "Users can update messages in own conversations"
    ON messages FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conversations
            JOIN matches ON matches.id = conversations.match_id
            WHERE conversations.id = messages.conversation_id
            AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid())
        )
    );
