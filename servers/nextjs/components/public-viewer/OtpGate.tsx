"use client";

import { useState } from "react";
import KohoDecksWordmark from "@/components/KohoDecksWordmark";

type Step = "email" | "code" | "verifying";

export default function OtpGate({
  token,
  deckTitle,
}: {
  token: string;
  deckTitle: string | null;
}) {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setPending(true);
    setError(null);
    try {
      const r = await fetch(
        `/api/v1/share/${encodeURIComponent(token)}/request-otp`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email }),
        }
      );
      if (!r.ok && r.status !== 202) {
        const body = await r.json().catch(() => ({}));
        setError(body.detail ?? `Request failed (${r.status})`);
      } else {
        setStep("code");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setPending(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) return;
    setStep("verifying");
    setError(null);
    try {
      const r = await fetch(
        `/api/v1/share/${encodeURIComponent(token)}/verify-otp`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ email, code }),
        }
      );
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        setError(body.detail ?? `Verification failed (${r.status})`);
        setStep("code");
        return;
      }
      // Cookie set by server; reload to render the deck.
      window.location.reload();
    } catch (err) {
      setError(String(err));
      setStep("code");
    }
  };

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
          width: "min(420px, 100%)",
          background: "#FFFFFF",
          border: "1px solid rgba(26,35,50,0.08)",
          borderRadius: 16,
          padding: 32,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 22,
        }}
      >
        <KohoDecksWordmark mode="light" size="md" />

        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 500,
              letterSpacing: "-0.02em",
              color: "#1A2332",
              margin: 0,
            }}
          >
            {deckTitle ?? "Shared deck"}
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#5B6A7E",
              margin: "8px 0 0",
              lineHeight: 1.55,
            }}
          >
            {step === "email"
              ? "Enter your email to receive a verification code."
              : "We sent a 6-digit code. It expires in 10 minutes."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            style={{
              width: "100%",
              background: "#FFEDED",
              color: "#B02020",
              padding: "8px 12px",
              borderRadius: 8,
              fontSize: 13,
              border: "1px solid rgba(240,62,62,0.25)",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {step === "email" && (
          <form onSubmit={requestCode} style={{ width: "100%" }}>
            <input
              type="email"
              required
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={pending || !email}
              style={primaryButtonStyle(pending || !email)}
            >
              {pending ? "Sending…" : "Send code"}
            </button>
          </form>
        )}

        {(step === "code" || step === "verifying") && (
          <form onSubmit={verifyCode} style={{ width: "100%" }}>
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              required
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              style={{
                ...inputStyle,
                fontFamily:
                  "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
                letterSpacing: "0.3em",
                textAlign: "center",
                fontSize: 22,
              }}
            />
            <button
              type="submit"
              disabled={step === "verifying" || code.length !== 6}
              style={primaryButtonStyle(
                step === "verifying" || code.length !== 6
              )}
            >
              {step === "verifying" ? "Verifying…" : "View deck"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("email");
                setCode("");
                setError(null);
              }}
              style={{
                marginTop: 10,
                width: "100%",
                background: "transparent",
                border: "none",
                color: "#5B6A7E",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Use a different email
            </button>
          </form>
        )}

        <p
          style={{
            fontSize: 11,
            color: "#9AA6B2",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            fontFamily:
              "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
            margin: 0,
          }}
        >
          Powered by Koho Decks
        </p>
      </div>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid rgba(26,35,50,0.12)",
  fontFamily: "inherit",
  fontSize: 15,
  color: "#1A2332",
  outlineColor: "#00C278",
  marginBottom: 12,
  boxSizing: "border-box",
};

function primaryButtonStyle(disabled: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "12px 16px",
    borderRadius: 999,
    border: "none",
    background: disabled ? "#9CD9BB" : "#00C278",
    color: "#FFFFFF",
    fontFamily: "inherit",
    fontSize: 15,
    fontWeight: 500,
    cursor: disabled ? "not-allowed" : "pointer",
  };
}
