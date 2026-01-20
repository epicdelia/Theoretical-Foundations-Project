import type { VoiceAnalysis, StructurePatterns } from "./types";

/**
 * Analyzes sample posts to extract voice patterns
 */
export function analyzeVoice(samplePosts: string[]): VoiceAnalysis {
  if (samplePosts.length === 0) {
    throw new Error("At least one sample post is required");
  }

  const tone = analyzeTone(samplePosts);
  const structurePatterns = analyzeStructure(samplePosts);
  const emojiUsage = analyzeEmojiUsage(samplePosts);
  const commonPhrases = extractCommonPhrases(samplePosts);
  const ctaStyle = analyzeCTAStyle(samplePosts);
  const averageLength = calculateAverageLength(samplePosts);

  return {
    tone,
    structure_patterns: structurePatterns,
    emoji_usage: emojiUsage,
    common_phrases: commonPhrases,
    cta_style: ctaStyle,
    average_length: averageLength,
  };
}

/**
 * Analyzes the overall tone of posts
 */
function analyzeTone(posts: string[]): string {
  const allText = posts.join(" ").toLowerCase();
  const toneIndicators: Record<string, string[]> = {
    professional: [
      "leverage", "optimize", "strategic", "implement", "insights",
      "stakeholders", "objectives", "deliverables", "synergy", "scalable"
    ],
    casual: [
      "hey", "guys", "gonna", "kinda", "stuff", "cool", "awesome",
      "lol", "btw", "tbh", "ngl", "fr"
    ],
    inspirational: [
      "believe", "dream", "journey", "achieve", "success", "growth",
      "mindset", "potential", "inspire", "transform"
    ],
    educational: [
      "learn", "tip", "here's how", "step", "guide", "tutorial",
      "explained", "breakdown", "understand", "mistake"
    ],
    conversational: [
      "i think", "in my opinion", "personally", "what do you think",
      "let me know", "curious", "wondering", "thoughts?"
    ],
    direct: [
      "stop", "don't", "you need", "you must", "here's the truth",
      "listen", "bottom line", "fact:"
    ],
  };

  const scores: Record<string, number> = {};
  for (const [tone, keywords] of Object.entries(toneIndicators)) {
    scores[tone] = keywords.filter((kw) => allText.includes(kw)).length;
  }

  const sortedTones = Object.entries(scores).sort(([, a], [, b]) => b - a);
  const topTones = sortedTones.filter(([, score]) => score > 0).slice(0, 2);

  if (topTones.length === 0) {
    return "neutral";
  }

  if (topTones.length === 1) {
    return topTones[0][0];
  }

  return `${topTones[0][0]} with ${topTones[1][0]} elements`;
}

/**
 * Analyzes the structure patterns of posts
 */
function analyzeStructure(posts: string[]): StructurePatterns {
  const patterns: StructurePatterns = {
    opening_style: analyzeOpeningStyle(posts),
    paragraph_count: Math.round(
      posts.reduce((sum, post) => sum + countParagraphs(post), 0) / posts.length
    ),
    uses_line_breaks: posts.some((p) => p.includes("\n\n")),
    uses_bullet_points: posts.some((p) => /^[\s]*[-•*]\s/m.test(p)),
    uses_numbered_lists: posts.some((p) => /^[\s]*\d+[.)]\s/m.test(p)),
    uses_hashtags: posts.some((p) => /#\w+/.test(p)),
    hashtag_count: Math.round(
      posts.reduce((sum, post) => sum + (post.match(/#\w+/g) || []).length, 0) /
        posts.length
    ),
    uses_mentions: posts.some((p) => /@\w+/.test(p)),
  };

  return patterns;
}

/**
 * Analyzes how posts typically open
 */
function analyzeOpeningStyle(posts: string[]): string {
  const openings = posts.map((p) => p.split(/[.!?\n]/)[0].toLowerCase().trim());

  const styles: Record<string, number> = {
    question: 0,
    statement: 0,
    hook: 0,
    personal: 0,
  };

  for (const opening of openings) {
    if (opening.endsWith("?") || opening.includes("?")) {
      styles.question++;
    } else if (opening.startsWith("i ") || opening.startsWith("my ")) {
      styles.personal++;
    } else if (
      opening.includes("here's") ||
      opening.includes("unpopular opinion") ||
      opening.includes("hot take") ||
      opening.includes("truth")
    ) {
      styles.hook++;
    } else {
      styles.statement++;
    }
  }

  const [topStyle] = Object.entries(styles).sort(([, a], [, b]) => b - a)[0];
  return topStyle;
}

/**
 * Counts paragraphs in a post
 */
function countParagraphs(text: string): number {
  return text.split(/\n\s*\n/).filter((p) => p.trim()).length || 1;
}

/**
 * Analyzes emoji usage patterns
 */
function analyzeEmojiUsage(posts: string[]): string {
  // Count emojis using a simple approach
  let totalEmojis = 0;
  for (const post of posts) {
    // Count surrogate pairs (most emojis) plus common symbols
    const surrogates = post.match(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g) || [];
    const symbols = post.match(/[\u2600-\u27BF]/g) || [];
    totalEmojis += surrogates.length + symbols.length;
  }

  const avgPerPost = totalEmojis / posts.length;

  if (avgPerPost < 1) {
    return "minimal (occasional single emoji)";
  } else if (avgPerPost < 3) {
    return "moderate (1-2 emojis per post)";
  } else if (avgPerPost < 6) {
    return "frequent (3-5 emojis per post)";
  } else {
    return "heavy (6+ emojis per post)";
  }
}

/**
 * Extracts common phrases and expressions
 */
function extractCommonPhrases(posts: string[]): string[] {
  const phrases: Map<string, number> = new Map();

  // Common n-grams (2-4 words)
  for (const post of posts) {
    const words = post
      .toLowerCase()
      .replace(/[^\w\s']/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 1);

    // Extract 2-grams, 3-grams, and 4-grams
    for (let n = 2; n <= 4; n++) {
      for (let i = 0; i <= words.length - n; i++) {
        const phrase = words.slice(i, i + n).join(" ");
        // Skip phrases that start with common stop words
        if (!isStopWordPhrase(phrase)) {
          phrases.set(phrase, (phrases.get(phrase) || 0) + 1);
        }
      }
    }
  }

  // Filter phrases that appear in at least 2 posts
  const minOccurrence = Math.min(2, Math.ceil(posts.length * 0.3));

  return Array.from(phrases.entries())
    .filter(([, count]) => count >= minOccurrence)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([phrase]) => phrase);
}

/**
 * Checks if a phrase starts with common stop words
 */
function isStopWordPhrase(phrase: string): boolean {
  const stopStarts = [
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "as", "is", "was", "are", "were", "be",
    "been", "being", "have", "has", "had", "do", "does", "did", "will",
    "would", "could", "should", "may", "might", "must", "shall", "can",
    "this", "that", "these", "those", "it", "its"
  ];
  const firstWord = phrase.split(" ")[0];
  return stopStarts.includes(firstWord);
}

/**
 * Analyzes call-to-action style
 */
function analyzeCTAStyle(posts: string[]): string {
  const allText = posts.join(" ").toLowerCase();

  const ctaPatterns: Record<string, string[]> = {
    question: [
      "what do you think", "thoughts?", "agree?", "do you agree",
      "what's your", "have you", "anyone else"
    ],
    engagement: [
      "like if", "share if", "repost", "drop a", "comment below",
      "follow for", "save this"
    ],
    soft: [
      "let me know", "feel free", "happy to", "dm me", "reach out"
    ],
    action: [
      "click", "sign up", "join", "subscribe", "download", "get started",
      "try it", "check out"
    ],
    none: [],
  };

  for (const [style, patterns] of Object.entries(ctaPatterns)) {
    if (style === "none") continue;
    if (patterns.some((p) => allText.includes(p))) {
      return style;
    }
  }

  return "none";
}

/**
 * Calculates average post length in characters
 */
function calculateAverageLength(posts: string[]): number {
  return Math.round(
    posts.reduce((sum, post) => sum + post.length, 0) / posts.length
  );
}

/**
 * Generates a prompt section for content generation based on voice profile
 */
export function generateVoicePrompt(profile: {
  tone: string | null;
  structure_patterns: StructurePatterns;
  emoji_usage: string | null;
  common_phrases: string[];
  cta_style: string | null;
  average_length: number | null;
}): string {
  const sections: string[] = [];

  if (profile.tone) {
    sections.push(`- Tone: ${profile.tone}`);
  }

  if (profile.structure_patterns) {
    const sp = profile.structure_patterns;
    if (sp.opening_style) {
      sections.push(`- Opening style: ${sp.opening_style}`);
    }
    if (sp.uses_bullet_points) {
      sections.push("- Use bullet points when listing items");
    }
    if (sp.uses_numbered_lists) {
      sections.push("- Use numbered lists for sequences");
    }
    if (sp.uses_line_breaks) {
      sections.push("- Add line breaks between paragraphs for readability");
    }
    if (sp.uses_hashtags && sp.hashtag_count) {
      sections.push(`- Include approximately ${sp.hashtag_count} relevant hashtags`);
    }
  }

  if (profile.emoji_usage && profile.emoji_usage !== "none") {
    sections.push(`- Emoji usage: ${profile.emoji_usage}`);
  }

  if (profile.common_phrases && profile.common_phrases.length > 0) {
    const phrases = profile.common_phrases.slice(0, 5).join('", "');
    sections.push(`- Natural phrases to incorporate: "${phrases}"`);
  }

  if (profile.cta_style && profile.cta_style !== "none") {
    sections.push(`- Call-to-action style: ${profile.cta_style}`);
  }

  if (profile.average_length) {
    sections.push(`- Target length: approximately ${profile.average_length} characters`);
  }

  if (sections.length === 0) {
    return "";
  }

  return `\n\nVoice Profile Guidelines:\n${sections.join("\n")}`;
}
