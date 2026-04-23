"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  FileCode2,
  Loader2,
  MousePointerClick,
  Terminal,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notify } from "@/components/ui/sonner";

import {
  OAuthClientListItem,
  OAuthClientsApi,
} from "@/app/(presentation-generator)/services/api/oauth_clients";


const CONNECT_URL = "https://decks.koho.ai/mcp";


function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}


/**
 * Editorial-style "Connect a new MCP client" card. Always visible above
 * the authorized-clients list so a user arriving for the first time OR
 * adding a second client can enrol without leaving the page.
 */
const ConnectCard: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(CONNECT_URL);
      } else {
        // Graceful fallback for insecure contexts / older browsers:
        // select a hidden textarea and exec a copy.
        const ta = document.createElement("textarea");
        ta.value = CONNECT_URL;
        ta.style.position = "fixed";
        ta.style.top = "-9999px";
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      notify.error(
        "Copy failed",
        "Select and copy the URL manually."
      );
    }
  };

  return (
    <section
      role="region"
      aria-label="Connect a new MCP client"
      className="mb-10 rounded-[16px] border border-[#E1E1E5] bg-white p-6 font-syne"
    >
      <h2 className="text-[20px] font-unbounded tracking-[-0.6px] text-[#1A2332] mb-5">
        Connect a new MCP client
      </h2>

      {/* URL hero panel */}
      <div
        className="relative overflow-hidden rounded-[12px] border border-[#E6F5EC] px-5 py-4 flex items-center justify-between gap-4"
        style={{
          backgroundImage:
            "radial-gradient(80% 120% at 50% 50%, rgba(0,194,120,0.08) 0%, rgba(0,194,120,0) 60%)",
          backgroundColor: "#F9FAFB",
        }}
      >
        <code
          className="font-mono text-[15px] text-[#1A2332] truncate"
          style={{ letterSpacing: "0.01em", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace" }}
          aria-label="Connection URL"
        >
          {CONNECT_URL}
        </code>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          aria-label="Copy connection URL"
          aria-live="polite"
          className="shrink-0 h-8 gap-1.5 px-2.5 text-[#1A2332] hover:bg-white/80"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-[#00C278]" />
              <span className="text-xs font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span className="text-xs font-medium">Copy</span>
            </>
          )}
        </Button>
      </div>

      {/* Divider */}
      <div className="h-px bg-[#E1E1E5] my-5" />

      {/* Tabs */}
      <Tabs defaultValue="code" className="w-full">
        <TabsList className="bg-transparent gap-1 p-0 h-auto border-b border-[#E1E1E5] rounded-none w-full justify-start">
          <TabsTrigger
            value="code"
            className="gap-1.5 px-3 py-2 text-[13px] font-syne font-medium text-[#5B6A7E] data-[state=active]:text-[#1A2332] data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-[#00C278] -mb-px"
          >
            <Terminal className="w-3.5 h-3.5" />
            Claude Code
          </TabsTrigger>
          <TabsTrigger
            value="desktop"
            className="gap-1.5 px-3 py-2 text-[13px] font-syne font-medium text-[#5B6A7E] data-[state=active]:text-[#1A2332] data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-[#00C278] -mb-px"
          >
            <FileCode2 className="w-3.5 h-3.5" />
            Claude Desktop
          </TabsTrigger>
          <TabsTrigger
            value="cursor"
            className="gap-1.5 px-3 py-2 text-[13px] font-syne font-medium text-[#5B6A7E] data-[state=active]:text-[#1A2332] data-[state=active]:shadow-none data-[state=active]:bg-transparent rounded-none border-b-[1.5px] border-transparent data-[state=active]:border-[#00C278] -mb-px"
          >
            <MousePointerClick className="w-3.5 h-3.5" />
            Cursor
          </TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="mt-4">
          <p className="text-xs text-[#5B6A7E] mb-2">Run in your terminal:</p>
          <pre className="rounded-[10px] bg-[#0F172A] text-[#E5F3FF] text-[13px] leading-relaxed p-4 overflow-x-auto">
{`claude mcp add koho-decks \\
  --transport http \\
  https://decks.koho.ai/mcp`}
          </pre>
          <p className="text-xs text-[#5B6A7E] mt-3">
            First tool call opens a browser to approve.
          </p>
        </TabsContent>

        <TabsContent value="desktop" className="mt-4">
          <p className="text-xs text-[#5B6A7E] mb-2">
            Edit{" "}
            <code className="font-mono text-[11px] text-[#1A2332] bg-[#F3F4F6] px-1.5 py-0.5 rounded">
              ~/Library/Application Support/Claude/claude_desktop_config.json
            </code>
            :
          </p>
          <pre className="rounded-[10px] bg-[#0F172A] text-[#E5F3FF] text-[13px] leading-relaxed p-4 overflow-x-auto">
{`{
  "mcpServers": {
    "koho-decks": {
      "url": "https://decks.koho.ai/mcp"
    }
  }
}`}
          </pre>
          <p className="text-xs text-[#5B6A7E] mt-3">
            Restart Claude Desktop after saving. First connect opens a browser to approve.
          </p>
        </TabsContent>

        <TabsContent value="cursor" className="mt-4">
          <p className="text-xs text-[#5B6A7E] mb-2">
            Cursor Settings → MCP → Add server:
          </p>
          <div className="rounded-[10px] bg-[#0F172A] text-[#E5F3FF] text-[13px] leading-relaxed p-4 font-mono overflow-x-auto">
            <div className="flex gap-3">
              <span className="text-[#7DD3A3] w-14 shrink-0">URL</span>
              <span>https://decks.koho.ai/mcp</span>
            </div>
            <div className="flex gap-3 mt-1">
              <span className="text-[#7DD3A3] w-14 shrink-0">Name</span>
              <span>Koho Decks</span>
            </div>
            <div className="text-[#5B6A7E] mt-1 text-[12px]">
              (leave all other fields blank)
            </div>
          </div>
          <p className="text-xs text-[#5B6A7E] mt-3">
            First use opens a browser to approve access.
          </p>
        </TabsContent>
      </Tabs>
    </section>
  );
};


const OAuthClientsPage: React.FC = () => {
  const [clients, setClients] = useState<OAuthClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await OAuthClientsApi.list();
      setClients(rows);
    } catch (err) {
      notify.error(
        "Could not load authorized clients",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleRevoke = async (client: OAuthClientListItem) => {
    const confirmed = window.confirm(
      `Revoke "${client.client_name}"? Any running MCP session using this authorization will need to re-authorize.`
    );
    if (!confirmed) return;
    try {
      setRevokingId(client.id);
      await OAuthClientsApi.revoke(client.id);
      notify.success(
        "Authorization revoked",
        `"${client.client_name}" can no longer act as you.`
      );
      await refresh();
    } catch (err) {
      notify.error(
        "Could not revoke",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 font-syne">
      <ConnectCard />

      <header className="mb-6">
        <h1 className="text-[24px] font-unbounded tracking-[-0.72px] text-black">
          Authorized clients
        </h1>
        <p className="text-sm text-[#3A3A3A] mt-2 max-w-2xl">
          MCP clients you've authorized to act on your behalf. Revoke any
          client to invalidate its refresh tokens — it'll need to re-approve
          the next time it connects.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-[#3A3A3A]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : clients.length === 0 ? (
        <div className="border border-dashed border-[#E1E1E5] rounded-lg p-8 text-center">
          <p className="text-[#3A3A3A] text-sm">
            No authorized clients yet.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client</TableHead>
              <TableHead>Client ID</TableHead>
              <TableHead>Authorized</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-medium">{c.client_name}</TableCell>
                <TableCell>
                  <code className="text-xs px-2 py-0.5 rounded bg-[#F3F4F6]">
                    {c.client_id.slice(0, 14)}…
                  </code>
                </TableCell>
                <TableCell className="text-[#3A3A3A] text-sm">
                  {formatDate(c.created_at)}
                </TableCell>
                <TableCell className="text-[#3A3A3A] text-sm">
                  {formatDate(c.last_used_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(c)}
                    disabled={revokingId === c.id}
                    aria-label={`Revoke ${c.client_name}`}
                  >
                    {revokingId === c.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default OAuthClientsPage;
