"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

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
      window.location.href = redirect_url;
    } catch (err) {
      notify.error(
        "Could not complete authorization",
        err instanceof Error ? err.message : "Unknown error"
      );
      setSubmitting(false);
    }
  };

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

      <div className="border border-[#E1E1E5] rounded-lg p-4 mb-6 bg-[#F9FAFB]">
        <dl className="text-xs text-[#3A3A3A] space-y-1.5">
          <div className="flex justify-between">
            <dt>Client ID</dt>
            <dd className="font-mono text-black">{params.client_id}</dd>
          </div>
          <div className="flex justify-between">
            <dt>Redirect URL</dt>
            <dd className="font-mono text-black break-all max-w-[60%] text-right">
              {params.redirect_uri}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt>Scope</dt>
            <dd className="font-mono text-black">{params.scope}</dd>
          </div>
        </dl>
      </div>

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
