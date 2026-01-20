import type { VoiceProfile } from "@/lib/voice/types";
import { generateVoicePrompt } from "@/lib/voice/analyzer";
import type { TrendForGeneration, ContentAngle } from "./types";
import { ANGLE_DESCRIPTIONS, PLATFORM_GUIDELINES } from "./types";

/**
 * Builds the base context about the trend for content generation
 */
export function buildTrendContext(trend: TrendForGeneration): string {
  const sections: string[] = [];

  sections.push(`# Trend: ${trend.title}`);

  if (trend.summary) {
    sections.push(`\n## Summary\n${trend.summary}`);
  }

  if (trend.why_it_matters) {
    sections.push(`\n## Why It Matters\n${trend.why_it_matters}`);
  }

  if (trend.signals.matchedKeywords && trend.signals.matchedKeywords.length > 0) {
    sections.push(
      `\n## Related Keywords\n${trend.signals.matchedKeywords.join(", ")}`
    );
  }

  // Add source citation requirements
  if (trend.source_urls.length > 0) {
    sections.push(`\n## Verified Sources (cite these, do not make up URLs)`);
    trend.source_urls.slice(0, 3).forEach((url, i) => {
      sections.push(`${i + 1}. ${url}`);
    });
  }

  sections.push(
    `\n## Signals\n- Mentions in last 24h: ${trend.signals.mentionCount24h}`
  );
  sections.push(`- Platforms discussing: ${trend.signals.sourceTypes.join(", ")}`);

  return sections.join("\n");
}

/**
 * Builds the LinkedIn post generation prompt
 */
export function buildLinkedInPrompt(
  trend: TrendForGeneration,
  angle: ContentAngle,
  voiceProfile?: VoiceProfile | null
): string {
  const trendContext = buildTrendContext(trend);
  const voiceGuidelines = voiceProfile
    ? generateVoicePrompt({
        tone: voiceProfile.tone,
        structure_patterns: voiceProfile.structure_patterns,
        emoji_usage: voiceProfile.emoji_usage,
        common_phrases: voiceProfile.common_phrases,
        cta_style: voiceProfile.cta_style,
        average_length: voiceProfile.average_length,
      })
    : "";

  return `You are a professional content writer creating a LinkedIn post.

${trendContext}

## Content Angle
${ANGLE_DESCRIPTIONS[angle]}

## Platform Guidelines
${PLATFORM_GUIDELINES.linkedin_post.description}
Maximum length: ${PLATFORM_GUIDELINES.linkedin_post.maxLength} characters
${voiceGuidelines}

## CRITICAL RULES
1. DO NOT hallucinate facts, statistics, or quotes. Only use information from the trend context above.
2. If you mention sources, use ONLY the verified source URLs provided above.
3. Do not make up company names, product names, or statistics that aren't in the context.
4. If unsure about a detail, speak in general terms rather than inventing specifics.

## Output Format
Write a LinkedIn post that:
- Opens with a compelling hook (question, bold statement, or insight)
- Provides value through the ${angle} angle
- Uses line breaks between paragraphs for readability
- Ends with an engagement question or call-to-action
- Includes 3-5 relevant hashtags at the end

Output ONLY the post content, nothing else.`;
}

/**
 * Builds the Twitter thread generation prompt
 */
export function buildTwitterThreadPrompt(
  trend: TrendForGeneration,
  angle: ContentAngle,
  voiceProfile?: VoiceProfile | null
): string {
  const trendContext = buildTrendContext(trend);
  const voiceGuidelines = voiceProfile
    ? generateVoicePrompt({
        tone: voiceProfile.tone,
        structure_patterns: voiceProfile.structure_patterns,
        emoji_usage: voiceProfile.emoji_usage,
        common_phrases: voiceProfile.common_phrases,
        cta_style: voiceProfile.cta_style,
        average_length: Math.min(voiceProfile.average_length || 280, 280),
      })
    : "";

  return `You are a Twitter content creator writing a viral thread.

${trendContext}

## Content Angle
${ANGLE_DESCRIPTIONS[angle]}

## Platform Guidelines
${PLATFORM_GUIDELINES.twitter_thread.description}
${voiceGuidelines}

## CRITICAL RULES
1. DO NOT hallucinate facts, statistics, or quotes. Only use information from the trend context above.
2. If you mention sources, use ONLY the verified source URLs provided above.
3. Do not make up company names, product names, or statistics that aren't in the context.
4. Each tweet MUST be under 280 characters.

## Output Format
Write a Twitter thread with:
- Tweet 1 (HOOK): Attention-grabbing opening that makes people want to read more. End with something like "A thread 🧵"
- Tweets 2-6: Value-packed content following the ${angle} angle
- Tweet 7: Summary or key takeaway
- Tweet 8 (CTA): Engagement ask (follow, retweet, discuss)

Format each tweet on a new line, prefixed with the tweet number:
1/ [hook tweet]
2/ [content tweet]
...

Output ONLY the thread, nothing else.`;
}

/**
 * Builds the Instagram Reel script generation prompt
 */
export function buildInstagramReelPrompt(
  trend: TrendForGeneration,
  angle: ContentAngle,
  voiceProfile?: VoiceProfile | null
): string {
  const trendContext = buildTrendContext(trend);
  const voiceGuidelines = voiceProfile
    ? generateVoicePrompt({
        tone: voiceProfile.tone,
        structure_patterns: voiceProfile.structure_patterns,
        emoji_usage: voiceProfile.emoji_usage,
        common_phrases: voiceProfile.common_phrases,
        cta_style: voiceProfile.cta_style,
        average_length: 500,
      })
    : "";

  return `You are creating a script for a 30-45 second Instagram Reel.

${trendContext}

## Content Angle
${ANGLE_DESCRIPTIONS[angle]}

## Platform Guidelines
${PLATFORM_GUIDELINES.instagram_reel_script.description}
${voiceGuidelines}

## CRITICAL RULES
1. DO NOT hallucinate facts, statistics, or quotes. Only use information from the trend context above.
2. The script should be spoken aloud, so write conversationally.
3. Time it: average speaking pace is ~150 words per minute, so aim for 75-110 words total.

## Output Format
Write the script with these clearly labeled sections:

[HOOK - First 3 seconds]
(Attention-grabbing opening that stops the scroll. Question, bold claim, or pattern interrupt.)

[BODY - 20-35 seconds]
(Main content following the ${angle} angle. Deliver value quickly.)

[CTA - 5 seconds]
(Clear call to action: follow, comment, share, or visit link in bio.)

[LOOP]
(A phrase that connects back to the hook, encouraging rewatches.)

Output ONLY the script sections, nothing else.`;
}

/**
 * Builds the reply bank generation prompt
 */
export function buildReplyBankPrompt(
  trend: TrendForGeneration,
  voiceProfile?: VoiceProfile | null
): string {
  const trendContext = buildTrendContext(trend);
  const voiceGuidelines = voiceProfile
    ? generateVoicePrompt({
        tone: voiceProfile.tone,
        structure_patterns: voiceProfile.structure_patterns,
        emoji_usage: voiceProfile.emoji_usage,
        common_phrases: voiceProfile.common_phrases,
        cta_style: voiceProfile.cta_style,
        average_length: Math.min(voiceProfile.average_length || 200, 200),
      })
    : "";

  return `You are creating a bank of engaging replies for social media discussions about this trend.

${trendContext}

## Guidelines
- Each reply should be punchy and conversation-starting
- Vary the tones: witty, bold, provocative, insightful, contrarian
- Keep replies under 200 characters for maximum engagement
- Each should work as a standalone comment on posts about this trend
${voiceGuidelines}

## CRITICAL RULES
1. DO NOT hallucinate facts or statistics. Only reference information from the trend context.
2. Replies should be spicy but not offensive or harmful.
3. Each reply should add value or a unique perspective.

## Output Format
Generate exactly 5 replies, each on a new line with its tone:

[WITTY] reply text here
[BOLD] reply text here
[PROVOCATIVE] reply text here
[INSIGHTFUL] reply text here
[CONTRARIAN] reply text here

Output ONLY the 5 labeled replies, nothing else.`;
}
