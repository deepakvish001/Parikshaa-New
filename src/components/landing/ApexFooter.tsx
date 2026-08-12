import { motion, useInView, useReducedMotion, MotionConfig, AnimatePresence } from "framer-motion";
import { useRef, useState } from "react";

import { Link } from "react-router-dom";
import { ArrowRight, Check, Loader2, MessageSquare, Mail, User, Send, Sparkles, Phone, CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { SectionEyebrow } from "./SectionEyebrow";
import { HeroStyleHeading, Highlight, Shimmer, Muted } from "./HeroStyleHeading";
import { ParikshaaBrandLogo } from "@/components/brand/ParikshaaBrandLogo";
import { getStoredUtm, trackLeadEvent } from "@/lib/leadTracking";
import { trackEvent } from "@/lib/analytics";

const phoneRegex = /^[+\d][\d\s\-()]{6,18}\d$/;

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(80, "Name is too long"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email like name@college.edu").max(160, "Email is too long"),
  phone: z
    .string()
    .trim()
    .min(1, "Mobile / WhatsApp number is required")
    .max(20, "Number is too long")
    .regex(phoneRegex, "Enter a valid mobile / WhatsApp number (with country code)"),
  message: z.string().trim().min(5, "Add a short message (min 5 chars)").max(600, "Keep it under 600 characters"),
  // honeypot — real users leave this empty
  website: z.string().max(0, "Bot detected").optional().or(z.literal("")),
});

/**
 * Shared shell for the two stacked hero-style blocks in the footer
 * (Signal Feed + Mentor Desk). Guarantees identical max-width,
 * horizontal centering, min-w-0 (no overflow on small screens),
 * and consistent internal padding across breakpoints.
 */
function StackedSection({
  id,
  variant = "plain",
  ariaLabelledBy,
  children,
}: {
  id?: string;
  variant?: "plain" | "card";
  ariaLabelledBy?: string;
  children: React.ReactNode;
}) {
  const base = "relative w-full min-w-0 scroll-mt-24";
  if (variant === "card") {
    return (
      <aside
        id={id}
        aria-labelledby={ariaLabelledBy}
        className={`${base} overflow-hidden rounded-2xl border border-border/70 bg-card/60 p-6 shadow-[0_20px_60px_-30px_hsl(var(--primary)/0.35)] backdrop-blur-sm sm:p-8 md:p-10`}
      >
        {children}
      </aside>
    );
  }
  return <section id={id} className={`${base} px-1 sm:px-0`}>{children}</section>;
}


// Client-side ad-hoc rate limit: 30s cooldown + max 5 submits / hour.
// NOTE: This is a client-only guard; the backend has no standard rate-limiting
// primitive yet, so a determined bot can bypass it — proper server-side limits
// will land when infra is available.
const RL_KEY = "parikshaa_contact_submits_v1";
const RL_WINDOW_MS = 60 * 60 * 1000;
const RL_MAX = 5;
const RL_COOLDOWN_MS = 30 * 1000;

function checkContactRateLimit(): string | null {
  try {
    const now = Date.now();
    const raw = localStorage.getItem(RL_KEY);
    const arr: number[] = raw ? JSON.parse(raw) : [];
    const recent = arr.filter((t) => now - t < RL_WINDOW_MS);
    if (recent.length && now - recent[recent.length - 1] < RL_COOLDOWN_MS) {
      const wait = Math.ceil((RL_COOLDOWN_MS - (now - recent[recent.length - 1])) / 1000);
      return `Please wait ${wait}s before sending another message.`;
    }
    if (recent.length >= RL_MAX) {
      return "Too many messages sent recently. Try again in an hour.";
    }
    localStorage.setItem(RL_KEY, JSON.stringify([...recent, now]));
    return null;
  } catch {
    return null;
  }
}






const footerLinks: Record<string, { label: string; href: string }[]> = {
  Product: [
    { label: "Learn", href: "/learn" },
    { label: "Problems", href: "/library/problems" },
    { label: "League", href: "/league" },
    { label: "Blog", href: "/blog" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "Guides", href: "/blog" },
    { label: "Community", href: "#" },
    { label: "Achievements", href: "/achievements" },
    { label: "Templates", href: "#" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#" },
    { label: "Partners", href: "#" },
    { label: "Press", href: "#" },
  ],
  Legal: [
    { label: "Privacy", href: "#" },
    { label: "Terms", href: "#" },
    { label: "Security", href: "#" },
    { label: "Cookies", href: "#" },
    { label: "Licenses", href: "#" },
  ],
};

export interface ApexFooterProps {
  /**
   * When true, disables all decorative animations (shimmer, pulse-glow, and
   * framer-motion entrance transitions) regardless of the user's
   * `prefers-reduced-motion` setting. Use in visual regression tests to get
   * deterministic screenshots without relying on the media query.
   */
  freezeAnimations?: boolean;
}

export function ApexFooter({ freezeAnimations = false }: ApexFooterProps = {}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-50px" });
  const systemPrefersReducedMotion = useReducedMotion();
  const prefersReducedMotion = freezeAnimations || systemPrefersReducedMotion;

  // Render timestamp — sent to edge functions to help block instant bot submits.
  const renderedAtRef = useRef<number>(Date.now());

  // Analytics context shared across events for easy funnel slicing.
  const analyticsContext = {
    page_name: typeof window !== "undefined" ? window.location.pathname : "unknown",
    referrer: typeof document !== "undefined" ? document.referrer : "",
  };

  // Live-region + focus refs for a11y announcements.
  const contactLiveRef = useRef<HTMLDivElement | null>(null);
  const subscribeLiveRef = useRef<HTMLDivElement | null>(null);
  const contactFirstErrorRef = useRef<HTMLElement | null>(null);
  const thankyouHeadingRef = useRef<HTMLHeadingElement | null>(null);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [subscribeAnnouncement, setSubscribeAnnouncement] = useState("");

  const [contact, setContact] = useState({ name: "", email: "", phone: "", message: "", website: "" });
  const [contactStatus, setContactStatus] = useState<"idle" | "loading" | "success">("idle");
  const [contactErrors, setContactErrors] = useState<{ name?: string; email?: string; phone?: string; message?: string }>({});
  const [contactAnnouncement, setContactAnnouncement] = useState("");

  const setContactField = (field: keyof typeof contact) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const v = e.target.value;
    setContact((c) => ({ ...c, [field]: v }));
    if (contactErrors[field as keyof typeof contactErrors]) {
      setContactErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const resetContactForm = () => {
    setContact({ name: "", email: "", phone: "", message: "", website: "" });
    setContactErrors({});
    setContactStatus("idle");
    setContactAnnouncement("");
    renderedAtRef.current = Date.now();
  };

  const focusFirstContactError = (errs: Record<string, string | undefined>) => {
    const order: (keyof typeof contactErrors)[] = ["name", "email", "phone", "message"];
    const first = order.find((k) => errs[k]);
    if (!first) return;
    const el = document.getElementById(`footer-contact-${first}`) as HTMLElement | null;
    contactFirstErrorRef.current = el;
    // defer to allow aria-invalid to apply
    setTimeout(() => el?.focus({ preventScroll: false }), 0);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = z.string().trim().min(1).max(255).email().safeParse(email);
    const baseProps = {
      ...analyticsContext,
      form_type: "newsletter_subscribe",
      source: "landing_footer",
    };
    if (!parsed.success) {
      const msg = "Enter a valid email address";
      toast({ title: "Invalid email", description: msg, variant: "destructive" });
      setSubscribeAnnouncement(`Error: ${msg}`);
      trackEvent("newsletter_subscribe_failed", { ...baseProps, error_reason: "invalid_email" });
      return;
    }
    setStatus("loading");
    setSubscribeAnnouncement("Subscribing…");
    trackEvent("newsletter_subscribe_click", baseProps);

    try {
      const { data: res, error } = await supabase.functions.invoke("subscribe-newsletter", {
        body: {
          email: parsed.data,
          source: "landing_footer",
          rendered_at: renderedAtRef.current,
        },
      });
      const serverErr = (res as { error?: string; code?: string } | null) ?? null;
      if (error || serverErr?.error) {
        setStatus("idle");
        const msg = serverErr?.error || error?.message || "Please try again.";
        toast({ title: "Couldn't subscribe", description: msg, variant: "destructive" });
        setSubscribeAnnouncement(`Subscription failed: ${msg}`);
        trackEvent("newsletter_subscribe_failed", {
          ...baseProps,
          error_reason: serverErr?.code || msg,
        });
        return;
      }
      setStatus("success");
      setEmail("");
      toast({ title: "You're in!", description: "Weekly digest hits your inbox every Sunday." });
      setSubscribeAnnouncement("Subscribed successfully. Weekly digest hits your inbox every Sunday.");
      trackEvent("newsletter_subscribe_success", {
        ...baseProps,
        duplicate: (res as { duplicate?: boolean } | null)?.duplicate ? "true" : "false",
      });
      setTimeout(() => setStatus("idle"), 3500);
    } catch (err) {
      setStatus("idle");
      const msg = err instanceof Error ? err.message : "Network error";
      toast({ title: "Couldn't subscribe", description: msg, variant: "destructive" });
      setSubscribeAnnouncement(`Subscription failed: ${msg}`);
      trackEvent("newsletter_subscribe_failed", { ...baseProps, error_reason: msg });
    }
  };

  const handleContact = async (e: React.FormEvent) => {
    e.preventDefault();
    const baseProps = {
      ...analyticsContext,
      form_type: "student_contact",
      source: "footer_student_contact",
    };
    const parsed = contactSchema.safeParse(contact);
    if (!parsed.success) {
      const errs: typeof contactErrors = {};
      parsed.error.issues.forEach((i) => {
        const k = i.path[0] as keyof typeof errs;
        if (!errs[k]) errs[k] = i.message;
      });
      setContactErrors(errs);
      if (contact.website && contact.website.length > 0) {
        trackEvent("student_contact_bot_blocked", { ...baseProps, error_reason: "honeypot_client" });
        return;
      }
      const fieldList = Object.keys(errs).join(",");
      setContactAnnouncement(`Please fix ${Object.keys(errs).length} error${Object.keys(errs).length > 1 ? "s" : ""}: ${Object.values(errs).filter(Boolean).join(". ")}`);
      focusFirstContactError(errs);
      trackEvent("student_contact_validation_failed", {
        ...baseProps,
        error_reason: `invalid_fields:${fieldList}`,
      });
      return;
    }

    const rlReason = checkContactRateLimit();
    if (rlReason) {
      toast({ title: "Slow down", description: rlReason, variant: "destructive" });
      setContactAnnouncement(rlReason);
      trackEvent("student_contact_rate_limited", { ...baseProps, error_reason: "client_rate_limit" });
      return;
    }

    setContactErrors({});
    setContactStatus("loading");
    setContactAnnouncement("Sending your message…");
    trackEvent("student_contact_submit", baseProps);
    try {
      const utm = getStoredUtm();
      const { data: res, error } = await supabase.functions.invoke("submit-demo-request", {
        body: {
          name: parsed.data.name,
          email: parsed.data.email,
          org: "Student inquiry",
          useCase: "student",
          candidates: "0-100",
          proctoring: [],
          reporting: [],
          notes: `Phone / WhatsApp: ${parsed.data.phone}\n\n${parsed.data.message}`,
          website: contact.website, // honeypot — server verifies
          rendered_at: renderedAtRef.current,
          utm: { ...utm, content: utm?.content || "footer_student_contact" },
          referrer: typeof document !== "undefined" ? document.referrer : null,
          landingPage: typeof window !== "undefined" ? window.location.pathname + window.location.search : null,
        },
      });
      const serverErr = (res as { error?: string; code?: string } | null) ?? null;
      if (error || serverErr?.error) {
        setContactStatus("idle");
        const msg = serverErr?.error || error?.message || "Please try again.";
        const code = serverErr?.code || "unknown";
        toast({ title: "Couldn't send", description: msg, variant: "destructive" });
        setContactAnnouncement(`Send failed: ${msg}`);
        trackEvent("student_contact_failed", { ...baseProps, error_reason: code });
        return;
      }
      await trackLeadEvent("footer_student_contact_submitted", {
        source: "footer_student_contact",
        lead_id: (res as { id?: string } | null)?.id,
      });
      trackEvent("student_contact_success", {
        ...baseProps,
        lead_id: (res as { id?: string } | null)?.id,
      });
      setContactStatus("success");
      setContactAnnouncement("Message sent. Our mentor team will reach out within one business day.");
      // Move focus to the thank-you heading once it renders
      setTimeout(() => thankyouHeadingRef.current?.focus(), 60);
    } catch (err) {
      console.error("[footer-contact] error", err);
      setContactStatus("idle");
      const msg = err instanceof Error ? err.message : "Network error";
      toast({ title: "Something went wrong", description: "Please try again.", variant: "destructive" });
      setContactAnnouncement(`Send failed: ${msg}`);
      trackEvent("student_contact_failed", { ...baseProps, error_reason: msg });
    }
  };






  return (
    <MotionConfig reducedMotion={freezeAnimations ? "always" : "user"}>
    <footer
      id="footer"
      ref={ref}
      data-freeze-animations={freezeAnimations ? "true" : undefined}
      className="relative isolate overflow-hidden border-t border-border/60 bg-background"
    >

      {/* Radial rays backdrop — identical to hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[900px] opacity-[0.35]"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 0%, hsl(var(--primary)/0.28), transparent 65%)",
        }}
      />
      {/* faint diagonal streaks — identical layer to hero */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
          maskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 65% 60% at 50% 20%, black, transparent 75%)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28">

        {/* Newsletter + Student contact row — hero-matched layout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="mx-auto mb-14 flex w-full max-w-3xl flex-col gap-12 border-b border-border/60 pb-12 sm:mb-16 sm:gap-14 sm:pb-14 lg:gap-16"
        >
          <StackedSection id="signal-feed">
          <HeroStyleHeading
            eyebrowKicker="07"
            eyebrowLabel="LeetLeague Feed / Weekly Digest"
            headingId="signal-feed-heading"
            as="h2"
            subheadPrimary="One email, zero fluff."
            subheadSecondary=" The patterns, problems and company signals worth your Sunday."
          >
            <span className="block">New problems &amp;</span>
            <span className="block">
              <Highlight>interview</Highlight> <Shimmer>drops</Shimmer>
            </span>
            <span className="block">
              every <Muted>Sunday.</Muted>
            </span>
          </HeroStyleHeading>

          <div className="flex min-w-0 flex-col text-center">


            <form
              onSubmit={handleSubscribe}
              aria-label="Subscribe to weekly digest"
              className="mx-auto mt-7 flex w-full max-w-md flex-col gap-2 sm:mt-8 sm:flex-row sm:items-center"
            >
              <label htmlFor="footer-newsletter-email" className="sr-only">
                Email address
              </label>
              <input
                id="footer-newsletter-email"
                type="email"
                placeholder="you@college.edu"
                aria-label="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={status !== "idle"}
                required
                className="focus-parikshaa h-12 w-full flex-1 rounded-lg border border-border bg-card/60 px-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 disabled:opacity-70"
              />
              <button
                type="submit"
                disabled={status !== "idle"}
                aria-label="Subscribe to weekly digest"
                className="group inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-[12px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_0_30px_-8px_hsl(var(--primary)/0.7)] transition-all hover:bg-primary/90 hover:shadow-[0_0_50px_-6px_hsl(var(--primary)/0.9)] active:scale-[0.98] disabled:opacity-80 sm:w-auto"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Subscribing
                  </>
                ) : status === "success" ? (
                  <>
                    <Check className="h-4 w-4" aria-hidden />
                    Subscribed
                  </>
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                  </>
                )}
              </button>
            </form>

            {/* Live region for subscribe status (a11y) */}
            <div
              ref={subscribeLiveRef}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            >
              {subscribeAnnouncement}
            </div>


            <div className="mt-5 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground/80">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden /> 12k+ students
              </span>
              <span aria-hidden className="h-1 w-1 rounded-full bg-border" />
              <span>No spam · Unsubscribe anytime</span>
            </div>
          </div>
          </StackedSection>


          {/* BOTTOM — student contact card */}
          <StackedSection id="mentor-desk" variant="card" ariaLabelledBy="student-contact-heading">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
            />
            <div className="relative">
              <AnimatePresence mode="wait" initial={false}>
                {contactStatus === "success" ? (
                  <motion.div
                    key="thankyou"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                    className="flex min-h-[360px] flex-col items-center justify-center text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 14, delay: 0.05 }}
                      className="mb-5 grid h-16 w-16 place-items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 shadow-[0_0_40px_-8px_hsl(var(--primary)/0.6)]"
                    >
                      <CheckCircle2 className="h-8 w-8 text-emerald-500" aria-hidden />
                    </motion.div>
                    <h3
                      ref={thankyouHeadingRef}
                      tabIndex={-1}
                      style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                      className="text-2xl font-bold tracking-[-0.02em] text-foreground outline-none sm:text-3xl"
                    >
                      धन्यवाद! Message received.
                    </h3>

                    <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                      Our mentor team will reach out on your email &amp; WhatsApp within{" "}
                      <span className="text-foreground">1 business day</span>. Meanwhile, keep grinding.
                    </p>
                    <button
                      type="button"
                      onClick={resetContactForm}
                      className="mt-6 inline-flex items-center gap-2 rounded-lg border border-border bg-background/60 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.14em] text-foreground transition-colors hover:border-primary/50 hover:text-primary"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <HeroStyleHeading
                      eyebrowKicker="08"
                      eyebrowLabel="For Students / Mentor Desk"
                      headingId="student-contact-heading"
                      as="h3"
                      subheadPrimary="Real mentors. Real replies. Free."
                      subheadSecondary=" Career doubts, placement prep, or a topic you're stuck on — drop a note and a mentor will reply within 1 business day."
                    >
                      <span className="block">
                        <Highlight>Stuck</Highlight> <Muted>somewhere?</Muted>
                      </span>
                      <span className="block">
                        <Shimmer>Talk to us.</Shimmer>
                      </span>
                    </HeroStyleHeading>

                    <form onSubmit={handleContact} noValidate aria-describedby="footer-contact-live" className="mt-6 space-y-3">
                      {/* Live region — announces validation errors + async status */}
                      <div
                        id="footer-contact-live"
                        ref={contactLiveRef}
                        role="status"
                        aria-live="polite"
                        aria-atomic="true"
                        className="sr-only"
                      >
                        {contactAnnouncement}
                      </div>

                      {/* Honeypot — hidden from real users, tempting to bots */}
                      <div aria-hidden className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden" tabIndex={-1}>
                        <label htmlFor="footer-contact-website">Website (leave empty)</label>
                        <input
                          id="footer-contact-website"
                          type="text"
                          tabIndex={-1}
                          autoComplete="off"
                          value={contact.website}
                          onChange={setContactField("website")}
                        />
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div>
                          <label htmlFor="footer-contact-name" className="sr-only">Your name</label>
                          <div className="relative">
                            <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                            <input
                              id="footer-contact-name"
                              type="text"
                              placeholder="Your name"
                              value={contact.name}
                              maxLength={80}
                              onChange={setContactField("name")}
                              disabled={contactStatus !== "idle"}
                              aria-invalid={!!contactErrors.name}
                              aria-describedby={contactErrors.name ? "footer-contact-name-err" : undefined}
                              className={`focus-parikshaa h-11 w-full rounded-lg border bg-background/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 disabled:opacity-70 ${contactErrors.name ? "border-destructive/60" : "border-border"}`}
                            />
                          </div>
                          {contactErrors.name && (
                            <p id="footer-contact-name-err" className="mt-1 text-[11px] text-destructive">{contactErrors.name}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="footer-contact-email" className="sr-only">Email</label>
                          <div className="relative">
                            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                            <input
                              id="footer-contact-email"
                              type="email"
                              placeholder="you@college.edu"
                              value={contact.email}
                              maxLength={160}
                              onChange={setContactField("email")}
                              disabled={contactStatus !== "idle"}
                              aria-invalid={!!contactErrors.email}
                              aria-describedby={contactErrors.email ? "footer-contact-email-err" : undefined}
                              className={`focus-parikshaa h-11 w-full rounded-lg border bg-background/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 disabled:opacity-70 ${contactErrors.email ? "border-destructive/60" : "border-border"}`}
                            />
                          </div>
                          {contactErrors.email && (
                            <p id="footer-contact-email-err" className="mt-1 text-[11px] text-destructive">{contactErrors.email}</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <label htmlFor="footer-contact-phone" className="sr-only">Mobile / WhatsApp number</label>
                        <div className="relative">
                          <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                          <input
                            id="footer-contact-phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            placeholder="Mobile / WhatsApp (e.g. +91 98765 43210)"
                            value={contact.phone}
                            maxLength={20}
                            onChange={setContactField("phone")}
                            disabled={contactStatus !== "idle"}
                            aria-invalid={!!contactErrors.phone}
                            aria-describedby={contactErrors.phone ? "footer-contact-phone-err" : undefined}
                            className={`focus-parikshaa h-11 w-full rounded-lg border bg-background/60 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground/60 disabled:opacity-70 ${contactErrors.phone ? "border-destructive/60" : "border-border"}`}
                          />
                        </div>
                        {contactErrors.phone && (
                          <p id="footer-contact-phone-err" className="mt-1 text-[11px] text-destructive">{contactErrors.phone}</p>
                        )}
                      </div>

                      <div>
                        <label htmlFor="footer-contact-message" className="sr-only">Message</label>
                        <textarea
                          id="footer-contact-message"
                          placeholder="What do you need help with?"
                          value={contact.message}
                          maxLength={600}
                          rows={3}
                          onChange={setContactField("message")}
                          disabled={contactStatus !== "idle"}
                          aria-invalid={!!contactErrors.message}
                          aria-describedby={contactErrors.message ? "footer-contact-message-err" : undefined}
                          className={`focus-parikshaa w-full resize-none rounded-lg border bg-background/60 px-3 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 disabled:opacity-70 ${contactErrors.message ? "border-destructive/60" : "border-border"}`}
                        />
                        <div className="mt-1 flex items-start justify-between gap-3">
                          {contactErrors.message ? (
                            <p id="footer-contact-message-err" className="text-[11px] text-destructive">{contactErrors.message}</p>
                          ) : (
                            <span />
                          )}
                          <span className="shrink-0 text-[10.5px] tabular-nums text-muted-foreground/70">
                            {contact.message.length}/600
                          </span>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={contactStatus !== "idle"}
                        className="group inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-[12px] font-bold uppercase tracking-[0.14em] text-primary-foreground shadow-[0_0_30px_-8px_hsl(var(--primary)/0.7)] transition-all hover:bg-primary/90 hover:shadow-[0_0_50px_-6px_hsl(var(--primary)/0.9)] active:scale-[0.98] disabled:opacity-80"
                      >
                        {contactStatus === "loading" ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Sending
                          </>
                        ) : (
                          <>
                            Send message <Send className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                          </>
                        )}
                      </button>
                      <p className="text-center text-[11px] text-muted-foreground/80">
                        Typical reply within 1 business day. Your details stay private.
                      </p>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </StackedSection>
        </motion.div>


        {/* Link grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-2 gap-10 md:grid-cols-5"
        >
          <div className="col-span-2 md:col-span-1">
            <ParikshaaBrandLogo size="sm" className="mb-5" />
            <p className="mb-5 max-w-[24ch] text-sm leading-relaxed text-muted-foreground">
              Learn to code. Land your role. Free forever for students.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-3 py-1.5">
              <span
                className="apex-pulse-glow h-2 w-2 rounded-full bg-primary motion-reduce:[animation:none] motion-reduce:shadow-none"
                style={prefersReducedMotion ? { animation: "none", boxShadow: "none" } : undefined}
              />

              <span className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-muted-foreground">
                All systems operational
              </span>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-5 font-mono text-[10.5px] font-semibold uppercase leading-relaxed tracking-[0.24em] text-muted-foreground/80">
                {title}
              </h3>

              <ul className="space-y-3">
                {links.map((l) => (
                  <li key={l.label}>
                    {l.href.startsWith("#") || l.href.startsWith("http") ? (
                      <a
                        href={l.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-primary"
                      >
                        {l.label}
                      </a>
                    ) : (
                      <Link
                        to={l.href}
                        className="text-sm text-foreground/80 transition-colors hover:text-primary"
                      >
                        {l.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Wordmark strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.25 }}
          aria-hidden
          className="mt-16 select-none border-t border-border/60 pt-8 sm:pt-10"
        >
          <div
            style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
            className="bg-gradient-to-b from-foreground/10 to-transparent bg-clip-text text-center text-[22vw] font-bold leading-none tracking-[-0.05em] text-transparent sm:text-[18vw]"
          >
            PARIKSHAA
          </div>
        </motion.div>

        {/* Bottom row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={isInView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-8 flex flex-col items-center gap-5 border-t border-border/60 pt-8 sm:flex-row sm:justify-between sm:gap-4"
        >
          <p className="text-center font-mono text-[10.5px] uppercase leading-relaxed tracking-[0.2em] text-muted-foreground sm:text-left sm:text-[11px]">
            © {new Date().getFullYear()} Parikshaa · Made in India
          </p>
          <nav aria-label="Social media" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
            {["Twitter", "GitHub", "LinkedIn"].map((s) => (
              <a
                key={s}
                href="#"
                aria-label={`Parikshaa on ${s}`}
                className="text-xs font-semibold uppercase leading-relaxed tracking-[0.14em] text-muted-foreground transition-colors hover:text-primary"
              >
                {s}
              </a>
            ))}
          </nav>

        </motion.div>
      </div>
    </footer>
    </MotionConfig>
  );

}

export default ApexFooter;
