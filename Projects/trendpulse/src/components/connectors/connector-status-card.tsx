"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Flame,
  MessageSquare,
  Github,
  Rss,
  Rocket,
  Globe,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react";
import type { ConnectorStatusInfo } from "@/lib/connectors";
import type { SourceType, ConnectorStatus } from "@/lib/supabase/types";

interface ConnectorStatusCardProps {
  connector: ConnectorStatusInfo;
  onRefresh?: (id: string) => Promise<void>;
  onReset?: (id: string) => Promise<void>;
}

const sourceTypeIcons: Record<SourceType, React.ReactNode> = {
  hackernews: <Flame className="h-5 w-5 text-orange-500" />,
  reddit: <MessageSquare className="h-5 w-5 text-orange-600" />,
  github_trending: <Github className="h-5 w-5" />,
  rss: <Rss className="h-5 w-5 text-orange-400" />,
  product_hunt: <Rocket className="h-5 w-5 text-red-500" />,
};

const statusBadgeVariants: Record<
  ConnectorStatus,
  "success" | "destructive" | "warning" | "secondary"
> = {
  active: "success",
  error: "destructive",
  rate_limited: "warning",
  inactive: "secondary",
};

const statusLabels: Record<ConnectorStatus, string> = {
  active: "Active",
  error: "Error",
  rate_limited: "Rate Limited",
  inactive: "Inactive",
};

export function ConnectorStatusCard({
  connector,
  onRefresh,
  onReset,
}: ConnectorStatusCardProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh(connector.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleReset = async () => {
    if (!onReset) return;
    setIsResetting(true);
    try {
      await onReset(connector.id);
    } finally {
      setIsResetting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleString();
  };

  const formatRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <Card className={connector.status === "error" ? "border-destructive/50" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {sourceTypeIcons[connector.sourceType] || (
              <Globe className="h-5 w-5" />
            )}
            <CardTitle className="text-base">{connector.name}</CardTitle>
          </div>
          <Badge variant={statusBadgeVariants[connector.status]}>
            {statusLabels[connector.status]}
          </Badge>
        </div>
        <CardDescription className="text-xs">
          {connector.sourceType.replace("_", " ")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Last fetch:</span>
          </div>
          <div className="text-right" title={formatDate(connector.lastFetchAt)}>
            {formatRelativeTime(connector.lastFetchAt)}
          </div>

          <div className="flex items-center gap-1 text-muted-foreground">
            <CheckCircle className="h-3.5 w-3.5" />
            <span>Items today:</span>
          </div>
          <div className="text-right font-medium">
            {connector.itemsFetchedToday}
          </div>
        </div>

        {connector.lastError && (
          <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-2 text-xs text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="line-clamp-2">{connector.lastError}</span>
          </div>
        )}

        {connector.rateLimitResetAt && (
          <div className="flex items-center gap-2 rounded-md bg-yellow-500/10 p-2 text-xs text-yellow-600">
            <Clock className="h-4 w-4 shrink-0" />
            <span>Resets: {formatDate(connector.rateLimitResetAt)}</span>
          </div>
        )}

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={handleRefresh}
            disabled={isRefreshing || connector.status === "rate_limited"}
          >
            {isRefreshing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Fetch
          </Button>
          {(connector.status === "error" ||
            connector.status === "rate_limited") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={isResetting}
            >
              {isResetting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Reset"
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
