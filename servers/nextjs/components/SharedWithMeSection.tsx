"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

type SharedDeckSummary = {
  presentation_id: string;
  title: string | null;
  role: "viewer" | "editor";
  owner_email: string | null;
  shared_at: string;
};

export default function SharedWithMeSection() {
  const [decks, setDecks] = useState<SharedDeckSummary[] | null>(null);

  useEffect(() => {
    fetch("/api/v1/ppt/sharing/shared-with-me")
      .then((r) => (r.ok ? r.json() : []))
      .then(setDecks)
      .catch(() => setDecks([]));
  }, []);

  if (!decks || decks.length === 0) return null;

  return (
    <section style={{ marginTop: 32 }}>
      <h3
        style={{
          fontSize: 22,
          fontWeight: 400,
          color: "#101828",
          letterSpacing: "-0.66px",
          margin: "0 0 14px",
          fontFamily: "var(--font-manrope), Manrope, sans-serif",
        }}
      >
        Shared with me
      </h3>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          gap: 14,
        }}
      >
        {decks.map((d) => (
          <Link
            key={d.presentation_id}
            href={`/presentation?id=${d.presentation_id}`}
            prefetch={false}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "16px 18px",
              background: "#FFFFFF",
              border: "1px solid rgba(26,35,50,0.08)",
              borderRadius: 12,
              textDecoration: "none",
              fontFamily: "var(--font-manrope), Manrope, sans-serif",
              boxShadow: "0 1px 2px rgba(26,35,50,0.04)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: "#1A2332",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {d.title ?? "Untitled deck"}
              </div>
              <div style={{ fontSize: 12, color: "#5B6A7E", marginTop: 2 }}>
                {d.role === "editor" ? "Editor" : "Viewer"}
                {d.owner_email ? ` · ${d.owner_email}` : ""}
              </div>
            </div>
            <ArrowRight size={16} color="#5B6A7E" />
          </Link>
        ))}
      </div>
    </section>
  );
}
