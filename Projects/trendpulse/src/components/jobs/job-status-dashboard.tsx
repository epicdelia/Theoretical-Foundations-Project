"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  Activity,
  Database,
  TrendingUp,
  Mail,
} from "lucide-react";

interface JobLog {
  id: string;
  job_type: "fetch_sources" | "score_trends" | "send_digest";
  status: "running" | "completed" | "failed";
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  items_processed: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
}

const JOB_CONFIG = {
  fetch_sources: {
    label: "Fetch Sources",
    description: "Pull data from all connected sources",
    icon: Database,
    schedule: "Every 2 hours",
  },
  score_trends: {
    label: "Score Trends",
    description: "Analyze and rank today's trends",
    icon: TrendingUp,
    schedule: "Daily at 6 AM UTC",
  },
  send_digest: {
    label: "Send Digests",
    description: "Send email digests to subscribed users",
    icon: Mail,
    schedule: "Hourly (checks user timezone)",
  },
};

export function JobStatusDashboard() {
  const [jobs, setJobs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch("/api/jobs?limit=20");
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to fetch jobs");
      }

      setJobs(data.data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch jobs");
    } finally {
      setLoading(false);
    }
  }, []);

  const triggerJob = async (jobType: string) => {
    setTriggering(jobType);
    setError(null);

    try {
      const response = await fetch("/api/jobs/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to trigger job");
      }

      // Refresh job list
      await fetchJobs();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to trigger job");
    } finally {
      setTriggering(null);
    }
  };

  useEffect(() => {
    fetchJobs();
    // Refresh every 30 seconds
    const interval = setInterval(fetchJobs, 30000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const getStatusIcon = (status: JobLog["status"]) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: JobLog["status"]) => {
    const variants: Record<JobLog["status"], "default" | "secondary" | "destructive"> = {
      running: "default",
      completed: "secondary",
      failed: "destructive",
    };
    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return "-";
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Get latest job for each type
  const latestByType = jobs.reduce(
    (acc, job) => {
      if (!acc[job.job_type]) {
        acc[job.job_type] = job;
      }
      return acc;
    },
    {} as Record<string, JobLog>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6" />
            Scheduled Jobs
          </h2>
          <p className="text-muted-foreground">
            Monitor and manually trigger background jobs
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchJobs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="flex items-center gap-3 py-4">
            <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
            <span className="text-sm text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Job Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {(Object.entries(JOB_CONFIG) as [keyof typeof JOB_CONFIG, typeof JOB_CONFIG[keyof typeof JOB_CONFIG]][]).map(
          ([jobType, config]) => {
            const Icon = config.icon;
            const latest = latestByType[jobType];

            return (
              <Card key={jobType}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <CardTitle className="text-lg">{config.label}</CardTitle>
                    </div>
                    {latest && getStatusIcon(latest.status)}
                  </div>
                  <CardDescription>{config.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{config.schedule}</span>
                  </div>

                  {latest && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Last run:</span>
                        <span>{formatTime(latest.started_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Duration:</span>
                        <span>{formatDuration(latest.duration_ms)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Processed:</span>
                        <span>{latest.items_processed} items</span>
                      </div>
                      {latest.error_message && (
                        <p className="text-xs text-destructive truncate">
                          {latest.error_message}
                        </p>
                      )}
                    </div>
                  )}

                  <Button
                    className="w-full"
                    variant="outline"
                    size="sm"
                    onClick={() => triggerJob(jobType)}
                    disabled={triggering === jobType}
                  >
                    {triggering === jobType ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-1.5" />
                        Run Now
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          }
        )}
      </div>

      {/* Recent Jobs Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Job History</CardTitle>
          <CardDescription>Last 20 job executions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading && jobs.length === 0 ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              No job history yet. Jobs will appear here after they run.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-4">Job</th>
                    <th className="text-left py-2 pr-4">Status</th>
                    <th className="text-left py-2 pr-4">Started</th>
                    <th className="text-left py-2 pr-4">Duration</th>
                    <th className="text-left py-2">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b last:border-0">
                      <td className="py-2 pr-4">
                        {JOB_CONFIG[job.job_type]?.label || job.job_type}
                      </td>
                      <td className="py-2 pr-4">{getStatusBadge(job.status)}</td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatTime(job.started_at)}
                      </td>
                      <td className="py-2 pr-4 text-muted-foreground">
                        {formatDuration(job.duration_ms)}
                      </td>
                      <td className="py-2 text-muted-foreground">
                        {job.items_processed}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
