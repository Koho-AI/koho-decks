import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import KohoDecksWordmark from "@/components/KohoDecksWordmark";

/**
 * Sign-in page. Public. Google SSO restricted to @koho.ai Workspace.
 */
export default async function SignInPage({
  searchParams,
}: {
  searchParams?: Promise<{ error?: string; callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = (await searchParams) ?? {};

  // If already signed in, send to the intended destination or the dashboard.
  if (session?.user) {
    redirect(params.callbackUrl ?? "/dashboard");
  }

  const callbackUrl = params.callbackUrl ?? "/dashboard";
  const signinHref = `/api/auth/signin/google?callbackUrl=${encodeURIComponent(
    callbackUrl
  )}`;

  return (
    <main
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#F4F6F9" }}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl shadow-sm p-10 flex flex-col items-center gap-8"
        style={{
          background: "#FFFFFF",
          border: "1px solid rgba(26,35,50,0.08)",
        }}
      >
        <KohoDecksWordmark mode="light" size="md" />

        <div className="text-center">
          <h1
            style={{
              fontFamily: "var(--font-manrope), Manrope, sans-serif",
              fontWeight: 500,
              fontSize: 28,
              letterSpacing: "-0.02em",
              color: "#1A2332",
              margin: 0,
            }}
          >
            Sign in
          </h1>
          <p
            style={{
              fontFamily: "var(--font-manrope), Manrope, sans-serif",
              fontWeight: 300,
              fontSize: 16,
              color: "#5B6A7E",
              marginTop: 10,
              lineHeight: 1.5,
            }}
          >
            Koho Decks is restricted to members of the Koho Workspace.
            Use your @koho.ai Google account.
          </p>
        </div>

        {params.error && (
          <div
            role="alert"
            style={{
              background: "#FFEDED",
              border: "1px solid rgba(240,62,62,0.25)",
              color: "#B02020",
              padding: "10px 14px",
              borderRadius: 8,
              fontFamily: "var(--font-manrope), Manrope, sans-serif",
              fontSize: 14,
              width: "100%",
              textAlign: "center",
            }}
          >
            {params.error === "AccessDenied"
              ? "That account isn't in the Koho Workspace. Sign in with your @koho.ai account."
              : "Sign-in failed. Try again."}
          </div>
        )}

        <a
          href={signinHref}
          style={{
            width: "100%",
            textDecoration: "none",
          }}
        >
          <button
            type="button"
            style={{
              width: "100%",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              padding: "14px 18px",
              background: "#00C278",
              color: "#FFFFFF",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
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
                d="M17.64 9.2045c0-.638-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2082 1.125-.8427 2.078-1.7955 2.7164v2.258h2.9087c1.702-1.5668 2.6832-3.874 2.6832-6.6153Z"
                opacity=".0"
              />
              <path
                fill="#FFFFFF"
                d="M9 18c2.43 0 4.4673-.8059 5.9564-2.1805l-2.9087-2.258c-.806.54-1.8368.858-3.0477.858-2.344 0-4.328-1.584-5.036-3.7105H.9573v2.3318A8.9973 8.9973 0 0 0 9 18Z"
                opacity=".0"
              />
              <path
                fill="#FFFFFF"
                d="M3.964 10.71A5.407 5.407 0 0 1 3.6818 9c0-.5932.1024-1.1704.2823-1.71V4.9582H.9573A8.9973 8.9973 0 0 0 0 9c0 1.4523.348 2.827.9573 4.0418L3.964 10.71Z"
                opacity=".0"
              />
              <path
                fill="#FFFFFF"
                d="M9 3.58c1.3214 0 2.5077.4545 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.426 0 9 0A8.9973 8.9973 0 0 0 .9573 4.9582L3.964 7.29C4.672 5.1636 6.656 3.58 9 3.58Z"
                opacity=".0"
              />
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
        </a>

        <p
          style={{
            fontFamily: "var(--font-jetbrains-mono), 'JetBrains Mono', monospace",
            fontSize: 11,
            color: "#5B6A7E",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          koho Workspace only
        </p>
      </div>
    </main>
  );
}
