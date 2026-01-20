import { SupabaseClient } from "@supabase/supabase-js";
import type {
  CSVExportData,
  TrendExportRow,
  ContentExportRow,
  ExportResult,
  PlainTextExportOptions,
  EmailDigestData,
  EmailTrendSummary,
} from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = SupabaseClient<any>;

/**
 * Get trends and content for a specific date
 */
export async function getExportData(
  supabase: Supabase,
  userId: string,
  trendDate: string
): Promise<CSVExportData> {
  // Fetch trends for the date
  const { data: trends, error: trendsError } = await supabase
    .from("trends")
    .select("*")
    .eq("trend_date", trendDate)
    .order("rank", { ascending: true });

  if (trendsError) {
    throw new Error(`Failed to fetch trends: ${trendsError.message}`);
  }

  // Fetch generated content for these trends
  const trendIds = trends?.map((t) => t.id) || [];
  const { data: content, error: contentError } = await supabase
    .from("generated_content")
    .select("*")
    .eq("user_id", userId)
    .in("trend_id", trendIds);

  if (contentError) {
    throw new Error(`Failed to fetch content: ${contentError.message}`);
  }

  // Transform trends to export format
  const trendRows: TrendExportRow[] = (trends || []).map((t) => ({
    rank: t.rank || 0,
    title: t.title,
    summary: t.summary || "",
    why_it_matters: t.why_it_matters || "",
    total_score: t.total_score,
    velocity_score: t.velocity_score,
    cross_platform_score: t.cross_platform_score,
    relevance_score: t.relevance_score,
    novelty_score: t.novelty_score,
    source_count: t.source_count,
    source_urls: t.source_urls.join("; "),
    trend_date: t.trend_date,
  }));

  // Transform content to export format
  const contentRows: ContentExportRow[] = (content || []).map((c) => {
    const metadata = c.metadata as { trend_title?: string; source_urls?: string[] };
    return {
      trend_title: metadata.trend_title || "",
      content_type: c.content_type,
      angle: c.angle || "",
      content: c.content,
      source_urls: (metadata.source_urls || []).join("; "),
      created_at: c.created_at,
    };
  });

  return { trends: trendRows, content: contentRows };
}

/**
 * Convert data to CSV format
 */
export function toCSV(data: (TrendExportRow | ContentExportRow)[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        const value = (row as unknown as Record<string, unknown>)[header];
        const stringValue = value === null || value === undefined ? "" : String(value);
        // Escape quotes and wrap in quotes if contains comma, newline, or quotes
        if (stringValue.includes(",") || stringValue.includes("\n") || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      })
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

/**
 * Export trends and content to CSV
 */
export async function exportToCSV(
  supabase: Supabase,
  userId: string,
  trendDate: string
): Promise<ExportResult> {
  try {
    const data = await getExportData(supabase, userId, trendDate);

    const trendsCSV = toCSV(data.trends);
    const contentCSV = toCSV(data.content);

    const combined = `=== TRENDS ===\n${trendsCSV}\n\n=== GENERATED CONTENT ===\n${contentCSV}`;

    // Log the export
    await supabase.from("exports").insert({
      user_id: userId,
      export_type: "csv",
      trend_date: trendDate,
      metadata: {
        trendsCount: data.trends.length,
        contentCount: data.content.length,
      },
    });

    return {
      success: true,
      data: combined,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Export content as plain text for Buffer/Metricool
 */
export function toPlainText(
  content: string,
  options: PlainTextExportOptions
): string {
  let result = content;

  // Strip markdown formatting for cleaner copy
  result = result
    .replace(/\*\*(.*?)\*\*/g, "$1") // Bold
    .replace(/\*(.*?)\*/g, "$1") // Italic
    .replace(/`(.*?)`/g, "$1") // Code
    .replace(/#{1,6}\s/g, ""); // Headers

  if (!options.includeSources) {
    // Remove source citations
    result = result.replace(/\[Source:.*?\]/gi, "");
    result = result.replace(/Source:.*$/gim, "");
  }

  if (!options.includeHashtags) {
    result = result.replace(/#\w+/g, "");
  }

  // Platform-specific formatting
  if (options.platform === "buffer") {
    // Buffer prefers clean text without special characters
    result = result.replace(/[—–]/g, "-");
  } else if (options.platform === "metricool") {
    // Metricool handles emojis well, keep them
    result = result.trim();
  }

  return result.trim();
}

/**
 * Export to Notion database
 */
export async function exportToNotion(
  supabase: Supabase,
  userId: string,
  trendDate: string,
  notionToken: string,
  databaseId: string
): Promise<ExportResult> {
  try {
    const { trends } = await getExportData(supabase, userId, trendDate);

    const createdPages: string[] = [];

    for (const trend of trends) {
      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${notionToken}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { database_id: databaseId },
          properties: {
            Name: {
              title: [{ text: { content: trend.title } }],
            },
            Summary: {
              rich_text: [{ text: { content: trend.summary.substring(0, 2000) } }],
            },
            "Why It Matters": {
              rich_text: [{ text: { content: trend.why_it_matters.substring(0, 2000) } }],
            },
            Score: {
              number: trend.total_score,
            },
            Rank: {
              number: trend.rank,
            },
            Date: {
              date: { start: trend.trend_date },
            },
            Sources: {
              url: trend.source_urls.split("; ")[0] || null,
            },
          },
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Notion API error: ${JSON.stringify(error)}`);
      }

      const page = await response.json();
      createdPages.push(page.id);
    }

    // Log the export
    await supabase.from("exports").insert({
      user_id: userId,
      export_type: "notion",
      trend_date: trendDate,
      metadata: {
        databaseId,
        pagesCreated: createdPages.length,
        pageIds: createdPages,
      },
    });

    return {
      success: true,
      data: `Created ${createdPages.length} pages in Notion`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Prepare email digest data
 */
export async function prepareEmailDigest(
  supabase: Supabase,
  userId: string,
  trendDate: string
): Promise<EmailDigestData> {
  const data = await getExportData(supabase, userId, trendDate);

  const trends: EmailTrendSummary[] = data.trends.map((t) => ({
    rank: t.rank,
    title: t.title,
    summary: t.summary,
    why_it_matters: t.why_it_matters,
    score: t.total_score,
    sourceUrls: t.source_urls.split("; ").filter(Boolean),
  }));

  const generatedContent = data.content.slice(0, 5).map((c) => ({
    trendTitle: c.trend_title,
    contentType: c.content_type.replace(/_/g, " "),
    preview: c.content.substring(0, 150) + (c.content.length > 150 ? "..." : ""),
  }));

  return {
    date: trendDate,
    trends,
    generatedContent: generatedContent.length > 0 ? generatedContent : undefined,
  };
}

/**
 * Generate email HTML for digest
 */
export function generateDigestEmailHTML(data: EmailDigestData): string {
  const trendsHTML = data.trends
    .map(
      (t) => `
    <div style="margin-bottom: 24px; padding: 16px; background: #f9fafb; border-radius: 8px;">
      <h3 style="margin: 0 0 8px 0; color: #111827;">#${t.rank} ${t.title}</h3>
      <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${t.summary}</p>
      <p style="margin: 0; color: #374151; font-size: 14px;"><strong>Why it matters:</strong> ${t.why_it_matters}</p>
      <p style="margin: 8px 0 0 0; color: #9ca3af; font-size: 12px;">Score: ${t.score.toFixed(1)} | ${t.sourceUrls.length} sources</p>
    </div>
  `
    )
    .join("");

  const contentHTML = data.generatedContent
    ? `
    <h2 style="margin: 32px 0 16px 0; color: #111827;">Your Generated Content</h2>
    ${data.generatedContent
      .map(
        (c) => `
      <div style="margin-bottom: 16px; padding: 12px; border-left: 3px solid #3b82f6;">
        <p style="margin: 0 0 4px 0; font-weight: 600; color: #374151;">${c.trendTitle} - ${c.contentType}</p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">${c.preview}</p>
      </div>
    `
      )
      .join("")}
  `
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="text-align: center; margin-bottom: 32px;">
    <h1 style="margin: 0; color: #111827;">TrendPulse Daily Digest</h1>
    <p style="margin: 8px 0 0 0; color: #6b7280;">${data.date}</p>
  </div>

  <h2 style="margin: 0 0 16px 0; color: #111827;">Today's Top Trends</h2>
  ${trendsHTML}
  ${contentHTML}

  <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center;">
    <p style="margin: 0; color: #9ca3af; font-size: 12px;">
      Generated by TrendPulse | <a href="#" style="color: #3b82f6;">View in Dashboard</a>
    </p>
  </div>
</body>
</html>
`;
}

/**
 * Send email digest using Resend API
 */
export async function sendEmailDigest(
  supabase: Supabase,
  userId: string,
  trendDate: string,
  recipientEmail: string,
  resendApiKey: string
): Promise<ExportResult> {
  try {
    const data = await prepareEmailDigest(supabase, userId, trendDate);
    const html = generateDigestEmailHTML(data);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "TrendPulse <digest@trendpulse.app>",
        to: recipientEmail,
        subject: `TrendPulse Daily Digest - ${trendDate}`,
        html,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Resend API error: ${JSON.stringify(error)}`);
    }

    const result = await response.json();

    // Log the export
    await supabase.from("exports").insert({
      user_id: userId,
      export_type: "email",
      trend_date: trendDate,
      metadata: {
        emailId: result.id,
        recipient: recipientEmail,
      },
    });

    return {
      success: true,
      data: `Email sent to ${recipientEmail}`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
