"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Download,
  FileSpreadsheet,
  Mail,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Loader2,
  Check,
  AlertCircle,
  Settings,
  Copy,
} from "lucide-react";

interface ExportPanelProps {
  trendDate: string;
}

export function ExportPanel({ trendDate }: ExportPanelProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Notion settings
  const [notionToken, setNotionToken] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");

  const handleCSVExport = async () => {
    setExporting("csv");
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/exports/csv?date=${trendDate}`);

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to export CSV");
      }

      // Get the CSV blob and download it
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trendpulse-${trendDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess("csv");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export CSV");
    } finally {
      setExporting(null);
    }
  };

  const handleNotionExport = async () => {
    if (!notionToken || !notionDatabaseId) {
      setError("Please configure Notion settings first");
      setSettingsOpen(true);
      return;
    }

    setExporting("notion");
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/exports/notion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: trendDate,
          notionToken,
          databaseId: notionDatabaseId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to export to Notion");
      }

      setSuccess("notion");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export to Notion");
    } finally {
      setExporting(null);
    }
  };

  const handleEmailDigest = async () => {
    setExporting("email");
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/exports/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: trendDate }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send email digest");
      }

      setSuccess("email");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setExporting(null);
    }
  };

  const openEmailPreview = () => {
    window.open(`/api/exports/email?date=${trendDate}`, "_blank");
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Download className="h-5 w-5" />
          Export & Share
        </CardTitle>
        <CardDescription>
          Export trends and content to CSV, Notion, or email
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Error message */}
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Export buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* CSV Export */}
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1.5"
            onClick={handleCSVExport}
            disabled={exporting !== null}
          >
            {exporting === "csv" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : success === "csv" ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <FileSpreadsheet className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">Export CSV</span>
            <span className="text-xs text-muted-foreground">
              Trends + Content
            </span>
          </Button>

          {/* Notion Export */}
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1.5"
            onClick={handleNotionExport}
            disabled={exporting !== null}
          >
            {exporting === "notion" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : success === "notion" ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <ExternalLink className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">Export to Notion</span>
            <span className="text-xs text-muted-foreground">
              Create database entries
            </span>
          </Button>

          {/* Email Digest */}
          <Button
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1.5"
            onClick={handleEmailDigest}
            disabled={exporting !== null}
          >
            {exporting === "email" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : success === "email" ? (
              <Check className="h-5 w-5 text-green-500" />
            ) : (
              <Mail className="h-5 w-5" />
            )}
            <span className="text-sm font-medium">Send Email Digest</span>
            <span className="text-xs text-muted-foreground">
              To your inbox
            </span>
          </Button>
        </div>

        {/* Preview email link */}
        <div className="flex justify-center">
          <Button
            variant="link"
            size="sm"
            className="text-xs text-muted-foreground"
            onClick={openEmailPreview}
          >
            Preview email digest
          </Button>
        </div>

        {/* Settings collapsible */}
        <Collapsible open={settingsOpen} onOpenChange={setSettingsOpen}>
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-between px-3 py-2 h-auto"
            >
              <span className="flex items-center gap-2 text-sm">
                <Settings className="h-4 w-4" />
                Integration Settings
              </span>
              {settingsOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-3 space-y-4">
            {/* Notion Settings */}
            <div className="space-y-3 p-3 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Notion Integration
              </h4>
              <div className="space-y-2">
                <div>
                  <Label htmlFor="notion-token" className="text-xs">
                    Integration Token
                  </Label>
                  <Input
                    id="notion-token"
                    type="password"
                    placeholder="secret_..."
                    value={notionToken}
                    onChange={(e) => setNotionToken(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="notion-db" className="text-xs">
                    Database ID
                  </Label>
                  <Input
                    id="notion-db"
                    placeholder="abc123..."
                    value={notionDatabaseId}
                    onChange={(e) => setNotionDatabaseId(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Create a Notion integration at{" "}
                  <a
                    href="https://www.notion.so/my-integrations"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    notion.so/my-integrations
                  </a>
                </p>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

interface CopyButtonProps {
  content: string;
  platform?: "buffer" | "metricool" | "generic";
  label?: string;
}

export function CopyPlainTextButton({
  content,
  platform = "generic",
  label = "Copy for Buffer/Metricool",
}: CopyButtonProps) {
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    setCopying(true);
    try {
      const response = await fetch("/api/exports/plain-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          includeSources: false,
          includeHashtags: true,
          platform,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to format content");
      }

      await navigator.clipboard.writeText(data.data);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback to copying original content
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } finally {
      setCopying(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      disabled={copying}
      className="gap-1.5"
    >
      {copying ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : copied ? (
        <Check className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      <span className="text-xs">{copied ? "Copied!" : label}</span>
    </Button>
  );
}
