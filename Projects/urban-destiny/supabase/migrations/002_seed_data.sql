-- Urban Destiny Seed Data
-- Migration: 002_seed_data
-- Description: Seed data for 30 major cities with metrics and assessment questions

-- ============================================================================
-- ASSESSMENT CATEGORIES
-- ============================================================================
INSERT INTO assessment_categories (id, name, description, icon, display_order) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'career', 'Professional growth, job opportunities, and work environment preferences', 'briefcase', 1),
  ('a1000000-0000-0000-0000-000000000002', 'lifestyle', 'Daily life, culture, entertainment, and social activities', 'heart', 2),
  ('a1000000-0000-0000-0000-000000000003', 'cost', 'Cost of living, housing affordability, and financial considerations', 'wallet', 3),
  ('a1000000-0000-0000-0000-000000000004', 'happiness', 'Overall well-being, safety, healthcare, and quality of life', 'smile', 4);

-- ============================================================================
-- ASSESSMENT QUESTIONS (5 per category)
-- ============================================================================

-- Career Questions
INSERT INTO assessment_questions (id, category_id, question_text, question_order, min_label, max_label) VALUES
  ('q1000000-0000-0000-0000-000000000001', 'a1000000-0000-0000-0000-000000000001',
   'How important is having access to a thriving job market in your industry?', 1, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000002', 'a1000000-0000-0000-0000-000000000001',
   'Do you prioritize networking opportunities and professional events?', 2, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000003', 'a1000000-0000-0000-0000-000000000001',
   'How much do you value access to co-working spaces and startup ecosystems?', 3, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000004', 'a1000000-0000-0000-0000-000000000001',
   'Is being in a city with major company headquarters important to you?', 4, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000005', 'a1000000-0000-0000-0000-000000000001',
   'How important is work-life balance culture in your ideal city?', 5, 'Not Important', 'Very Important');

-- Lifestyle Questions
INSERT INTO assessment_questions (id, category_id, question_text, question_order, min_label, max_label) VALUES
  ('q1000000-0000-0000-0000-000000000006', 'a1000000-0000-0000-0000-000000000002',
   'How important is access to diverse dining and nightlife options?', 1, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000007', 'a1000000-0000-0000-0000-000000000002',
   'Do you prioritize outdoor activities and access to nature?', 2, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000008', 'a1000000-0000-0000-0000-000000000002',
   'How much do you value cultural attractions like museums and theaters?', 3, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000009', 'a1000000-0000-0000-0000-000000000002',
   'Is having excellent public transportation important to you?', 4, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000010', 'a1000000-0000-0000-0000-000000000002',
   'How important is living in a walkable neighborhood?', 5, 'Not Important', 'Very Important');

-- Cost Questions
INSERT INTO assessment_questions (id, category_id, question_text, question_order, min_label, max_label) VALUES
  ('q1000000-0000-0000-0000-000000000011', 'a1000000-0000-0000-0000-000000000003',
   'How sensitive are you to housing costs?', 1, 'Not Sensitive', 'Very Sensitive'),
  ('q1000000-0000-0000-0000-000000000012', 'a1000000-0000-0000-0000-000000000003',
   'Do you prioritize affordable day-to-day expenses (food, transport)?', 2, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000013', 'a1000000-0000-0000-0000-000000000003',
   'How important is tax-friendliness in your city choice?', 3, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000014', 'a1000000-0000-0000-0000-000000000003',
   'Would you trade higher costs for better amenities and opportunities?', 4, 'Definitely Not', 'Definitely Yes'),
  ('q1000000-0000-0000-0000-000000000015', 'a1000000-0000-0000-0000-000000000003',
   'How important is building savings and wealth in your city?', 5, 'Not Important', 'Very Important');

-- Happiness Questions
INSERT INTO assessment_questions (id, category_id, question_text, question_order, min_label, max_label) VALUES
  ('q1000000-0000-0000-0000-000000000016', 'a1000000-0000-0000-0000-000000000004',
   'How important is living in a safe city with low crime rates?', 1, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000017', 'a1000000-0000-0000-0000-000000000004',
   'Do you prioritize access to quality healthcare?', 2, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000018', 'a1000000-0000-0000-0000-000000000004',
   'How much do you value clean air and environmental quality?', 3, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000019', 'a1000000-0000-0000-0000-000000000004',
   'Is living in a friendly, welcoming community important to you?', 4, 'Not Important', 'Very Important'),
  ('q1000000-0000-0000-0000-000000000020', 'a1000000-0000-0000-0000-000000000004',
   'How important is access to mental health resources and wellness services?', 5, 'Not Important', 'Very Important');

-- ============================================================================
-- CITIES (30 Major Cities)
-- ============================================================================
INSERT INTO cities (id, name, country, population, cost_index, career_score, lifestyle_score, happiness_index, climate, image_url) VALUES
  -- North America
  ('c1000000-0000-0000-0000-000000000001', 'New York City', 'United States', 8336817, 85.00, 95.00, 92.00, 72.00, 'Humid Continental', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9'),
  ('c1000000-0000-0000-0000-000000000002', 'San Francisco', 'United States', 873965, 90.00, 92.00, 88.00, 75.00, 'Mediterranean', 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29'),
  ('c1000000-0000-0000-0000-000000000003', 'Los Angeles', 'United States', 3979576, 78.00, 82.00, 85.00, 70.00, 'Mediterranean', 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da'),
  ('c1000000-0000-0000-0000-000000000004', 'Seattle', 'United States', 737015, 75.00, 88.00, 82.00, 74.00, 'Oceanic', 'https://images.unsplash.com/photo-1438401171849-74ac270044ee'),
  ('c1000000-0000-0000-0000-000000000005', 'Austin', 'United States', 978908, 62.00, 85.00, 84.00, 78.00, 'Humid Subtropical', 'https://images.unsplash.com/photo-1531218150217-54595bc2b934'),
  ('c1000000-0000-0000-0000-000000000006', 'Miami', 'United States', 442241, 70.00, 72.00, 86.00, 73.00, 'Tropical', 'https://images.unsplash.com/photo-1503891450247-ee5f8ec46dc3'),
  ('c1000000-0000-0000-0000-000000000007', 'Denver', 'United States', 715522, 65.00, 78.00, 85.00, 80.00, 'Semi-Arid', 'https://images.unsplash.com/photo-1546156929-a4c0ac411f47'),
  ('c1000000-0000-0000-0000-000000000008', 'Toronto', 'Canada', 2731571, 72.00, 85.00, 86.00, 78.00, 'Humid Continental', 'https://images.unsplash.com/photo-1517090504531-3b3f1e07c2e0'),
  ('c1000000-0000-0000-0000-000000000009', 'Vancouver', 'Canada', 631486, 76.00, 80.00, 88.00, 82.00, 'Oceanic', 'https://images.unsplash.com/photo-1559511260-66a654ae982a'),
  ('c1000000-0000-0000-0000-000000000010', 'Mexico City', 'Mexico', 9209944, 42.00, 70.00, 80.00, 68.00, 'Subtropical Highland', 'https://images.unsplash.com/photo-1518659526054-190340b32735'),

  -- Europe
  ('c1000000-0000-0000-0000-000000000011', 'London', 'United Kingdom', 8982000, 82.00, 92.00, 90.00, 74.00, 'Oceanic', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad'),
  ('c1000000-0000-0000-0000-000000000012', 'Berlin', 'Germany', 3644826, 58.00, 82.00, 88.00, 79.00, 'Oceanic', 'https://images.unsplash.com/photo-1560969184-10fe8719e047'),
  ('c1000000-0000-0000-0000-000000000013', 'Amsterdam', 'Netherlands', 872680, 74.00, 85.00, 90.00, 85.00, 'Oceanic', 'https://images.unsplash.com/photo-1534351590666-13e3e96b5017'),
  ('c1000000-0000-0000-0000-000000000014', 'Paris', 'France', 2161000, 80.00, 86.00, 92.00, 72.00, 'Oceanic', 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34'),
  ('c1000000-0000-0000-0000-000000000015', 'Barcelona', 'Spain', 1620343, 65.00, 75.00, 92.00, 80.00, 'Mediterranean', 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4'),
  ('c1000000-0000-0000-0000-000000000016', 'Lisbon', 'Portugal', 544851, 55.00, 72.00, 88.00, 82.00, 'Mediterranean', 'https://images.unsplash.com/photo-1555881400-69293e8b2c6e'),
  ('c1000000-0000-0000-0000-000000000017', 'Stockholm', 'Sweden', 975904, 72.00, 82.00, 85.00, 86.00, 'Humid Continental', 'https://images.unsplash.com/photo-1509356843151-3e7d96241e11'),
  ('c1000000-0000-0000-0000-000000000018', 'Copenhagen', 'Denmark', 794128, 78.00, 80.00, 88.00, 88.00, 'Oceanic', 'https://images.unsplash.com/photo-1513622470522-26c3c8a854bc'),
  ('c1000000-0000-0000-0000-000000000019', 'Dublin', 'Ireland', 544107, 76.00, 84.00, 82.00, 80.00, 'Oceanic', 'https://images.unsplash.com/photo-1549918864-48ac978761a4'),
  ('c1000000-0000-0000-0000-000000000020', 'Zurich', 'Switzerland', 421878, 95.00, 88.00, 85.00, 90.00, 'Oceanic', 'https://images.unsplash.com/photo-1515488764276-beab7607c1e6'),

  -- Asia-Pacific
  ('c1000000-0000-0000-0000-000000000021', 'Singapore', 'Singapore', 5850342, 82.00, 90.00, 85.00, 78.00, 'Tropical', 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd'),
  ('c1000000-0000-0000-0000-000000000022', 'Tokyo', 'Japan', 13960000, 78.00, 88.00, 90.00, 76.00, 'Humid Subtropical', 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf'),
  ('c1000000-0000-0000-0000-000000000023', 'Seoul', 'South Korea', 9776000, 68.00, 85.00, 86.00, 72.00, 'Humid Continental', 'https://images.unsplash.com/photo-1517154421773-0529f29ea451'),
  ('c1000000-0000-0000-0000-000000000024', 'Sydney', 'Australia', 5312163, 75.00, 82.00, 90.00, 84.00, 'Humid Subtropical', 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9'),
  ('c1000000-0000-0000-0000-000000000025', 'Melbourne', 'Australia', 5078193, 70.00, 80.00, 92.00, 85.00, 'Oceanic', 'https://images.unsplash.com/photo-1514395462725-fb4566210144'),
  ('c1000000-0000-0000-0000-000000000026', 'Hong Kong', 'China', 7481800, 85.00, 88.00, 82.00, 68.00, 'Humid Subtropical', 'https://images.unsplash.com/photo-1506970845246-18f21d533b20'),
  ('c1000000-0000-0000-0000-000000000027', 'Bangkok', 'Thailand', 10539000, 45.00, 68.00, 82.00, 70.00, 'Tropical', 'https://images.unsplash.com/photo-1508009603885-50cf7c579365'),
  ('c1000000-0000-0000-0000-000000000028', 'Dubai', 'United Arab Emirates', 3331420, 72.00, 82.00, 80.00, 72.00, 'Desert', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c'),
  ('c1000000-0000-0000-0000-000000000029', 'Tel Aviv', 'Israel', 460613, 78.00, 86.00, 85.00, 74.00, 'Mediterranean', 'https://images.unsplash.com/photo-1544967082-d9d25d867d66'),

  -- South America
  ('c1000000-0000-0000-0000-000000000030', 'Buenos Aires', 'Argentina', 3075646, 48.00, 70.00, 88.00, 72.00, 'Humid Subtropical', 'https://images.unsplash.com/photo-1612294037637-ec328d0e075e');

-- ============================================================================
-- CITY METRICS (Sample metrics for each city)
-- ============================================================================

-- New York City Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'avg_salary', 85000, 2024, 'Bureau of Labor Statistics'),
  ('c1000000-0000-0000-0000-000000000001', 'rent_1br', 3500, 2024, 'Zillow'),
  ('c1000000-0000-0000-0000-000000000001', 'tech_jobs', 350000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000001', 'restaurants_per_capita', 25.5, 2024, 'Yelp'),
  ('c1000000-0000-0000-0000-000000000001', 'green_space_pct', 14, 2024, 'NYC Parks');

-- San Francisco Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000002', 'avg_salary', 120000, 2024, 'Bureau of Labor Statistics'),
  ('c1000000-0000-0000-0000-000000000002', 'rent_1br', 3200, 2024, 'Zillow'),
  ('c1000000-0000-0000-0000-000000000002', 'tech_jobs', 180000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000002', 'restaurants_per_capita', 28.2, 2024, 'Yelp'),
  ('c1000000-0000-0000-0000-000000000002', 'green_space_pct', 18, 2024, 'SF Parks');

-- Los Angeles Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'avg_salary', 72000, 2024, 'Bureau of Labor Statistics'),
  ('c1000000-0000-0000-0000-000000000003', 'rent_1br', 2400, 2024, 'Zillow'),
  ('c1000000-0000-0000-0000-000000000003', 'tech_jobs', 220000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000003', 'restaurants_per_capita', 22.1, 2024, 'Yelp'),
  ('c1000000-0000-0000-0000-000000000003', 'green_space_pct', 8, 2024, 'LA Parks');

-- Seattle Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000004', 'avg_salary', 95000, 2024, 'Bureau of Labor Statistics'),
  ('c1000000-0000-0000-0000-000000000004', 'rent_1br', 2100, 2024, 'Zillow'),
  ('c1000000-0000-0000-0000-000000000004', 'tech_jobs', 145000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000004', 'restaurants_per_capita', 21.3, 2024, 'Yelp'),
  ('c1000000-0000-0000-0000-000000000004', 'green_space_pct', 12, 2024, 'Seattle Parks');

-- Austin Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000005', 'avg_salary', 78000, 2024, 'Bureau of Labor Statistics'),
  ('c1000000-0000-0000-0000-000000000005', 'rent_1br', 1650, 2024, 'Zillow'),
  ('c1000000-0000-0000-0000-000000000005', 'tech_jobs', 95000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000005', 'restaurants_per_capita', 24.8, 2024, 'Yelp'),
  ('c1000000-0000-0000-0000-000000000005', 'green_space_pct', 15, 2024, 'Austin Parks');

-- Miami Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000006', 'avg_salary', 58000, 2024, 'Bureau of Labor Statistics'),
  ('c1000000-0000-0000-0000-000000000006', 'rent_1br', 2200, 2024, 'Zillow'),
  ('c1000000-0000-0000-0000-000000000006', 'tech_jobs', 45000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000006', 'restaurants_per_capita', 26.5, 2024, 'Yelp'),
  ('c1000000-0000-0000-0000-000000000006', 'green_space_pct', 10, 2024, 'Miami Parks');

-- Denver Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000007', 'avg_salary', 72000, 2024, 'Bureau of Labor Statistics'),
  ('c1000000-0000-0000-0000-000000000007', 'rent_1br', 1750, 2024, 'Zillow'),
  ('c1000000-0000-0000-0000-000000000007', 'tech_jobs', 75000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000007', 'restaurants_per_capita', 22.0, 2024, 'Yelp'),
  ('c1000000-0000-0000-0000-000000000007', 'green_space_pct', 20, 2024, 'Denver Parks');

-- Toronto Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000008', 'avg_salary', 68000, 2024, 'Statistics Canada'),
  ('c1000000-0000-0000-0000-000000000008', 'rent_1br', 2300, 2024, 'Rentals.ca'),
  ('c1000000-0000-0000-0000-000000000008', 'tech_jobs', 180000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000008', 'restaurants_per_capita', 20.5, 2024, 'Yelp'),
  ('c1000000-0000-0000-0000-000000000008', 'green_space_pct', 13, 2024, 'Toronto Parks');

-- Vancouver Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000009', 'avg_salary', 65000, 2024, 'Statistics Canada'),
  ('c1000000-0000-0000-0000-000000000009', 'rent_1br', 2500, 2024, 'Rentals.ca'),
  ('c1000000-0000-0000-0000-000000000009', 'tech_jobs', 95000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000009', 'restaurants_per_capita', 23.1, 2024, 'Yelp'),
  ('c1000000-0000-0000-0000-000000000009', 'green_space_pct', 22, 2024, 'Vancouver Parks');

-- Mexico City Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000010', 'avg_salary', 25000, 2024, 'INEGI'),
  ('c1000000-0000-0000-0000-000000000010', 'rent_1br', 800, 2024, 'Inmuebles24'),
  ('c1000000-0000-0000-0000-000000000010', 'tech_jobs', 120000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000010', 'restaurants_per_capita', 18.2, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000010', 'green_space_pct', 9, 2024, 'SEDEMA');

-- London Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000011', 'avg_salary', 75000, 2024, 'ONS'),
  ('c1000000-0000-0000-0000-000000000011', 'rent_1br', 2800, 2024, 'Rightmove'),
  ('c1000000-0000-0000-0000-000000000011', 'tech_jobs', 320000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000011', 'restaurants_per_capita', 24.0, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000011', 'green_space_pct', 33, 2024, 'London Gov');

-- Berlin Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000012', 'avg_salary', 55000, 2024, 'Destatis'),
  ('c1000000-0000-0000-0000-000000000012', 'rent_1br', 1400, 2024, 'Immobilienscout24'),
  ('c1000000-0000-0000-0000-000000000012', 'tech_jobs', 140000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000012', 'restaurants_per_capita', 19.8, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000012', 'green_space_pct', 30, 2024, 'Berlin Senate');

-- Amsterdam Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000013', 'avg_salary', 62000, 2024, 'CBS'),
  ('c1000000-0000-0000-0000-000000000013', 'rent_1br', 1900, 2024, 'Pararius'),
  ('c1000000-0000-0000-0000-000000000013', 'tech_jobs', 85000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000013', 'restaurants_per_capita', 27.5, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000013', 'green_space_pct', 21, 2024, 'Amsterdam Gov');

-- Paris Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000014', 'avg_salary', 58000, 2024, 'INSEE'),
  ('c1000000-0000-0000-0000-000000000014', 'rent_1br', 1600, 2024, 'SeLoger'),
  ('c1000000-0000-0000-0000-000000000014', 'tech_jobs', 180000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000014', 'restaurants_per_capita', 32.0, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000014', 'green_space_pct', 9, 2024, 'Paris Gov');

-- Barcelona Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000015', 'avg_salary', 42000, 2024, 'INE'),
  ('c1000000-0000-0000-0000-000000000015', 'rent_1br', 1200, 2024, 'Idealista'),
  ('c1000000-0000-0000-0000-000000000015', 'tech_jobs', 75000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000015', 'restaurants_per_capita', 28.3, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000015', 'green_space_pct', 7, 2024, 'Barcelona Gov');

-- Lisbon Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000016', 'avg_salary', 32000, 2024, 'Pordata'),
  ('c1000000-0000-0000-0000-000000000016', 'rent_1br', 1100, 2024, 'Idealista'),
  ('c1000000-0000-0000-0000-000000000016', 'tech_jobs', 45000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000016', 'restaurants_per_capita', 22.5, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000016', 'green_space_pct', 25, 2024, 'Lisbon Gov');

-- Stockholm Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000017', 'avg_salary', 58000, 2024, 'SCB'),
  ('c1000000-0000-0000-0000-000000000017', 'rent_1br', 1500, 2024, 'Hemnet'),
  ('c1000000-0000-0000-0000-000000000017', 'tech_jobs', 95000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000017', 'restaurants_per_capita', 18.5, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000017', 'green_space_pct', 40, 2024, 'Stockholm Gov');

-- Copenhagen Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000018', 'avg_salary', 62000, 2024, 'DST'),
  ('c1000000-0000-0000-0000-000000000018', 'rent_1br', 1700, 2024, 'Boligportal'),
  ('c1000000-0000-0000-0000-000000000018', 'tech_jobs', 65000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000018', 'restaurants_per_capita', 20.2, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000018', 'green_space_pct', 25, 2024, 'Copenhagen Gov');

-- Dublin Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000019', 'avg_salary', 58000, 2024, 'CSO'),
  ('c1000000-0000-0000-0000-000000000019', 'rent_1br', 2100, 2024, 'Daft.ie'),
  ('c1000000-0000-0000-0000-000000000019', 'tech_jobs', 85000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000019', 'restaurants_per_capita', 21.0, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000019', 'green_space_pct', 16, 2024, 'Dublin Gov');

-- Zurich Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000020', 'avg_salary', 105000, 2024, 'BFS'),
  ('c1000000-0000-0000-0000-000000000020', 'rent_1br', 2400, 2024, 'Homegate'),
  ('c1000000-0000-0000-0000-000000000020', 'tech_jobs', 55000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000020', 'restaurants_per_capita', 19.5, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000020', 'green_space_pct', 35, 2024, 'Zurich Gov');

-- Singapore Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000021', 'avg_salary', 72000, 2024, 'MOM'),
  ('c1000000-0000-0000-0000-000000000021', 'rent_1br', 2800, 2024, 'PropertyGuru'),
  ('c1000000-0000-0000-0000-000000000021', 'tech_jobs', 165000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000021', 'restaurants_per_capita', 35.2, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000021', 'green_space_pct', 47, 2024, 'NParks');

-- Tokyo Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000022', 'avg_salary', 52000, 2024, 'MHLW'),
  ('c1000000-0000-0000-0000-000000000022', 'rent_1br', 1400, 2024, 'Suumo'),
  ('c1000000-0000-0000-0000-000000000022', 'tech_jobs', 280000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000022', 'restaurants_per_capita', 42.0, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000022', 'green_space_pct', 7, 2024, 'Tokyo Gov');

-- Seoul Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000023', 'avg_salary', 48000, 2024, 'KOSIS'),
  ('c1000000-0000-0000-0000-000000000023', 'rent_1br', 1100, 2024, 'Zigbang'),
  ('c1000000-0000-0000-0000-000000000023', 'tech_jobs', 220000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000023', 'restaurants_per_capita', 38.5, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000023', 'green_space_pct', 28, 2024, 'Seoul Gov');

-- Sydney Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000024', 'avg_salary', 78000, 2024, 'ABS'),
  ('c1000000-0000-0000-0000-000000000024', 'rent_1br', 2600, 2024, 'Domain'),
  ('c1000000-0000-0000-0000-000000000024', 'tech_jobs', 145000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000024', 'restaurants_per_capita', 24.8, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000024', 'green_space_pct', 46, 2024, 'Sydney Gov');

-- Melbourne Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000025', 'avg_salary', 72000, 2024, 'ABS'),
  ('c1000000-0000-0000-0000-000000000025', 'rent_1br', 2200, 2024, 'Domain'),
  ('c1000000-0000-0000-0000-000000000025', 'tech_jobs', 125000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000025', 'restaurants_per_capita', 26.2, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000025', 'green_space_pct', 38, 2024, 'Melbourne Gov');

-- Hong Kong Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000026', 'avg_salary', 62000, 2024, 'C&SD'),
  ('c1000000-0000-0000-0000-000000000026', 'rent_1br', 2800, 2024, 'Spacious'),
  ('c1000000-0000-0000-0000-000000000026', 'tech_jobs', 120000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000026', 'restaurants_per_capita', 45.0, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000026', 'green_space_pct', 40, 2024, 'HK Gov');

-- Bangkok Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000027', 'avg_salary', 22000, 2024, 'NSO'),
  ('c1000000-0000-0000-0000-000000000027', 'rent_1br', 600, 2024, 'DDProperty'),
  ('c1000000-0000-0000-0000-000000000027', 'tech_jobs', 85000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000027', 'restaurants_per_capita', 30.5, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000027', 'green_space_pct', 6, 2024, 'BMA');

-- Dubai Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000028', 'avg_salary', 65000, 2024, 'FCSA'),
  ('c1000000-0000-0000-0000-000000000028', 'rent_1br', 2000, 2024, 'PropertyFinder'),
  ('c1000000-0000-0000-0000-000000000028', 'tech_jobs', 95000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000028', 'restaurants_per_capita', 28.0, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000028', 'green_space_pct', 5, 2024, 'Dubai Gov');

-- Tel Aviv Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000029', 'avg_salary', 58000, 2024, 'CBS Israel'),
  ('c1000000-0000-0000-0000-000000000029', 'rent_1br', 2100, 2024, 'Yad2'),
  ('c1000000-0000-0000-0000-000000000029', 'tech_jobs', 95000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000029', 'restaurants_per_capita', 31.5, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000029', 'green_space_pct', 18, 2024, 'Tel Aviv Gov');

-- Buenos Aires Metrics
INSERT INTO city_metrics (city_id, metric_type, value, year, source) VALUES
  ('c1000000-0000-0000-0000-000000000030', 'avg_salary', 18000, 2024, 'INDEC'),
  ('c1000000-0000-0000-0000-000000000030', 'rent_1br', 500, 2024, 'ZonaProp'),
  ('c1000000-0000-0000-0000-000000000030', 'tech_jobs', 65000, 2024, 'LinkedIn'),
  ('c1000000-0000-0000-0000-000000000030', 'restaurants_per_capita', 24.0, 2024, 'TripAdvisor'),
  ('c1000000-0000-0000-0000-000000000030', 'green_space_pct', 9, 2024, 'Buenos Aires Gov');
