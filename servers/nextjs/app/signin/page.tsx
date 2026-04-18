import React from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import KohoDecksWordmark from "@/components/KohoDecksWordmark";
import GoogleSignInForm from "./GoogleSignInForm";

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

        <GoogleSignInForm callbackUrl={callbackUrl} />

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
