"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConnectorStatusCard } from "./connector-status-card";
import {
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Loader2,
  Activity,
} from "lucide-react";
import type { ConnectorStatusInfo } from "@/lib/connectors";

interface HealthSummary {
  total: number;
  healthy: number;
  error: number;
  rateLimited: number;
  inactive: number;
}

interface ConnectorData {
  connectors: ConnectorStatusInfo[];
  summary: HealthSummary;
}

export function ConnectorDashboard() {
  const [data, setData] = useState<ConnectorData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const response = await fetch("/api/connectors");
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch connector data");
      }

      setData(result.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
  };

  const handleFetchAll = async () => {
    setIsFetchingAll(true);
    try {
      const response = await fetch("/api/connectors/fetch", {
        method: "POST",
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch from connectors");
      }

      // Refresh the dashboard data
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsFetchingAll(false);
    }
  };

  const handleConnectorRefresh = async (id: string) => {
    try {
      const response = await fetch(`/api/connectors/${id}`, {
        method: "POST",
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to fetch from connector");
      }

      // Refresh the dashboard data
      await fetchData();
    } catch (err) {
      console.error("Error refreshing connector:", err);
    }
  };

  const handleConnectorReset = async (id: string) => {
    try {
      const response = await fetch(`/api/connectors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset" }),
      });
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to reset connector");
      }

      // Refresh the dashboard data
      await fetchData();
    } catch (err) {
      console.error("Error resetting connector:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="flex items-center gap-2 py-6">
          <AlertCircle className="h-5 w-5 text-destructive" />
          <span className="text-destructive">{error}</span>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const { connectors, summary } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Connector Status
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage your data source connectors
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={handleFetchAll}
            disabled={isFetchingAll}
          >
            {isFetchingAll ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            Fetch All
          </Button>
        </div>
      </div>

      {/* Health Summary */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Connectors</CardDescription>
            <CardTitle className="text-3xl">{summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Healthy
            </CardDescription>
            <CardTitle className="text-3xl text-green-500">
              {summary.healthy}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              Errors
            </CardDescription>
            <CardTitle className="text-3xl text-destructive">
              {summary.error}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Clock className="h-4 w-4 text-yellow-500" />
              Rate Limited
            </CardDescription>
            <CardTitle className="text-3xl text-yellow-500">
              {summary.rateLimited}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Connector Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {connectors.map((connector) => (
          <ConnectorStatusCard
            key={connector.id}
            connector={connector}
            onRefresh={handleConnectorRefresh}
            onReset={handleConnectorReset}
          />
        ))}
      </div>

      {connectors.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Activity className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No connectors found</h3>
            <p className="text-muted-foreground">
              Configure data sources in the database to get started.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
