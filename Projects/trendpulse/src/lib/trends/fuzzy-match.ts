/**
 * Simple fuzzy matching utilities for deduplicating trend topics
 * Uses Levenshtein distance and token-based similarity
 */

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity ratio between two strings (0-1)
 */
export function stringSimilarity(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  const distance = levenshteinDistance(a, b);
  return 1 - distance / maxLength;
}

/**
 * Normalize a title for comparison
 * - Lowercase
 * - Remove special characters
 * - Remove common stop words
 * - Trim and collapse whitespace
 */
export function normalizeTitle(title: string): string {
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "have",
    "has",
    "had",
    "do",
    "does",
    "did",
    "will",
    "would",
    "could",
    "should",
    "may",
    "might",
    "must",
    "shall",
    "can",
    "need",
    "to",
    "of",
    "in",
    "for",
    "on",
    "with",
    "at",
    "by",
    "from",
    "up",
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "under",
    "again",
    "further",
    "then",
    "once",
    "here",
    "there",
    "when",
    "where",
    "why",
    "how",
    "all",
    "each",
    "few",
    "more",
    "most",
    "other",
    "some",
    "such",
    "no",
    "not",
    "only",
    "own",
    "same",
    "so",
    "than",
    "too",
    "very",
    "just",
    "and",
    "but",
    "or",
    "if",
    "because",
    "as",
    "until",
    "while",
    "this",
    "that",
    "these",
    "those",
    "what",
    "which",
    "who",
    "whom",
    "its",
    "it",
    "he",
    "she",
    "they",
    "we",
    "you",
    "i",
    "me",
    "my",
    "your",
    "his",
    "her",
    "their",
    "our",
  ]);

  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, " ") // Remove special characters
    .split(/\s+/)
    .filter((word) => word.length > 0 && !stopWords.has(word))
    .join(" ")
    .trim();
}

/**
 * Extract significant tokens from a title
 */
export function extractTokens(title: string): Set<string> {
  const normalized = normalizeTitle(title);
  return new Set(normalized.split(/\s+/).filter((t) => t.length > 2));
}

/**
 * Calculate Jaccard similarity between two token sets
 */
export function tokenSimilarity(tokens1: Set<string>, tokens2: Set<string>): number {
  if (tokens1.size === 0 && tokens2.size === 0) return 1;
  if (tokens1.size === 0 || tokens2.size === 0) return 0;

  const intersection = new Set(Array.from(tokens1).filter((t) => tokens2.has(t)));
  const union = new Set([...Array.from(tokens1), ...Array.from(tokens2)]);

  return intersection.size / union.size;
}

/**
 * Check if two titles are similar enough to be considered the same topic
 * Uses a combination of string similarity and token similarity
 */
export function areTitlesSimilar(
  title1: string,
  title2: string,
  threshold: number = 0.5
): boolean {
  const norm1 = normalizeTitle(title1);
  const norm2 = normalizeTitle(title2);

  // Exact match after normalization
  if (norm1 === norm2) return true;

  // Calculate token similarity (Jaccard)
  const tokens1 = extractTokens(title1);
  const tokens2 = extractTokens(title2);
  const tokenSim = tokenSimilarity(tokens1, tokens2);

  // If token similarity is high, consider them similar
  if (tokenSim >= threshold) return true;

  // For shorter titles, use string similarity as a fallback
  if (norm1.length < 30 && norm2.length < 30) {
    const strSim = stringSimilarity(norm1, norm2);
    if (strSim >= 0.7) return true;
  }

  return false;
}

/**
 * Find the best representative title from a group of similar titles
 * Prefers titles that are:
 * 1. Not too short (informative)
 * 2. Not too long (concise)
 * 3. Have the highest score
 */
export function selectBestTitle(
  items: Array<{ title: string; score: number }>
): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0].title;

  // Filter out very short titles (less than 10 chars)
  const validItems = items.filter((item) => item.title.length >= 10);
  const pool = validItems.length > 0 ? validItems : items;

  // Sort by score descending, then by title length (prefer medium length)
  const sorted = [...pool].sort((a, b) => {
    // Higher score is better
    if (b.score !== a.score) return b.score - a.score;

    // Prefer titles between 30-100 chars
    const idealLength = 60;
    const aDist = Math.abs(a.title.length - idealLength);
    const bDist = Math.abs(b.title.length - idealLength);
    return aDist - bDist;
  });

  return sorted[0].title;
}
