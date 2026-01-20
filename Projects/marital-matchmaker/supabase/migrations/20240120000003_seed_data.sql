-- Migration: Seed Data for Compatibility Dimensions and Quiz Questions
-- Contains 5 dimensions and 25 questions (5 per dimension)

-- ============================================================================
-- SEED: COMPATIBILITY DIMENSIONS
-- Each dimension has equal weight (0.20) for a balanced compatibility score
-- ============================================================================
INSERT INTO compatibility_dimensions (id, name, weight, description) VALUES
(
    'a1b2c3d4-1111-1111-1111-111111111111',
    'values',
    0.20,
    'Core beliefs and principles that guide life decisions, including religious/spiritual views, family importance, integrity, and what you consider most meaningful in life.'
),
(
    'a1b2c3d4-2222-2222-2222-222222222222',
    'goals',
    0.20,
    'Life aspirations and future planning, including career ambitions, family planning, financial goals, where you want to live, and how you envision your ideal future together.'
),
(
    'a1b2c3d4-3333-3333-3333-333333333333',
    'communication',
    0.20,
    'How you express yourself, handle conflicts, share feelings, and connect emotionally. Includes listening styles, openness, and how you navigate disagreements.'
),
(
    'a1b2c3d4-4444-4444-4444-444444444444',
    'lifestyle',
    0.20,
    'Daily habits and preferences including social activities, health and fitness, work-life balance, hobbies, cleanliness standards, and how you spend your free time.'
),
(
    'a1b2c3d4-5555-5555-5555-555555555555',
    'finance',
    0.20,
    'Approach to money management, spending habits, saving priorities, financial decision-making, attitudes toward debt, and alignment on major purchases.'
);

-- ============================================================================
-- SEED: QUIZ QUESTIONS
-- 5 questions per dimension, each with answer options and scoring logic
-- Answer values: 1-5 scale where higher values indicate stronger agreement
-- ============================================================================

-- VALUES DIMENSION QUESTIONS (5)
INSERT INTO quiz_questions (id, dimension_id, question_text, answer_options_json, scoring_logic, question_order) VALUES
(
    'q1111111-1111-1111-1111-111111111111',
    'a1b2c3d4-1111-1111-1111-111111111111',
    'How important is religion or spirituality in your daily life?',
    '["Not important at all", "Slightly important", "Moderately important", "Very important", "Extremely important - central to my identity"]',
    '{"type": "direct", "weight": 1.0}',
    1
),
(
    'q1111111-1111-1111-1111-222222222222',
    'a1b2c3d4-1111-1111-1111-111111111111',
    'How do you prioritize family relationships (parents, siblings, extended family)?',
    '["I prefer independence from family", "Family is nice but not a priority", "Family is somewhat important", "Family is very important", "Family comes first in all decisions"]',
    '{"type": "direct", "weight": 1.0}',
    2
),
(
    'q1111111-1111-1111-1111-333333333333',
    'a1b2c3d4-1111-1111-1111-111111111111',
    'When making major life decisions, what matters most to you?',
    '["Personal happiness and freedom", "Financial security", "Impact on relationships", "Alignment with my principles", "Balance of all factors equally"]',
    '{"type": "categorical", "weight": 1.0}',
    3
),
(
    'q1111111-1111-1111-1111-444444444444',
    'a1b2c3d4-1111-1111-1111-111111111111',
    'How important is it that your partner shares your political views?',
    '["Not important at all", "Slightly important", "Moderately important", "Very important", "Essential - we must agree"]',
    '{"type": "direct", "weight": 1.0}',
    4
),
(
    'q1111111-1111-1111-1111-555555555555',
    'a1b2c3d4-1111-1111-1111-111111111111',
    'How do you view honesty in a relationship?',
    '["White lies are fine to avoid conflict", "Some things are better left unsaid", "Honesty is important but with tact", "Always be honest even if it hurts", "Complete transparency is non-negotiable"]',
    '{"type": "direct", "weight": 1.0}',
    5
),

-- GOALS DIMENSION QUESTIONS (5)
(
    'q2222222-2222-2222-2222-111111111111',
    'a1b2c3d4-2222-2222-2222-222222222222',
    'How important is having children to your life plan?',
    '["I definitely do not want children", "I lean toward not having children", "I am open either way", "I lean toward having children", "Having children is essential to me"]',
    '{"type": "direct", "weight": 1.0}',
    1
),
(
    'q2222222-2222-2222-2222-222222222222',
    'a1b2c3d4-2222-2222-2222-222222222222',
    'How would you describe your career ambitions?',
    '["Work is just a paycheck", "I want stability, not advancement", "I seek moderate growth", "Career success is very important", "I am driven to reach the top of my field"]',
    '{"type": "direct", "weight": 1.0}',
    2
),
(
    'q2222222-2222-2222-2222-333333333333',
    'a1b2c3d4-2222-2222-2222-222222222222',
    'Where do you ideally see yourself living long-term?',
    '["Big city center", "Suburban area near a city", "Small town or rural area", "I want to travel/move frequently", "I am flexible - it depends on circumstances"]',
    '{"type": "categorical", "weight": 1.0}',
    3
),
(
    'q2222222-2222-2222-2222-444444444444',
    'a1b2c3d4-2222-2222-2222-222222222222',
    'How do you feel about one partner potentially staying home to raise children?',
    '["Strongly against - both should work", "Prefer both working but open to discussion", "Neutral - depends on circumstances", "Supportive if it makes sense", "Strongly prefer one parent at home"]',
    '{"type": "direct", "weight": 1.0}',
    4
),
(
    'q2222222-2222-2222-2222-555555555555',
    'a1b2c3d4-2222-2222-2222-222222222222',
    'What is your ideal timeline for major life milestones (marriage, home, family)?',
    '["No rush - let things happen naturally", "Within the next 5+ years", "Within 3-5 years", "Within 1-3 years", "As soon as possible - I am ready now"]',
    '{"type": "direct", "weight": 1.0}',
    5
),

-- COMMUNICATION DIMENSION QUESTIONS (5)
(
    'q3333333-3333-3333-3333-111111111111',
    'a1b2c3d4-3333-3333-3333-333333333333',
    'When you are upset with your partner, how do you typically respond?',
    '["I need space and time alone first", "I hint at the problem indirectly", "I bring it up when I have calmed down", "I discuss it right away calmly", "I express my feelings immediately and directly"]',
    '{"type": "categorical", "weight": 1.0}',
    1
),
(
    'q3333333-3333-3333-3333-222222222222',
    'a1b2c3d4-3333-3333-3333-333333333333',
    'How comfortable are you sharing your deepest feelings and vulnerabilities?',
    '["Very uncomfortable - I keep things private", "Somewhat uncomfortable", "Neutral - depends on the topic", "Fairly comfortable", "Very comfortable - I am an open book"]',
    '{"type": "direct", "weight": 1.0}',
    2
),
(
    'q3333333-3333-3333-3333-333333333333',
    'a1b2c3d4-3333-3333-3333-333333333333',
    'During a disagreement, what is most important to you?',
    '["Winning the argument", "Being heard and understood", "Finding a compromise quickly", "Understanding my partner''s perspective", "Resolving the underlying issue completely"]',
    '{"type": "categorical", "weight": 1.0}',
    3
),
(
    'q3333333-3333-3333-3333-444444444444',
    'a1b2c3d4-3333-3333-3333-333333333333',
    'How often do you need quality conversation time with your partner?',
    '["Rarely - I prefer comfortable silence", "Weekly deep conversations are enough", "A few times a week", "Daily meaningful conversations", "Constant communication throughout the day"]',
    '{"type": "direct", "weight": 1.0}',
    4
),
(
    'q3333333-3333-3333-3333-555555555555',
    'a1b2c3d4-3333-3333-3333-333333333333',
    'How do you prefer to receive feedback or criticism?',
    '["I prefer not to receive criticism", "Very gently with lots of positivity", "Directly but kindly", "Straightforward and honest", "Bluntly - just tell me the truth"]',
    '{"type": "direct", "weight": 1.0}',
    5
),

-- LIFESTYLE DIMENSION QUESTIONS (5)
(
    'q4444444-4444-4444-4444-111111111111',
    'a1b2c3d4-4444-4444-4444-444444444444',
    'How would you describe your ideal weekend?',
    '["Relaxing at home alone or with partner", "Low-key activities with close friends", "Mix of social and quiet time", "Active with various social plans", "Packed with events and adventures"]',
    '{"type": "categorical", "weight": 1.0}',
    1
),
(
    'q4444444-4444-4444-4444-222222222222',
    'a1b2c3d4-4444-4444-4444-444444444444',
    'How important is physical fitness and health to you?',
    '["Not a priority for me", "Somewhat important but not strict", "Moderately important", "Very important - regular routine", "Essential - it is a core part of my identity"]',
    '{"type": "direct", "weight": 1.0}',
    2
),
(
    'q4444444-4444-4444-4444-333333333333',
    'a1b2c3d4-4444-4444-4444-444444444444',
    'How do you feel about alcohol consumption?',
    '["I do not drink and prefer a partner who does not", "I rarely drink - socially only", "I drink moderately", "I enjoy drinking regularly", "I prefer not to restrict drinking"]',
    '{"type": "categorical", "weight": 1.0}',
    3
),
(
    'q4444444-4444-4444-4444-444444444444',
    'a1b2c3d4-4444-4444-4444-444444444444',
    'How important is cleanliness and organization in your living space?',
    '["Not important - I am messy and okay with it", "Slightly important - basic tidiness", "Moderately important", "Very important - I like things neat", "Extremely important - everything has its place"]',
    '{"type": "direct", "weight": 1.0}',
    4
),
(
    'q4444444-4444-4444-4444-555555555555',
    'a1b2c3d4-4444-4444-4444-444444444444',
    'How do you typically approach work-life balance?',
    '["Work dominates - I am very career focused", "Work comes first but I make time for life", "I strive for equal balance", "Life comes first but I meet work obligations", "Life dominates - work is just a means to an end"]',
    '{"type": "categorical", "weight": 1.0}',
    5
),

-- FINANCE DIMENSION QUESTIONS (5)
(
    'q5555555-5555-5555-5555-111111111111',
    'a1b2c3d4-5555-5555-5555-555555555555',
    'How would you describe your approach to spending money?',
    '["Very frugal - I save as much as possible", "Careful spender - mostly necessities", "Balanced - save some, spend some", "Enjoy spending on experiences and things", "Generous spender - money is meant to be enjoyed"]',
    '{"type": "categorical", "weight": 1.0}',
    1
),
(
    'q5555555-5555-5555-5555-222222222222',
    'a1b2c3d4-5555-5555-5555-555555555555',
    'How do you feel about debt (excluding mortgage)?',
    '["Completely unacceptable under any circumstances", "Strongly avoid but understand emergencies", "Acceptable if managed responsibly", "Fine for major purchases or investments", "Not concerned about debt"]',
    '{"type": "direct", "weight": 1.0}',
    2
),
(
    'q5555555-5555-5555-5555-333333333333',
    'a1b2c3d4-5555-5555-5555-555555555555',
    'How should finances be managed in a marriage?',
    '["Completely separate accounts", "Mostly separate with a joint account for bills", "Mix of joint and personal accounts", "Mostly joint with small personal allowances", "Completely combined - all money is shared"]',
    '{"type": "categorical", "weight": 1.0}',
    3
),
(
    'q5555555-5555-5555-5555-444444444444',
    'a1b2c3d4-5555-5555-5555-555555555555',
    'What is your attitude toward financial risk and investments?',
    '["Very conservative - safety first", "Somewhat conservative", "Moderate risk tolerance", "Comfortable with calculated risks", "High risk tolerance - potential for high reward"]',
    '{"type": "direct", "weight": 1.0}',
    4
),
(
    'q5555555-5555-5555-5555-555555555555',
    'a1b2c3d4-5555-5555-5555-555555555555',
    'How important is financial transparency between partners?',
    '["Privacy is important - some things should be separate", "Share big picture but not every detail", "Regular check-ins about finances", "Full transparency on major decisions", "Complete openness - no financial secrets ever"]',
    '{"type": "direct", "weight": 1.0}',
    5
);
