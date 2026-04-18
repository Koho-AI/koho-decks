"use client";

import { useEffect, useState } from "react";

/**
 * Client-side Google sign-in form.
 *
 * NextAuth v5 requires POSTing to /api/auth/signin/[provider] with a
 * csrfToken in the body (fetched from /api/auth/csrf), plus the
 * callbackUrl. Server Actions would be cleaner but fail under the
 * nginx reverse proxy due to the x-forwarded-host origin check.
 */
export default function GoogleSignInForm({
  callbackUrl,
}: {
  callbackUrl: string;
}) {
  const [csrfToken, setCsrfToken] = useState<string>("");

  useEffect(() => {
    fetch("/api/auth/csrf")
      .then((r) => r.json())
      .then((d: { csrfToken?: string }) => setCsrfToken(d.csrfToken ?? ""))
      .catch(() => setCsrfToken(""));
  }, []);

  const disabled = !csrfToken;

  return (
    <form
      method="POST"
      action="/api/auth/signin/google"
      style={{ width: "100%" }}
    >
      <input type="hidden" name="csrfToken" value={csrfToken} />
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <button
        type="submit"
        disabled={disabled}
        style={{
          width: "100%",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "14px 18px",
          background: disabled ? "#9CD9BB" : "#00C278",
          color: "#FFFFFF",
          borderRadius: 999,
          border: "none",
          cursor: disabled ? "not-allowed" : "pointer",
          fontFamily: "var(--font-manrope), Manrope, sans-serif",
          fontWeight: 500,
          fontSize: 16,
          letterSpacing: "-0.005em",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            fill="#FFFFFF"
            d="M9 3.48c1.69 0 2.833.729 3.484 1.338l2.54-2.478C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.96 2.3C4.67 5.1 6.66 3.48 9 3.48Z"
          />
          <path
            fill="#FFFFFF"
            d="M.96 13.04C2.44 15.98 5.48 18 9 18c2.43 0 4.47-.81 5.95-2.19l-2.91-2.25c-.81.55-1.85.88-3.04.88-2.34 0-4.33-1.59-5.04-3.72L.96 13.04Z"
          />
          <path
            fill="#FFFFFF"
            d="M14.95 15.82c1.52-1.4 2.41-3.46 2.41-5.82 0-.54-.05-1.08-.14-1.59H9v3.02h3.35c-.15.8-.59 1.48-1.26 1.94l2.86 2.45Z"
          />
          <path
            fill="#FFFFFF"
            d="M3.97 10.71a5.4 5.4 0 0 1-.28-1.71c0-.59.1-1.17.28-1.71L.96 4.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.83.96 4.04l3.01-2.33Z"
          />
        </svg>
        Sign in with Google
      </button>
    </form>
  );
}
