import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AuthLayout from "@/components/AuthLayout";
import { Helmet } from "react-helmet-async";
import { trackEvent } from "@/lib/analytics";

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [invitePrefill, setInvitePrefill] = useState<string | null>(null);

  const { signUp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const nextParam = useMemo(() => {
    try {
      const raw = new URLSearchParams(location.search).get("next");
      if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return null;
      return raw;
    } catch {
      return null;
    }
  }, [location.search]);

  useEffect(() => {
    try {
      const e = sessionStorage.getItem("invite_prefill_email");
      if (e) {
        setEmail(e);
        setInvitePrefill(e);
      }
    } catch { /* ignore */ }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptTerms) {
      toast({
        variant: "destructive",
        title: "Terms required",
        description: "Please accept the terms and conditions to continue.",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters.",
      });
      return;
    }

    setIsLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      trackEvent("signup_failed", { reason: error.message?.slice(0, 80) ?? "unknown" });
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error.message,
      });
    } else {
      let source: string | null = null;
      try {
        source = sessionStorage.getItem("signup_source");
        if (source) sessionStorage.removeItem("signup_source");
      } catch { /* ignore */ }
      trackEvent("signup_success", { source: source ?? "direct", method: "password" });
      let redirect: string | null = null;
      try {
        redirect = sessionStorage.getItem("post_login_redirect");
        if (redirect) {
          sessionStorage.removeItem("post_login_redirect");
          sessionStorage.removeItem("invite_prefill_email");
        }
      } catch { /* ignore */ }

      if (redirect) {
        toast({
          title: "Account created",
          description: "Taking you to your assessment…",
        });
        navigate(redirect, { replace: true });
      } else if (nextParam) {
        // Send user through /login (preserving next) so OAuth consent resumes cleanly.
        navigate(`/login?next=${encodeURIComponent(nextParam)}`);
      } else {
        toast({
          title: "Welcome!",
          description: "Your account is ready.",
        });
        navigate("/login");
      }
    }

    setIsLoading(false);
  };


  return (
    <>
      <Helmet>
        <title>Sign up — Parikshaa</title>
        <meta name="description" content="Create your free Parikshaa account to start practising for proctored contests, track DSA progress, and unlock structured learning sheets." />
        <link rel="canonical" href="https://www.parikshaa.org/signup" />
        <meta property="og:title" content="Sign up — Parikshaa" />
        <meta property="og:description" content="Create your free account and start preparing with Parikshaa's proctored contests and structured learning." />
        <meta property="og:url" content="https://www.parikshaa.org/signup" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Parikshaa" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Sign up — Parikshaa" />
        <meta name="twitter:description" content="Create your free Parikshaa account to start preparing." />
      </Helmet>
    <AuthLayout
      title="Start your journey with Parikshaa"
      subtitle="Join thousands of students preparing for sheets, contests, jobs and events — all in one place."
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 lg:hidden">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
            Join 10,000+ students
          </span>
        </div>
        <h1 className="font-apex-display text-[28px] font-bold leading-[1.1] tracking-tight text-foreground">
          Create your account
        </h1>
        <p className="mt-3 text-[14px] leading-[1.55] text-muted-foreground">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-primary hover:text-primary/80 hover:underline">
            Sign in
          </Link>
        </p>
      </div>


      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="fullName" className="text-foreground/80">Full Name</Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="fullName"
              type="text"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="h-12 rounded-xl border-border/60 bg-card/60 pl-10 text-foreground placeholder:text-muted-foreground/60 focus-visible:border-primary/50 focus-visible:ring-primary/40"
              required
            />
          </div>
        </div>

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
          {invitePrefill && email === invitePrefill && (
            <p className="text-xs text-primary">Use this email — it matches your invite</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password" className="text-foreground/80">Password</Label>
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
              minLength={6}
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
          <p className="text-xs text-muted-foreground">Must be at least 6 characters</p>
        </div>

        <div className="flex items-start gap-2 pt-1">
          <Checkbox
            id="terms"
            checked={acceptTerms}
            onCheckedChange={(checked) => setAcceptTerms(checked === true)}
            className="mt-0.5 border-border/70 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
          />
          <Label htmlFor="terms" className="cursor-pointer text-[13px] leading-tight text-muted-foreground">
            I agree to the{" "}
            <Link to="/terms" className="font-semibold text-primary hover:text-primary/80 hover:underline">Terms</Link>
            {" "}and{" "}
            <Link to="/privacy" className="font-semibold text-primary hover:text-primary/80 hover:underline">Privacy Policy</Link>
          </Label>
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
              Create Account
              <ArrowRight className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </form>

      {/* Back to home - mobile only */}
      <p className="mt-4 text-center text-[12.5px] text-muted-foreground lg:hidden">
        <Link to="/" className="transition-colors hover:text-primary">
          ← Back to home
        </Link>
      </p>
    </AuthLayout>
    </>
  );
};

export default Signup;
