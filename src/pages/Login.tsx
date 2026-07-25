import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { getPostLoginPath } from "@/lib/postLoginRedirect";
import { supabase } from "@/integrations/supabase/client";
import { Helmet } from "react-helmet-async";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [mfaStep, setMfaStep] = useState<null | { factorId: string }>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaVerifying, setMfaVerifying] = useState(false);

  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const stateFrom: string | undefined = location.state?.from?.pathname;
  const readNextParam = (): string | undefined => {
    try {
      const raw = new URLSearchParams(location.search).get("next");
      if (!raw) return undefined;
      // Only allow same-origin relative paths.
      if (!raw.startsWith("/") || raw.startsWith("//")) return undefined;
      return raw;
    } catch {
      return undefined;
    }
  };
  const readPendingPath = (): string | undefined => {
    try {
      const raw = localStorage.getItem("pendingAuthAction");
      if (!raw) return undefined;
      const parsed = JSON.parse(raw) as { path?: string };
      return parsed?.path;
    } catch {
      return undefined;
    }
  };
  const readStoredRedirect = (): string | undefined => {
    try {
      const v = sessionStorage.getItem("post_login_redirect");
      return v ?? undefined;
    } catch {
      return undefined;
    }
  };
  const consumeStoredRedirect = () => {
    try { sessionStorage.removeItem("post_login_redirect"); } catch { /* ignore */ }
  };
  const nextParam = readNextParam();
  const from: string | undefined = nextParam ?? stateFrom ?? readPendingPath() ?? readStoredRedirect();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error.message,
      });
      setIsLoading(false);
      return;
    }

    // Check if MFA is required
    const { data: aalData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalData?.nextLevel === "aal2" && aalData.currentLevel === "aal1") {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.find((f) => f.status === "verified");
      if (totp) {
        setMfaStep({ factorId: totp.id });
        setIsLoading(false);
        return;
      }
    }

    toast({
      title: "Welcome back!",
      description: "You've successfully logged in.",
    });

    // Resolve role-based redirect
    const { data: { user } } = await supabase.auth.getUser();
    const dest = from ?? (user ? await getPostLoginPath(user.id) : "/learn");
    consumeStoredRedirect();
    try { localStorage.removeItem("pendingAuthAction"); } catch { /* ignore */ }
    navigate(dest, { replace: true });

    setIsLoading(false);
  };

  const handleMfaVerify = async () => {
    if (!mfaStep || mfaCode.length !== 6) return;
    setMfaVerifying(true);
    const { data: challenge, error: chErr } = await supabase.auth.mfa.challenge({ factorId: mfaStep.factorId });
    if (chErr || !challenge) {
      toast({ variant: "destructive", title: "Challenge failed", description: chErr?.message });
      setMfaVerifying(false);
      return;
    }
    const { error } = await supabase.auth.mfa.verify({
      factorId: mfaStep.factorId,
      challengeId: challenge.id,
      code: mfaCode,
    });
    if (error) {
      toast({ variant: "destructive", title: "Invalid code", description: error.message });
      setMfaVerifying(false);
      setMfaCode("");
      return;
    }
    toast({ title: "Welcome back!" });
    const { data: { user } } = await supabase.auth.getUser();
    const dest = from ?? (user ? await getPostLoginPath(user.id) : "/learn");
    consumeStoredRedirect();
    try { localStorage.removeItem("pendingAuthAction"); } catch { /* ignore */ }
    navigate(dest, { replace: true });
    setMfaVerifying(false);
  };


  return (
    <>
      <Helmet>
        <title>Sign in — Parikshaa</title>
        <meta name="description" content="Sign in to Parikshaa to continue your proctored assessments, track your progress, and access your learning dashboard." />
        <link rel="canonical" href="https://www.parikshaa.org/login" />
        <meta property="og:title" content="Sign in — Parikshaa" />
        <meta property="og:description" content="Sign in to continue your proctored assessments and learning progress on Parikshaa." />
        <meta property="og:url" content="https://www.parikshaa.org/login" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Parikshaa" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sign in — Parikshaa" />
        <meta name="twitter:description" content="Sign in to continue your proctored assessments on Parikshaa." />
      </Helmet>
    <AuthLayout
      title="Welcome back to Parikshaa"
      subtitle="Sign in to continue tracking your sheets, contests, jobs and events — all in one place."
    >
      {mfaStep ? (
        <div className="space-y-5">
          <div className="text-center">
            <h1
              
              className="font-apex-display text-[28px] font-bold leading-[1.1] tracking-tight text-foreground"
            >
              Two-factor authentication
            </h1>
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              Enter the 6-digit code from your authenticator app.
            </p>
          </div>
          <div className="flex justify-center">
            <InputOTP maxLength={6} value={mfaCode} onChange={setMfaCode}>
              <InputOTPGroup>
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot key={i} index={i} />
                ))}
              </InputOTPGroup>
            </InputOTP>
          </div>
          <Button
            className="h-12 w-full rounded-xl bg-primary text-[12.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-none hover:bg-primary/90"
            onClick={handleMfaVerify}
            disabled={mfaVerifying || mfaCode.length !== 6}
          >
            {mfaVerifying ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              "Verify"
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            onClick={async () => {
              await supabase.auth.signOut();
              setMfaStep(null);
              setMfaCode("");
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 lg:hidden">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
                Welcome back
              </span>
            </div>
            <h1
              
              className="font-apex-display text-[28px] font-bold leading-[1.1] tracking-tight text-foreground"
            >
              Sign in to your account
            </h1>
            <p className="mt-2 text-[13.5px] text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="font-semibold text-primary hover:text-primary/80 hover:underline">
                Sign up
              </Link>
            </p>
          </div>


          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-foreground/80">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl border-border/60 bg-card/60 pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-primary/40"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-foreground/80">Password</Label>
                <Link to="/forgot-password" className="text-[12.5px] font-semibold text-primary hover:text-primary/80 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 rounded-xl border-border/60 bg-card/60 pl-10 pr-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-primary/40"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-xl bg-primary text-[12.5px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-none transition-all hover:bg-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        </>
      )}
    </AuthLayout>
    </>
  );
};

export default Login;
