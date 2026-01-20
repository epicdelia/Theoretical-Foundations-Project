-- Heartbreak Hub Seed Data
-- This file contains initial data for pathways and milestones

-- ============================================
-- PATHWAYS SEED DATA (3 pathways)
-- ============================================

INSERT INTO pathways (id, name, description, duration_days, icon) VALUES
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'Gentle Recovery',
    'A compassionate 30-day journey for those healing from a recent breakup. Focus on self-care, processing emotions, and rebuilding your foundation with gentle daily practices.',
    30,
    'heart'
  ),
  (
    'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    'Growth & Transformation',
    'A 45-day intensive program for turning heartbreak into personal growth. Includes journaling exercises, mindfulness practices, and actionable steps toward becoming your best self.',
    45,
    'sprout'
  ),
  (
    'c3d4e5f6-a7b8-9012-cdef-123456789012',
    'Moving Forward',
    'A 21-day program designed for those ready to take the next step. Focus on closure, setting new goals, and opening yourself to future possibilities while honoring your past.',
    21,
    'arrow-right'
  );

-- ============================================
-- MILESTONES SEED DATA (6 milestones)
-- ============================================

INSERT INTO milestones (id, name, description, icon, points, criteria_type) VALUES
  (
    'd4e5f6a7-b8c9-0123-defa-234567890123',
    'First Step',
    'Completed your first day of the recovery journey. Every journey begins with a single step.',
    'footprints',
    10,
    'day_completed'
  ),
  (
    'e5f6a7b8-c9d0-1234-efab-345678901234',
    'Journaling Journey',
    'Written 5 journal entries. Expressing your feelings is a powerful part of healing.',
    'book-open',
    25,
    'journal_count'
  ),
  (
    'f6a7b8c9-d0e1-2345-fabc-456789012345',
    'Week Warrior',
    'Maintained a 7-day streak. Consistency is the key to recovery.',
    'flame',
    50,
    'streak_days'
  ),
  (
    'a7b8c9d0-e1f2-3456-abcd-567890123456',
    'Community Connector',
    'Sent your first encouragement to a fellow traveler. Healing together is more powerful.',
    'users',
    20,
    'encouragement_sent'
  ),
  (
    'b8c9d0e1-f2a3-4567-bcde-678901234567',
    'Halfway Hero',
    'Reached the halfway point of your pathway. You are stronger than you know.',
    'mountain',
    75,
    'pathway_progress'
  ),
  (
    'c9d0e1f2-a3b4-5678-cdef-789012345678',
    'Recovery Champion',
    'Completed an entire pathway. You have proven your resilience and commitment to growth.',
    'trophy',
    150,
    'pathway_completed'
  );
