import type { VoiceProfile } from "@/lib/voice/types";
import type {
  TrendForGeneration,
  ContentAngle,
  LinkedInPost,
  TwitterThread,
  InstagramReelScript,
  ReplyBank,
  SpicyReply,
} from "./types";
import {
  buildLinkedInPrompt,
  buildTwitterThreadPrompt,
  buildInstagramReelPrompt,
  buildReplyBankPrompt,
} from "./prompt-builder";

/**
 * Simple AI completion function using Claude API
 * In production, this would use the actual Anthropic SDK
 */
async function generateCompletion(prompt: string): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is not set");
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI generation failed: ${error}`);
  }

  const data = await response.json();
  const content = data.content?.[0]?.text;

  if (!content) {
    throw new Error("No content generated");
  }

  return content;
}

/**
 * Generates a LinkedIn post for a trend
 */
export async function generateLinkedInPost(
  trend: TrendForGeneration,
  angle: ContentAngle,
  voiceProfile?: VoiceProfile | null
): Promise<LinkedInPost> {
  const prompt = buildLinkedInPrompt(trend, angle, voiceProfile);
  const content = await generateCompletion(prompt);

  // Extract hashtags from the content
  const hashtagMatches = content.match(/#\w+/g) || [];
  const hashtags = Array.from(new Set(hashtagMatches));

  return {
    content,
    hashtags,
    characterCount: content.length,
  };
}

/**
 * Generates a Twitter thread for a trend
 */
export async function generateTwitterThread(
  trend: TrendForGeneration,
  angle: ContentAngle,
  voiceProfile?: VoiceProfile | null
): Promise<TwitterThread> {
  const prompt = buildTwitterThreadPrompt(trend, angle, voiceProfile);
  const content = await generateCompletion(prompt);

  // Parse the thread into individual tweets
  const tweetLines = content.split("\n").filter((line) => line.trim());
  const tweets: string[] = [];
  let hook = "";

  for (const line of tweetLines) {
    // Match patterns like "1/", "1.", "1)", or just numbered content
    const match = line.match(/^\d+[\/\.\)]\s*(.+)$/);
    if (match) {
      const tweetContent = match[1].trim();
      if (tweets.length === 0) {
        hook = tweetContent;
      }
      tweets.push(tweetContent);
    }
  }

  // If parsing failed, treat the whole content as a single-format thread
  if (tweets.length === 0) {
    const lines = content.split("\n").filter((l) => l.trim());
    hook = lines[0] || content;
    tweets.push(...lines);
  }

  return {
    hook,
    tweets,
    totalTweets: tweets.length,
  };
}

/**
 * Generates an Instagram Reel script for a trend
 */
export async function generateInstagramReelScript(
  trend: TrendForGeneration,
  angle: ContentAngle,
  voiceProfile?: VoiceProfile | null
): Promise<InstagramReelScript> {
  const prompt = buildInstagramReelPrompt(trend, angle, voiceProfile);
  const content = await generateCompletion(prompt);

  // Parse the script sections
  const sections = {
    hook: "",
    body: "",
    cta: "",
    loop: "",
  };

  // Extract each section using regex
  const hookMatch = content.match(
    /\[HOOK[^\]]*\]\s*([\s\S]*?)(?=\[BODY|\[CTA|\[LOOP|$)/i
  );
  const bodyMatch = content.match(
    /\[BODY[^\]]*\]\s*([\s\S]*?)(?=\[CTA|\[LOOP|$)/i
  );
  const ctaMatch = content.match(/\[CTA[^\]]*\]\s*([\s\S]*?)(?=\[LOOP|$)/i);
  const loopMatch = content.match(/\[LOOP[^\]]*\]\s*([\s\S]*?)$/i);

  if (hookMatch) sections.hook = hookMatch[1].trim();
  if (bodyMatch) sections.body = bodyMatch[1].trim();
  if (ctaMatch) sections.cta = ctaMatch[1].trim();
  if (loopMatch) sections.loop = loopMatch[1].trim();

  // If parsing failed, use the whole content
  if (!sections.hook && !sections.body) {
    sections.body = content;
  }

  // Estimate duration based on word count (~150 words per minute)
  const totalWords = content.split(/\s+/).length;
  const estimatedDuration = Math.round((totalWords / 150) * 60);

  return {
    hook: sections.hook,
    body: sections.body,
    cta: sections.cta,
    loop: sections.loop,
    estimatedDuration: Math.min(Math.max(estimatedDuration, 30), 60),
  };
}

/**
 * Generates a reply bank for a trend
 */
export async function generateReplyBank(
  trend: TrendForGeneration,
  voiceProfile?: VoiceProfile | null
): Promise<ReplyBank> {
  const prompt = buildReplyBankPrompt(trend, voiceProfile);
  const content = await generateCompletion(prompt);

  // Parse replies
  const replies: SpicyReply[] = [];
  const toneMap: Record<string, SpicyReply["tone"]> = {
    WITTY: "witty",
    BOLD: "bold",
    PROVOCATIVE: "provocative",
    INSIGHTFUL: "insightful",
    CONTRARIAN: "contrarian",
  };

  const lines = content.split("\n").filter((line) => line.trim());

  for (const line of lines) {
    const match = line.match(
      /\[(WITTY|BOLD|PROVOCATIVE|INSIGHTFUL|CONTRARIAN)\]\s*(.+)/i
    );
    if (match) {
      const tone = toneMap[match[1].toUpperCase()];
      const replyText = match[2].trim();
      if (tone && replyText) {
        replies.push({
          reply: replyText,
          tone,
          characterCount: replyText.length,
        });
      }
    }
  }

  // If we couldn't parse properly, create generic entries
  if (replies.length === 0) {
    const genericLines = content.split("\n").filter((l) => l.trim());
    const tones: SpicyReply["tone"][] = [
      "witty",
      "bold",
      "provocative",
      "insightful",
      "contrarian",
    ];
    genericLines.slice(0, 5).forEach((line, i) => {
      replies.push({
        reply: line.replace(/^[-•*\d.)\]]+\s*/, "").trim(),
        tone: tones[i % tones.length],
        characterCount: line.length,
      });
    });
  }

  return {
    replies: replies.slice(0, 5),
    trend_title: trend.title,
  };
}

/**
 * Formats generated content for storage
 */
export function formatContentForStorage(
  contentType: "linkedin_post" | "twitter_thread" | "instagram_reel_script" | "reply",
  result: LinkedInPost | TwitterThread | InstagramReelScript | ReplyBank
): string {
  switch (contentType) {
    case "linkedin_post": {
      const post = result as LinkedInPost;
      return post.content;
    }
    case "twitter_thread": {
      const thread = result as TwitterThread;
      return thread.tweets.map((t, i) => `${i + 1}/ ${t}`).join("\n\n");
    }
    case "instagram_reel_script": {
      const script = result as InstagramReelScript;
      const sections: string[] = [];
      if (script.hook) sections.push(`[HOOK]\n${script.hook}`);
      if (script.body) sections.push(`[BODY]\n${script.body}`);
      if (script.cta) sections.push(`[CTA]\n${script.cta}`);
      if (script.loop) sections.push(`[LOOP]\n${script.loop}`);
      return sections.join("\n\n");
    }
    case "reply": {
      const bank = result as ReplyBank;
      return bank.replies
        .map((r) => `[${r.tone.toUpperCase()}] ${r.reply}`)
        .join("\n\n");
    }
  }
}
