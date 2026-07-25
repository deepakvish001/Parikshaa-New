import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import AuthLayout from "@/components/AuthLayout";

// Local typed wrapper for the beta `supabase.auth.oauth` namespace.
type OAuthClient = { name?: string | null; client_uri?: string | null };
type AuthorizationDetails = {
  client?: OAuthClient | null;
  redirect_uri?: string | null;
  scope?: string | string[] | null;
  redirect_url?: string | null;
  redirect_to?: string | null;
};
type AuthOAuth = {
  getAuthorizationDetails(id: string): Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization(id: string): Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  denyAuthorization(id: string): Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
};
const authOAuth = (supabase.auth as unknown as { oauth: AuthOAuth }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) {
        setError("Missing authorization_id in the request URL.");
        return;
      }
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        // Preserve the FULL consent URL so auth returns the user here.
        const next = window.location.pathname + window.location.search;
        window.location.href = "/login?next=" + encodeURIComponent(next);
        return;
      }
      setEmail(sess.session.user?.email ?? null);

      if (!authOAuth?.getAuthorizationDetails) {
        setError(
          "OAuth is not available on this Supabase client. Please ensure the OAuth 2.1 server is enabled for this project.",
        );
        return;
      }
      const { data, error: err } = await authOAuth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (err) {
        setError(err.message);
        return;
      }
      // If the provider returned an immediate redirect (already approved, etc.), follow it.
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => {
      active = false;
    };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    setError(null);
    const { data, error: err } = approve
      ? await authOAuth.approveAuthorization(authorizationId)
      : await authOAuth.denyAuthorization(authorizationId);
    if (err) {
      setBusy(false);
      setError(err.message);
      return;
    }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) {
      setBusy(false);
      setError("No redirect returned by the authorization server.");
      return;
    }
    window.location.href = target;
  }

  const clientName = details?.client?.name ?? "an external app";
  const scopes = Array.isArray(details?.scope)
    ? details?.scope
    : typeof details?.scope === "string"
      ? details.scope.split(/\s+/).filter(Boolean)
      : [];

  return (
    <>
      <Helmet>
        <title>Authorize connection — Parikshaa</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <AuthLayout
        title={`Connect ${clientName} to Parikshaa`}
        subtitle="An external app is asking to act on your behalf while you are signed in."
      >
        <div className="space-y-5">
          {error && (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!details && !error && (
            <p className="text-sm text-muted-foreground">Loading authorization request…</p>
          )}

          {details && (
            <>
              <div className="rounded-xl border border-border/60 bg-card/60 p-4 text-sm">
                <div className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  Signed in as
                </div>
                <div className="font-medium text-foreground">{email ?? "—"}</div>
              </div>

              <div className="rounded-xl border border-border/60 bg-card/60 p-4 text-sm">
                <div className="mb-2 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  This lets {clientName} use Parikshaa as you
                </div>
                <ul className="list-disc space-y-1 pl-5 text-foreground/90">
                  <li>Call Parikshaa's enabled MCP tools on your behalf</li>
                  <li>Read your basic profile and email</li>
                  <li>Access your data only within the app's permissions and RLS policies</li>
                </ul>
                {scopes && scopes.length > 0 && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Requested scopes: <code>{scopes.join(" ")}</code>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-12 rounded-xl"
                  onClick={() => decide(false)}
                  disabled={busy}
                >
                  Cancel connection
                </Button>
                <Button
                  className="h-12 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  onClick={() => decide(true)}
                  disabled={busy}
                >
                  {busy ? "Working…" : "Approve"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                This does not bypass Parikshaa's permissions or backend policies.
              </p>
            </>
          )}
        </div>
      </AuthLayout>
    </>
  );
}
