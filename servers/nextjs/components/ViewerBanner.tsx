"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";

/**
 * Renders a small "You're viewing — read only" pill at the top of a
 * deck page when the caller's role on the deck is `viewer`. No render
 * for owner / editor, so deck owners never see it.
 */
export default function ViewerBanner({
  presentationId,
}: {
  presentationId: string;
}) {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    if (!presentationId) return;
    fetch(`/api/v1/ppt/sharing/my-role/${presentationId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setRole(d?.role ?? null))
      .catch(() => setRole(null));
  }, [presentationId]);

  if (role !== "viewer") return null;

  return (
    <div
      role="status"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px",
        background: "#E6FBF1",
        color: "#006B43",
        border: "1px solid rgba(0,194,120,0.25)",
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "var(--font-manrope), Manrope, sans-serif",
      }}
    >
      <Eye size={13} />
      Viewing as Viewer — read-only
    </div>
  );
}
