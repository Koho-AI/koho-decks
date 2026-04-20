import { cookies, headers } from "next/headers";
import OtpGate from "@/components/public-viewer/OtpGate";
import PublicDeckViewer from "@/components/public-viewer/PublicDeckViewer";

/**
 * Phase 5 — public deck viewer route.
 * Public (excluded from auth middleware via the `/view` prefix in
 * lib/auth.ts). Accepts both anonymous loads (open links) and
 * email-OTP-gated loads.
 */

type GateRequired = { needs_email_gate: true; deck_title: string | null };
type DeckPayload = {
  needs_email_gate?: undefined;
  presentation_id: string;
  title: string | null;
  layout: Record<string, unknown> | null;
  structure: Record<string, unknown> | null;
  theme: Record<string, unknown> | null;
  slides: Array<{
    id: string;
    index: number;
    layout: string;
    layout_group?: string | null;
    content?: Record<string, unknown> | null;
  }>;
};

async function fetchDeck(
  token: string
): Promise<GateRequired | DeckPayload | { _error: string; _status?: number }> {
  // Build an internal URL to FastAPI — same container so 127.0.0.1
  // is fine. We forward the view-session cookie + request headers
  // so OTP-verified loads work.
  const cookieJar = await cookies();
  const headerJar = await headers();
  const viewCookie = cookieJar.get("koho_view_session");
  const xff = headerJar.get("x-forwarded-for");
  const ua = headerJar.get("user-agent");

  const url = `http://127.0.0.1:8000/api/v1/share/${encodeURIComponent(token)}`;
  try {
    const r = await fetch(url, {
      headers: {
        ...(viewCookie
          ? { cookie: `koho_view_session=${viewCookie.value}` }
          : {}),
        ...(xff ? { "x-forwarded-for": xff } : {}),
        ...(ua ? { "user-agent": ua } : {}),
      },
      cache: "no-store",
    });
    if (!r.ok) {
      const body = await r.json().catch(() => ({}));
      return {
        _error: body.detail ?? `Failed to load (${r.status})`,
        _status: r.status,
      };
    }
    return await r.json();
  } catch (e) {
    return { _error: String(e) };
  }
}

export default async function PublicViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await fetchDeck(token);

  if ("_error" in data) {
    return (
      <main
        style={{
          minHeight: "100vh",
          background: "#F4F6F9",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          fontFamily: "var(--font-manrope), Manrope, sans-serif",
        }}
      >
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid rgba(26,35,50,0.08)",
            borderRadius: 16,
            padding: 28,
            maxWidth: 420,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 22, color: "#1A2332", margin: 0 }}>
            Link unavailable
          </h1>
          <p style={{ color: "#5B6A7E", marginTop: 8, fontSize: 14 }}>
            {data._status === 410
              ? "This share link has been revoked or expired."
              : data._status === 404
              ? "This share link doesn't exist."
              : data._error}
          </p>
        </div>
      </main>
    );
  }

  if ("needs_email_gate" in data && data.needs_email_gate) {
    return <OtpGate token={token} deckTitle={data.deck_title ?? null} />;
  }

  return <PublicDeckViewer deck={data as DeckPayload} />;
}
