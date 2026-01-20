import { createClient } from "@/lib/supabase/server";
import type { SourceType } from "@/lib/supabase/types";
import type { DataSource, ConnectorStatusInfo } from "./types";
import { createConnector } from "./factory";
import { rateLimiter } from "./rate-limiter";

/**
 * Fetch result with source info
 */
interface SourceFetchResult {
  sourceId: string;
  sourceName: string;
  sourceType: SourceType;
  success: boolean;
  itemsSaved: number;
  error?: string;
  rateLimited?: boolean;
}

/**
 * Connector service for managing data source operations
 */
export class ConnectorService {
  /**
   * Fetch all active data sources
   */
  async getActiveSources(): Promise<DataSource[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("data_sources")
      .select("*")
      .in("status", ["active", "error"]) // Include error status to allow retries
      .order("source_type");

    if (error) {
      throw new Error(`Failed to fetch data sources: ${error.message}`);
    }

    return (data ?? []) as DataSource[];
  }

  /**
   * Fetch a single data source by ID
   */
  async getSource(id: string): Promise<DataSource | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("data_sources")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to fetch data source: ${error.message}`);
    }

    return data as DataSource;
  }

  /**
   * Fetch all data sources by type
   */
  async getSourcesByType(sourceType: SourceType): Promise<DataSource[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("data_sources")
      .select("*")
      .eq("source_type", sourceType);

    if (error) {
      throw new Error(`Failed to fetch data sources: ${error.message}`);
    }

    return (data ?? []) as DataSource[];
  }

  /**
   * Fetch items from a single source with error handling
   */
  async fetchSource(sourceId: string): Promise<SourceFetchResult> {
    const source = await this.getSource(sourceId);

    if (!source) {
      return {
        sourceId,
        sourceName: "Unknown",
        sourceType: "hackernews",
        success: false,
        itemsSaved: 0,
        error: "Source not found",
      };
    }

    // Check if source is rate limited
    if (rateLimiter.isBlocked(sourceId)) {
      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.source_type,
        success: false,
        itemsSaved: 0,
        error: "Rate limited",
        rateLimited: true,
      };
    }

    try {
      const connector = createConnector(source);
      const result = await connector.fetchAndSave();

      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.source_type,
        success: result.success,
        itemsSaved: result.itemsSaved,
        error: result.error,
        rateLimited: false,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return {
        sourceId: source.id,
        sourceName: source.name,
        sourceType: source.source_type,
        success: false,
        itemsSaved: 0,
        error: errorMessage,
      };
    }
  }

  /**
   * Fetch items from all active sources with fallback handling
   */
  async fetchAllSources(): Promise<{
    results: SourceFetchResult[];
    totalItems: number;
    successCount: number;
    failureCount: number;
  }> {
    const sources = await this.getActiveSources();
    const results: SourceFetchResult[] = [];
    let totalItems = 0;
    let successCount = 0;
    let failureCount = 0;

    // Process sources in batches to avoid overwhelming APIs
    const batchSize = 3;
    for (let i = 0; i < sources.length; i += batchSize) {
      const batch = sources.slice(i, i + batchSize);

      const batchResults = await Promise.all(
        batch.map((source) => this.fetchSource(source.id))
      );

      for (const result of batchResults) {
        results.push(result);
        totalItems += result.itemsSaved;

        if (result.success) {
          successCount++;
        } else {
          failureCount++;
        }
      }

      // Small delay between batches
      if (i + batchSize < sources.length) {
        await this.delay(1000);
      }
    }

    // Log the job
    await this.logJob(
      "fetch_sources",
      failureCount === 0 ? "completed" : "completed",
      totalItems,
      results.filter((r) => !r.success).map((r) => r.error).join("; ") || null
    );

    return {
      results,
      totalItems,
      successCount,
      failureCount,
    };
  }

  /**
   * Get status information for all connectors
   */
  async getConnectorStatuses(): Promise<ConnectorStatusInfo[]> {
    const supabase = await createClient();

    // Get all sources
    const { data: sources, error: sourcesError } = await supabase
      .from("data_sources")
      .select("*")
      .order("source_type");

    if (sourcesError) {
      throw new Error(`Failed to fetch data sources: ${sourcesError.message}`);
    }

    // Get today's item counts per source
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: itemCounts, error: itemsError } = await supabase
      .from("raw_items")
      .select("source_id")
      .gte("fetched_at", today.toISOString());

    if (itemsError) {
      throw new Error(`Failed to fetch item counts: ${itemsError.message}`);
    }

    // Count items per source
    const countMap = new Map<string, number>();
    for (const item of itemCounts ?? []) {
      const current = countMap.get(item.source_id) ?? 0;
      countMap.set(item.source_id, current + 1);
    }

    // Build status info
    const statuses: ConnectorStatusInfo[] = (sources ?? []).map((source) => {
      const hasError = source.status === "error";
      const isHealthy = source.status === "active" && !hasError;

      return {
        id: source.id,
        name: source.name,
        sourceType: source.source_type,
        status: source.status,
        lastFetchAt: source.last_fetch_at,
        lastError: source.last_error,
        rateLimitResetAt: source.rate_limit_reset_at,
        itemsFetchedToday: countMap.get(source.id) ?? 0,
        isHealthy,
      };
    });

    return statuses;
  }

  /**
   * Get connector health summary
   */
  async getHealthSummary(): Promise<{
    total: number;
    healthy: number;
    error: number;
    rateLimited: number;
    inactive: number;
  }> {
    const statuses = await this.getConnectorStatuses();

    return {
      total: statuses.length,
      healthy: statuses.filter((s) => s.status === "active").length,
      error: statuses.filter((s) => s.status === "error").length,
      rateLimited: statuses.filter((s) => s.status === "rate_limited").length,
      inactive: statuses.filter((s) => s.status === "inactive").length,
    };
  }

  /**
   * Reset a source's error status
   */
  async resetSourceStatus(sourceId: string): Promise<void> {
    const supabase = await createClient();

    await supabase
      .from("data_sources")
      .update({
        status: "active",
        last_error: null,
        rate_limit_reset_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sourceId);

    // Reset rate limiter state
    rateLimiter.reset(sourceId);
  }

  /**
   * Log a job execution
   */
  private async logJob(
    jobType: "fetch_sources" | "score_trends" | "send_digest",
    status: "running" | "completed" | "failed",
    itemsProcessed: number,
    errorMessage: string | null
  ): Promise<void> {
    const supabase = await createClient();

    await supabase.from("job_logs").insert({
      job_type: jobType,
      status,
      items_processed: itemsProcessed,
      error_message: errorMessage,
      completed_at: status !== "running" ? new Date().toISOString() : null,
    });
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const connectorService = new ConnectorService();
