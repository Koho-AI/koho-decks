"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, ShieldCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { notify } from "@/components/ui/sonner";

import {
  ConsentSubmitPayload,
  OAuthClientsApi,
} from "@/app/(presentation-generator)/services/api/oauth_clients";


const ConsentPage: React.FC = () => {
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [denied, setDenied] = useState(false);
  const [success, setSuccess] = useState(false);

  const params: ConsentSubmitPayload | null = useMemo(() => {
    const clientId = searchParams.get("client_id");
    const redirectUri = searchParams.get("redirect_uri");
    const codeChallenge = searchParams.get("code_challenge");
    if (!clientId || !redirectUri || !codeChallenge) return null;
    return {
      client_id: clientId,
      redirect_uri: redirectUri,
      scope: searchParams.get("scope") ?? "koho-decks",
      code_challenge: codeChallenge,
      code_challenge_method: searchParams.get("code_challenge_method") ?? "S256",
      state: searchParams.get("state"),
    };
  }, [searchParams]);

  const clientName = searchParams.get("client_name") ?? "an unknown MCP client";

  // If the user hit Cancel, bounce them back to the redirect_uri with
  // the standard access_denied error so their MCP client shows a clean
  // "authorization was cancelled" message.
  useEffect(() => {
    if (!denied || !params) return;
    const url = new URL(params.redirect_uri);
    url.searchParams.set("error", "access_denied");
    url.searchParams.set(
      "error_description",
      "The user cancelled the authorization request"
    );
    if (params.state) url.searchParams.set("state", params.state);
    window.location.href = url.toString();
  }, [denied, params]);

  if (!params) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 font-syne">
        <h1 className="text-[24px] font-unbounded text-black mb-3">
          Authorization error
        </h1>
        <p className="text-sm text-[#3A3A3A]">
          This page is reached by an MCP client during sign-in and requires a
          valid authorization URL. Open this from a Koho Decks MCP client
          configuration flow instead.
        </p>
      </div>
    );
  }

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      const { redirect_url } = await OAuthClientsApi.submitConsent(params);

      // Hand the auth code to the client's local callback server via a
      // no-cors fetch. Native MCP clients (Claude Desktop, Claude Code,
      // Cursor) listen on a loopback port and only care about receiving
      // the code — they don't set CORS headers, so the browser treats
      // this as an opaque request. Once fired, the client has the code
      // and we can close the tab ourselves without ever showing the
      // client's own (usually unstyled) success page.
      try {
        await fetch(redirect_url, { mode: "no-cors", credentials: "omit" });
      } catch {
        // Non-fatal: if the fetch fails (e.g. localhost server already
        // closed, extreme network sandbox), fall through to the hard
        // navigation below so the user isn't stranded.
      }

      setSuccess(true);

      // Attempt to close the tab after a beat. window.close() only works
      // when the tab was opened programmatically (some MCP clients do this
      // via window.open, others via OS `open`). If the browser refuses,
      // we fall back to the hard navigation so Claude's own callback page
      // takes over and the user can close it themselves.
      setTimeout(() => {
        window.close();
        // Still here? Browser refused the close — do the navigation so
        // the client's callback server definitely processes the code.
        setTimeout(() => {
          window.location.href = redirect_url;
        }, 400);
      }, 900);
    } catch (err) {
      notify.error(
        "Could not complete authorization",
        err instanceof Error ? err.message : "Unknown error"
      );
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-6 py-20 font-syne text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-[#E6FBF1] flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-[#00C278]" />
        </div>
        <h1 className="text-[22px] font-unbounded tracking-[-0.66px] text-black mb-3">
          Authorization complete
        </h1>
        <p className="text-sm text-[#3A3A3A] max-w-sm mx-auto leading-relaxed">
          <span className="font-medium text-black">{clientName}</span> can now
          act as you on Koho Decks. You can close this tab and return to your
          MCP client.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-6 py-16 font-syne">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-full bg-[#E6FBF1] flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-[#00C278]" />
        </div>
        <h1 className="text-[24px] font-unbounded tracking-[-0.72px] text-black">
          Authorize {clientName}?
        </h1>
      </div>

      <p className="text-sm text-[#3A3A3A] mb-6 leading-relaxed">
        <span className="font-medium text-black">{clientName}</span> is
        requesting access to Koho Decks as you. If you approve, it will be
        able to list, create, edit, and export your presentations — the same
        operations you can perform in the web app.
      </p>

      <p className="text-xs text-[#6B7280] mb-6">
        You can revoke this authorization at any time from{" "}
        <a
          href="/settings/oauth-clients"
          className="underline text-[#00C278]"
        >
          Authorized clients
        </a>
        .
      </p>

      <div className="flex gap-3">
        <Button
          variant="ghost"
          onClick={() => setDenied(true)}
          disabled={submitting}
        >
          Cancel
        </Button>
        <Button onClick={handleApprove} disabled={submitting} className="flex-1">
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Authorizing…
            </>
          ) : (
            `Approve ${clientName}`
          )}
        </Button>
      </div>
    </div>
  );
};

export default ConsentPage;
