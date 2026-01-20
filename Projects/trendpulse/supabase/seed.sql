-- Seed data for TrendPulse

-- Initial data sources configuration
insert into public.data_sources (name, source_type, config, status) values
  ('Hacker News', 'hackernews', '{"endpoint": "https://hacker-news.firebaseio.com/v0", "items_per_fetch": 30}', 'active'),
  ('Reddit - Programming', 'reddit', '{"subreddit": "programming", "sort": "hot", "limit": 25}', 'active'),
  ('Reddit - Machine Learning', 'reddit', '{"subreddit": "MachineLearning", "sort": "hot", "limit": 25}', 'active'),
  ('GitHub Trending', 'github_trending', '{"language": "all", "since": "daily"}', 'active'),
  ('TechCrunch RSS', 'rss', '{"feed_url": "https://techcrunch.com/feed/"}', 'active'),
  ('The Verge RSS', 'rss', '{"feed_url": "https://www.theverge.com/rss/index.xml"}', 'active'),
  ('Ars Technica RSS', 'rss', '{"feed_url": "https://feeds.arstechnica.com/arstechnica/index"}', 'active'),
  ('Product Hunt', 'product_hunt', '{"posts_per_day": 20}', 'active');
