"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  Copy,
  Globe,
  Lock,
  Mail,
  Plus,
  Trash2,
  X,
} from "lucide-react";

type Collaborator = {
  id: string;
  kind: "collaborator" | "invitation";
  email: string;
  name?: string | null;
  avatar_url?: string | null;
  role: "viewer" | "editor";
  invited_at: string;
  expires_at?: string | null;
};

type CollaboratorListResponse = {
  presentation_id: string;
  owner_email: string | null;
  collaborators: Collaborator[];
};

type ShareLink = {
  id: string;
  presentation_id: string;
  token: string;
  gate_mode: "open" | "email_otp";
  created_at: string;
  expires_at: string | null;
  revoked_at: string | null;
  view_count: number;
  unique_viewers: number;
};

/**
 * Share modal for internal Koho-team collaboration (Phase 4).
 * External client links land in Phase 5.
 */
export default function ShareModal({
  presentationId,
  open,
  onClose,
}: {
  presentationId: string;
  open: boolean;
  onClose: () => void;
}) {
  const [data, setData] = useState<CollaboratorListResponse | null>(null);
  const [links, setLinks] = useState<ShareLink[] | null>(null);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"viewer" | "editor">("viewer");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkGateMode, setLinkGateMode] = useState<"open" | "email_otp">(
    "open"
  );
  const [creatingLink, setCreatingLink] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const [collab, ll] = await Promise.all([
        fetch(`/api/v1/ppt/sharing/collaborators/${presentationId}`),
        fetch(`/api/v1/ppt/share-links/${presentationId}`),
      ]);
      if (collab.ok) setData(await collab.json());
      if (ll.ok) setLinks(await ll.json());
    } catch {
      // ignored
    }
  }, [presentationId]);

  useEffect(() => {
    if (open) {
      setError(null);
      refresh();
    }
  }, [open, refresh]);

  const invite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const r = await fetch("/api/v1/ppt/sharing/invite", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          presentation_id: presentationId,
          email,
          role,
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        setError(body.detail ?? `Failed (${r.status})`);
      } else {
        setEmail("");
        await refresh();
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const revoke = async (collab: Collaborator) => {
    const path =
      collab.kind === "collaborator"
        ? `/api/v1/ppt/sharing/collaborator/${collab.id}`
        : `/api/v1/ppt/sharing/invitation/${collab.id}`;
    const r = await fetch(path, { method: "DELETE" });
    if (r.ok) await refresh();
  };

  const createLink = async () => {
    if (creatingLink) return;
    setCreatingLink(true);
    setError(null);
    try {
      const r = await fetch("/api/v1/ppt/share-links", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          presentation_id: presentationId,
          gate_mode: linkGateMode,
        }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        setError(body.detail ?? `Failed (${r.status})`);
      } else {
        await refresh();
      }
    } finally {
      setCreatingLink(false);
    }
  };

  const revokeLink = async (id: string) => {
    const r = await fetch(`/api/v1/ppt/share-links/${id}`, {
      method: "DELETE",
    });
    if (r.ok) await refresh();
  };

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/view/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToken(token);
      setTimeout(() => setCopiedToken((c) => (c === token ? null : c)), 1800);
    } catch {
      // ignored
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,35,50,0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
        fontFamily: "var(--font-manrope), Manrope, sans-serif",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(560px, 92vw)",
          maxHeight: "86vh",
          overflow: "auto",
          background: "#FFFFFF",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 20px 60px -20px rgba(26,35,50,0.35)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 4,
          }}
        >
          <h2
            style={{
              fontSize: 20,
              fontWeight: 500,
              color: "#1A2332",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Share deck
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "transparent",
              border: "none",
              cursor: "pointer",
              color: "#5B6A7E",
              padding: 4,
            }}
          >
            <X size={18} />
          </button>
        </div>
        <p style={{ color: "#5B6A7E", fontSize: 13, margin: "4px 0 18px" }}>
          Invite Koho teammates by their @koho.ai address. Public share links
          for clients come in the next release.
        </p>

        <form onSubmit={invite} style={{ display: "flex", gap: 8 }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Mail
              size={15}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#5B6A7E",
              }}
            />
            <input
              type="email"
              required
              placeholder="teammate@koho.ai"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px 12px 10px 34px",
                borderRadius: 8,
                border: "1px solid rgba(26,35,50,0.12)",
                fontFamily: "inherit",
                fontSize: 14,
                color: "#1A2332",
                outlineColor: "#00C278",
              }}
            />
          </div>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as "viewer" | "editor")}
            style={{
              padding: "10px 12px",
              borderRadius: 8,
              border: "1px solid rgba(26,35,50,0.12)",
              fontFamily: "inherit",
              fontSize: 14,
              color: "#1A2332",
              background: "#FFFFFF",
            }}
          >
            <option value="viewer">Viewer</option>
            <option value="editor">Editor</option>
          </select>
          <button
            type="submit"
            disabled={submitting || !email}
            style={{
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              background: submitting || !email ? "#9CD9BB" : "#00C278",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: 14,
              fontWeight: 500,
              cursor: submitting || !email ? "not-allowed" : "pointer",
            }}
          >
            Invite
          </button>
        </form>

        {error && (
          <div
            role="alert"
            style={{
              marginTop: 10,
              background: "#FFEDED",
              color: "#B02020",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              border: "1px solid rgba(240,62,62,0.25)",
            }}
          >
            {error}
          </div>
        )}

        <div
          style={{
            marginTop: 22,
            borderTop: "1px solid rgba(26,35,50,0.08)",
            paddingTop: 14,
          }}
        >
          <h3
            style={{
              fontSize: 13,
              color: "#5B6A7E",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 10px",
              fontWeight: 500,
              fontFamily:
                "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
            }}
          >
            People with access
          </h3>

          {data?.owner_email && (
            <Row
              email={data.owner_email}
              subtext="Owner"
              trailing={null}
              avatar={null}
            />
          )}

          {data?.collaborators.length ? (
            data.collaborators.map((c) => (
              <Row
                key={c.id}
                email={c.email}
                subtext={
                  c.kind === "invitation"
                    ? `Pending · ${c.role}`
                    : c.role
                }
                avatar={c.avatar_url ?? null}
                trailing={
                  <button
                    type="button"
                    onClick={() => revoke(c)}
                    aria-label="Revoke access"
                    style={{
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      color: "#B02020",
                      padding: 6,
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                }
              />
            ))
          ) : (
            <div style={{ fontSize: 13, color: "#9AA6B2", padding: "6px 0" }}>
              No one else has access yet.
            </div>
          )}
        </div>

        {/* Public client-share links (Phase 5) */}
        <div
          style={{
            marginTop: 22,
            borderTop: "1px solid rgba(26,35,50,0.08)",
            paddingTop: 14,
          }}
        >
          <h3
            style={{
              fontSize: 13,
              color: "#5B6A7E",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              margin: "0 0 10px",
              fontWeight: 500,
              fontFamily:
                "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
            }}
          >
            Client share links
          </h3>

          {(links ?? [])
            .filter((l) => !l.revoked_at)
            .map((link) => {
              const url = `${
                typeof window !== "undefined" ? window.location.origin : ""
              }/view/${link.token}`;
              const Icon = link.gate_mode === "open" ? Globe : Lock;
              const label =
                link.gate_mode === "open"
                  ? "Anyone with the link"
                  : "Email verification";
              return (
                <div
                  key={link.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "10px 12px",
                    border: "1px solid rgba(26,35,50,0.08)",
                    borderRadius: 10,
                    marginBottom: 8,
                    background: "#FAFBFC",
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: "50%",
                      background: "#E6FBF1",
                      color: "#006B43",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Icon size={15} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        color: "#1A2332",
                        fontWeight: 500,
                      }}
                    >
                      {label}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#5B6A7E",
                        marginTop: 2,
                        fontFamily:
                          "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {url}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: "#5B6A7E",
                        marginTop: 4,
                      }}
                    >
                      {link.view_count} view{link.view_count === 1 ? "" : "s"}
                      {link.gate_mode === "email_otp"
                        ? ` · ${link.unique_viewers} unique`
                        : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyLink(link.token)}
                    aria-label="Copy link"
                    style={iconButtonStyle()}
                  >
                    {copiedToken === link.token ? (
                      <Check size={15} color="#00C278" />
                    ) : (
                      <Copy size={15} />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => revokeLink(link.id)}
                    aria-label="Revoke link"
                    style={{ ...iconButtonStyle(), color: "#B02020" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              );
            })}

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <select
              value={linkGateMode}
              onChange={(e) =>
                setLinkGateMode(e.target.value as "open" | "email_otp")
              }
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid rgba(26,35,50,0.12)",
                fontFamily: "inherit",
                fontSize: 13,
                color: "#1A2332",
                background: "#FFFFFF",
              }}
            >
              <option value="open">Anyone with the link</option>
              <option value="email_otp">Require email verification</option>
            </select>
            <button
              type="button"
              onClick={createLink}
              disabled={creatingLink}
              style={{
                padding: "10px 14px",
                borderRadius: 8,
                border: "1px solid rgba(26,35,50,0.12)",
                background: "#FFFFFF",
                color: "#1A2332",
                cursor: creatingLink ? "not-allowed" : "pointer",
                fontFamily: "inherit",
                fontSize: 13,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Plus size={14} />
              Create link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function iconButtonStyle(): React.CSSProperties {
  return {
    width: 32,
    height: 32,
    border: "none",
    background: "transparent",
    color: "#5B6A7E",
    cursor: "pointer",
    borderRadius: 6,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
}

function Row({
  email,
  subtext,
  avatar,
  trailing,
}: {
  email: string;
  subtext: string;
  avatar: string | null;
  trailing: React.ReactNode | null;
}) {
  const initials = email
    .split(/[\s@.]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join("");
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "8px 0",
      }}
    >
      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          width={32}
          height={32}
          style={{ borderRadius: "50%" }}
          referrerPolicy="no-referrer"
        />
      ) : (
        <span
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "#E6FBF1",
            color: "#006B43",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          {initials}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            color: "#1A2332",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {email}
        </div>
        <div
          style={{
            fontSize: 12,
            color: "#5B6A7E",
            textTransform: "capitalize",
          }}
        >
          {subtext}
        </div>
      </div>
      {trailing}
    </div>
  );
}
