-- Seed Data for Harmonic Match
-- Reference data for conflict styles and personality frameworks

-- ============================================================================
-- CONFLICT STYLES REFERENCE DATA
-- Based on Thomas-Kilmann Conflict Mode Instrument (TKI)
-- ============================================================================

-- This is reference documentation stored as a comment
-- The actual conflict styles are defined as an ENUM in the schema

/*
CONFLICT STYLES DESCRIPTIONS:

1. COMPETING (High Assertiveness, Low Cooperation)
   - "My way or the highway"
   - Quick decisions, taking charge
   - Best when: Quick action needed, unpopular decisions must be made
   - Challenges: Can damage relationships, suppress others' ideas

2. COLLABORATING (High Assertiveness, High Cooperation)
   - "Let's find a win-win solution"
   - Integrating multiple perspectives
   - Best when: Both concerns are too important to compromise
   - Challenges: Time-consuming, requires trust

3. COMPROMISING (Moderate Assertiveness, Moderate Cooperation)
   - "Let's meet in the middle"
   - Finding expedient, mutually acceptable solutions
   - Best when: Goals are moderately important, need temporary settlement
   - Challenges: May miss creative solutions, partial satisfaction only

4. AVOIDING (Low Assertiveness, Low Cooperation)
   - "I'd rather not deal with this"
   - Sidestepping, postponing, or withdrawing
   - Best when: Issue is trivial, no chance of winning, need to cool down
   - Challenges: Unresolved issues may resurface, decisions by default

5. ACCOMMODATING (Low Assertiveness, High Cooperation)
   - "Whatever makes you happy"
   - Yielding, selfless generosity
   - Best when: You're wrong, issue matters more to others, building goodwill
   - Challenges: May be taken advantage of, ideas not heard
*/

-- ============================================================================
-- PERSONALITY FRAMEWORKS REFERENCE
-- ============================================================================

/*
BIG FIVE (OCEAN) PERSONALITY MODEL:
{
  "openness": 0-100,           -- Curiosity, creativity, openness to experience
  "conscientiousness": 0-100,  -- Organization, dependability, self-discipline
  "extraversion": 0-100,       -- Sociability, assertiveness, positive emotions
  "agreeableness": 0-100,      -- Cooperation, trust, helpfulness
  "neuroticism": 0-100         -- Emotional instability, anxiety, moodiness
}

MBTI (Myers-Briggs Type Indicator):
{
  "type": "ENFP",              -- One of 16 types
  "ei_score": -100 to 100,     -- Extraversion (-) vs Introversion (+)
  "sn_score": -100 to 100,     -- Sensing (-) vs Intuition (+)
  "tf_score": -100 to 100,     -- Thinking (-) vs Feeling (+)
  "jp_score": -100 to 100      -- Judging (-) vs Perceiving (+)
}

ATTACHMENT STYLE:
{
  "style": "secure|anxious|avoidant|fearful",
  "anxiety_score": 0-100,      -- Fear of rejection/abandonment
  "avoidance_score": 0-100     -- Discomfort with closeness
}

LOVE LANGUAGE:
{
  "primary": "words|acts|gifts|time|touch",
  "secondary": "words|acts|gifts|time|touch",
  "scores": {
    "words_of_affirmation": 0-100,
    "acts_of_service": 0-100,
    "receiving_gifts": 0-100,
    "quality_time": 0-100,
    "physical_touch": 0-100
  }
}
*/

-- ============================================================================
-- MUSIC PERSONALITY TYPES REFERENCE
-- ============================================================================

/*
MUSIC PERSONALITY TYPES:

1. EXPLORER
   - Always seeking new music
   - High novelty-seeking
   - Values discovery over familiarity
   - Often listens to new releases

2. LOYALIST
   - Sticks to favorites
   - Deep connection with specific artists/albums
   - Values nostalgia and emotional attachment
   - Repeat listener

3. ECLECTIC
   - Wide variety of genres
   - No strong genre preferences
   - Appreciates diversity in music
   - Context-dependent listening

4. MOOD_MATCHER
   - Listens based on current mood
   - Uses music for emotional regulation
   - Curates playlists for specific moods
   - Strong emotional connection to music

5. SOCIAL_LISTENER
   - Follows trends and friends
   - Music as social currency
   - Values shared listening experiences
   - Influenced by charts and recommendations
*/

-- ============================================================================
-- AUDIO FEATURES REFERENCE (Spotify)
-- ============================================================================

/*
SPOTIFY AUDIO FEATURES (stored in audio_features_avg_json):
{
  "acousticness": 0-1,       -- Confidence the track is acoustic
  "danceability": 0-1,       -- How suitable for dancing
  "energy": 0-1,             -- Intensity and activity
  "instrumentalness": 0-1,   -- Predicts if track has no vocals
  "liveness": 0-1,           -- Presence of audience in recording
  "loudness": -60 to 0 dB,   -- Overall loudness
  "speechiness": 0-1,        -- Presence of spoken words
  "tempo": BPM,              -- Estimated tempo
  "valence": 0-1,            -- Musical positiveness
  "mode": 0 or 1,            -- Major (1) or minor (0)
  "time_signature": 3-7      -- Estimated time signature
}
*/

-- ============================================================================
-- COMPATIBILITY SCORING WEIGHTS REFERENCE
-- ============================================================================

/*
COMPATIBILITY CALCULATION WEIGHTS:
- music_score: 40% (shared artists, genres, audio features)
- conflict_score: 30% (complementary or matching styles)
- personality_score: 30% (framework-specific compatibility)

MUSIC COMPATIBILITY FACTORS:
- Shared top artists: 40%
- Genre overlap: 30%
- Audio feature similarity: 30%

CONFLICT STYLE COMPATIBILITY:
- Collaborating + Collaborating: High (100)
- Collaborating + Compromising: High (85)
- Compromising + Compromising: Good (80)
- Accommodating + Competing: Moderate (60)
- Avoiding + Competing: Low (30)

PERSONALITY COMPATIBILITY (varies by framework):
- Big Five: Based on research-backed compatibility patterns
- MBTI: Cognitive function compatibility
- Attachment: Secure + any = good; Anxious + Avoidant = challenging
- Love Language: Higher when languages match or complement
*/
