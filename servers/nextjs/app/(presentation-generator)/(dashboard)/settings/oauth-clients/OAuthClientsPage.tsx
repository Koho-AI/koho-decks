"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Loader2, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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


function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}


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
      <header className="mb-8">
        <h1 className="text-[28px] font-unbounded tracking-[-0.84px] text-black">
          Authorized MCP clients
        </h1>
        <p className="text-sm text-[#3A3A3A] mt-2 max-w-2xl">
          MCP clients (Claude Desktop, Cursor, Claude Code) that you've
          authorized to act on your behalf. New authorizations happen the
          first time you configure a client — look for a browser-based
          consent prompt in your MCP client's setup flow.
        </p>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-[#3A3A3A]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : clients.length === 0 ? (
        <div className="border border-dashed border-[#E1E1E5] rounded-lg p-10 text-center">
          <p className="text-[#3A3A3A] text-sm">
            No authorized clients yet. Add one by configuring an MCP client
            to connect to <code className="text-xs">https://decks.koho.ai/mcp</code>.
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
