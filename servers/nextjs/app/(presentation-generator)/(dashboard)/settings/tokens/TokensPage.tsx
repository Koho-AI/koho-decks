"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { notify } from "@/components/ui/sonner";

import {
  CreatedTokenResponse,
  TokenListItem,
  TokensApi,
} from "@/app/(presentation-generator)/services/api/tokens";


function formatDate(iso: string | null): string {
  if (!iso) return "Never";
  return new Date(iso).toLocaleString();
}


const TokensPage: React.FC = () => {
  const [tokens, setTokens] = useState<TokenListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [creating, setCreating] = useState<boolean>(false);
  const [showCreate, setShowCreate] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>("");
  const [createdToken, setCreatedToken] =
    useState<CreatedTokenResponse | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const rows = await TokensApi.list();
      setTokens(rows);
    } catch (err) {
      notify.error(
        "Could not load tokens",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCreate = async () => {
    const name = newName.trim();
    if (!name) {
      notify.error("Name required", "Give this token a label you'll recognise.");
      return;
    }
    try {
      setCreating(true);
      const result = await TokensApi.create(name);
      setCreatedToken(result);
      setNewName("");
      setShowCreate(false);
      await refresh();
    } catch (err) {
      notify.error(
        "Could not create token",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setCreating(false);
    }
  };

  const handleRevoke = async (token: TokenListItem) => {
    const confirmed = window.confirm(
      `Revoke "${token.name}"? Any MCP client using this token will stop working.`
    );
    if (!confirmed) return;
    try {
      setRevokingId(token.id);
      await TokensApi.revoke(token.id);
      notify.success("Token revoked", `"${token.name}" will no longer authenticate.`);
      await refresh();
    } catch (err) {
      notify.error(
        "Could not revoke token",
        err instanceof Error ? err.message : "Unknown error"
      );
    } finally {
      setRevokingId(null);
    }
  };

  const handleCopyRaw = async () => {
    if (!createdToken) return;
    try {
      await navigator.clipboard.writeText(createdToken.token);
      notify.success("Copied", "Token copied to clipboard.");
    } catch {
      notify.error("Copy failed", "Select and copy the token manually.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 font-syne">
      <header className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[28px] font-unbounded tracking-[-0.84px] text-black">
            Personal access tokens
          </h1>
          <p className="text-sm text-[#3A3A3A] mt-2 max-w-2xl">
            Use a personal access token to authenticate Koho Decks MCP clients
            (Claude Desktop, Cursor, Claude Code). Tokens have the same access
            as your browser session.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="shrink-0">
          <Plus className="w-4 h-4 mr-2" />
          New token
        </Button>
      </header>

      {loading ? (
        <div className="flex items-center gap-2 text-[#3A3A3A]">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Loading…</span>
        </div>
      ) : tokens.length === 0 ? (
        <div className="border border-dashed border-[#E1E1E5] rounded-lg p-10 text-center">
          <p className="text-[#3A3A3A] text-sm">
            You don't have any tokens yet. Create one to configure an MCP
            client.
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Prefix</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Last used</TableHead>
              <TableHead className="w-20 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tokens.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell>
                  <code className="text-xs px-2 py-0.5 rounded bg-[#F3F4F6]">
                    {t.prefix}…
                  </code>
                </TableCell>
                <TableCell className="text-[#3A3A3A] text-sm">
                  {formatDate(t.created_at)}
                </TableCell>
                <TableCell className="text-[#3A3A3A] text-sm">
                  {formatDate(t.last_used_at)}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(t)}
                    disabled={revokingId === t.id}
                    aria-label={`Revoke ${t.name}`}
                  >
                    {revokingId === t.id ? (
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

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a personal access token</DialogTitle>
            <DialogDescription>
              Give the token a name you'll recognise — typically the client or
              machine you're configuring, e.g. "Claude Desktop on laptop".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="token-name">Name</Label>
            <Input
              id="token-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Claude Desktop on laptop"
              autoFocus
              disabled={creating}
            />
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setShowCreate(false)}
              disabled={creating}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating…
                </>
              ) : (
                "Create token"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Show-once reveal dialog */}
      <Dialog
        open={!!createdToken}
        onOpenChange={(open) => {
          if (!open) setCreatedToken(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Token created</DialogTitle>
            <DialogDescription>
              Copy this token now — you won't be able to see it again. If you
              lose it, revoke and create a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <code className="block p-3 rounded-md bg-[#F3F4F6] text-xs break-all select-all">
              {createdToken?.token}
            </code>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={handleCopyRaw}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button onClick={() => setCreatedToken(null)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TokensPage;
