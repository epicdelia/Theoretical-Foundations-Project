"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Download,
  FileSpreadsheet,
  Mail,
  ExternalLink,
  Loader2,
  Check,
  AlertCircle,
} from "lucide-react";

interface ExportDropdownProps {
  trendDate: string;
}

export function ExportDropdown({ trendDate }: ExportDropdownProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Notion dialog state
  const [notionDialogOpen, setNotionDialogOpen] = useState(false);
  const [notionToken, setNotionToken] = useState("");
  const [notionDatabaseId, setNotionDatabaseId] = useState("");

  // Email dialog state
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailAddress, setEmailAddress] = useState("");

  const clearStatus = () => {
    setSuccess(null);
    setError(null);
  };

  const handleCSVExport = async () => {
    setLoading("csv");
    clearStatus();

    try {
      const response = await fetch(`/api/exports/csv?date=${trendDate}`);
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Export failed");
      }

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trendpulse-${trendDate}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess("CSV downloaded successfully!");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(null);
    }
  };

  const handleNotionExport = async () => {
    if (!notionToken || !notionDatabaseId) {
      setError("Please provide both Notion token and database ID");
      return;
    }

    setLoading("notion");
    clearStatus();

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
        throw new Error(data.error || "Export failed");
      }

      setSuccess(data.message);
      setNotionDialogOpen(false);
      setNotionToken("");
      setNotionDatabaseId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setLoading(null);
    }
  };

  const handleEmailDigest = async () => {
    setLoading("email");
    clearStatus();

    try {
      const response = await fetch("/api/exports/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: trendDate,
          email: emailAddress || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send email");
      }

      setSuccess(data.message);
      setEmailDialogOpen(false);
      setEmailAddress("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send email");
    } finally {
      setLoading(null);
    }
  };

  const handlePreviewEmail = () => {
    window.open(`/api/exports/email?date=${trendDate}`, "_blank");
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1.5" />
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Export Options</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleCSVExport}
            disabled={loading === "csv"}
          >
            {loading === "csv" ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4 mr-2" />
            )}
            Download CSV
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setNotionDialogOpen(true)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Export to Notion
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setEmailDialogOpen(true)}>
            <Mail className="h-4 w-4 mr-2" />
            Send Email Digest
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handlePreviewEmail}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Preview Email
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Status toast */}
      {(success || error) && (
        <div
          className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg flex items-center gap-2 z-50 ${
            success ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
          }`}
        >
          {success ? (
            <Check className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <span className="text-sm">{success || error}</span>
          <button
            onClick={clearStatus}
            className="ml-2 hover:opacity-70"
          >
            ×
          </button>
        </div>
      )}

      {/* Notion Export Dialog */}
      <Dialog open={notionDialogOpen} onOpenChange={setNotionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export to Notion</DialogTitle>
            <DialogDescription>
              Enter your Notion integration token and database ID to export trends.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="notionToken">Integration Token</Label>
              <Input
                id="notionToken"
                type="password"
                placeholder="secret_..."
                value={notionToken}
                onChange={(e) => setNotionToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Create an integration at{" "}
                <a
                  href="https://www.notion.so/my-integrations"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline"
                >
                  notion.so/my-integrations
                </a>
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notionDbId">Database ID</Label>
              <Input
                id="notionDbId"
                placeholder="abc123..."
                value={notionDatabaseId}
                onChange={(e) => setNotionDatabaseId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Found in your database URL after the workspace name
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setNotionDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleNotionExport}
              disabled={loading === "notion" || !notionToken || !notionDatabaseId}
            >
              {loading === "notion" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                "Export"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Digest Dialog */}
      <Dialog open={emailDialogOpen} onOpenChange={setEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Email Digest</DialogTitle>
            <DialogDescription>
              Send today&apos;s trend digest to your email.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address (optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="Leave blank to use your account email"
                value={emailAddress}
                onChange={(e) => setEmailAddress(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEmailDigest} disabled={loading === "email"}>
              {loading === "email" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Digest
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
