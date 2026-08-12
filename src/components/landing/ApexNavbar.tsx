import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Menu, X } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { trackEvent } from "@/lib/analytics";
import { scrollToHash, HEADER_OFFSET_PX, resolveHeaderOffset } from "@/lib/smoothScroll";
import { ParikshaaBrandLogo } from "@/components/brand/ParikshaaBrandLogo";

const navItems = [
  { label: "Hub", href: "#all-in-one", kicker: "01" },
  { label: "Why League", href: "#why", kicker: "02" },
  { label: "Comparison", href: "#comparison", kicker: "03" },
  { label: "Mentor", href: "#mentor-desk", kicker: "04" },
  { label: "Learn", href: "/learn" },
];

/** Section ids the navbar scrollspy tracks — only ids with a visible nav item. */
const SECTION_IDS = ["hero", "all-in-one", "why", "comparison", "mentor-desk"];

function useScrollSpy(ids: string[], offset: number): string | null {
  const [active, setActive] = useState<string | null>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== "/") {
      setActive(null);
      return;
    }
    if (typeof window === "undefined" || typeof IntersectionObserver === "undefined") return;

    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;

    // Trigger point sits just below the sticky header.
    const rootMargin = `-${offset + 8}px 0px -60% 0px`;
    const visible = new Map<string, number>();

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            visible.set(entry.target.id, entry.intersectionRatio);
          } else {
            visible.delete(entry.target.id);
          }
        }
        // Pick the first section in DOM order that's currently in view.
        const next = ids.find((id) => visible.has(id));
        if (next) setActive(next);
      },
      { rootMargin, threshold: [0, 0.15, 0.4, 0.75, 1] },
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ids, offset, pathname]);

  return active;
}

export function ApexNavbar() {
  const { user, profile } = useAuth();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerOffset, setHeaderOffset] = useState<number>(HEADER_OFFSET_PX);
  const prefersReducedMotion = useReducedMotion();
  const headerRef = useRef<HTMLElement | null>(null);

  const initials =
    (profile?.full_name || user?.email || "U")
      .toString()
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s) => s[0]?.toUpperCase())
      .join("") || "U";

  // Measure the sticky header and publish `--header-h` + scroll-padding-top so
  // anchor jumps, scroll-spy trigger, and native #hash navigation stay aligned.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const el = headerRef.current;
    if (!el) return;

    const apply = () => {
      const h = Math.round(el.getBoundingClientRect().height);
      if (!h) return;
      document.documentElement.style.setProperty("--header-h", `${h}px`);
      document.documentElement.style.scrollPaddingTop = `${h + 8}px`;
      setHeaderOffset(resolveHeaderOffset(h));
    };
    apply();

    const ro = new ResizeObserver(apply);
    ro.observe(el);
    window.addEventListener("resize", apply);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [mobileMenuOpen]);

  const activeId = useScrollSpy(SECTION_IDS, headerOffset);

  const onNav = (label: string, href: string) =>
    trackEvent("nav_click", { label, href, location: "navbar" });
  const onCta = (label: string) => trackEvent("cta_click", { label, location: "navbar" });

  const isActive = (href: string) =>
    href.startsWith("#") && activeId !== null && href.slice(1) === activeId;

  return (
    <div className="fixed top-0 inset-x-0 z-50 pointer-events-none">
      <motion.header
        ref={headerRef}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full pointer-events-auto border-b border-primary/15 bg-background/75 backdrop-blur-xl"
      >
        {/* faint diagonal streaks — mirrors hero backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(-30deg, transparent 0 60px, hsl(var(--primary)/0.35) 60px 61px)",
            maskImage:
              "linear-gradient(to bottom, black, transparent 90%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black, transparent 90%)",
          }}
        />
        {/* amber radial + underglow — matches hero */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-full opacity-70"
          style={{
            background:
              "radial-gradient(ellipse 45% 160% at 50% -20%, hsl(var(--primary)/0.12), transparent 70%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent"
        />

        <nav
          aria-label="Primary"
          className="relative mx-auto flex w-full max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:px-6 lg:px-8"
        >
          <ParikshaaBrandLogo size="sm" className="sm:hidden" ariaLabel="LeetLeague home" />
          <ParikshaaBrandLogo size="sm" className="hidden sm:inline-flex lg:hidden" ariaLabel="LeetLeague home" />
          <ParikshaaBrandLogo size="md" className="hidden lg:inline-flex" ariaLabel="LeetLeague home" />


          <div className="hidden lg:flex items-center gap-1 relative rounded-full border border-border/50 bg-background/40 p-1 backdrop-blur-md">
            {navItems.map((item, index) => {
              const isHash = item.href.startsWith("#");
              const active = isActive(item.href);
              const inner = (
                <>
                  {hoveredIndex === index && !active && (
                    <motion.div
                      layoutId="apex-nav-hover"
                      className="absolute inset-0 rounded-full bg-muted/50"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  {active && (
                    <motion.span
                      layoutId="apex-nav-active"
                      aria-hidden
                      className="absolute inset-0 rounded-full border border-primary/50 bg-primary/[0.12] shadow-[inset_0_1px_0_hsl(var(--primary)/0.25),0_0_18px_-6px_hsl(var(--primary)/0.7)]"
                      transition={{ type: "spring", stiffness: 500, damping: 34 }}
                    />
                  )}
                  <span
                    style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                    className="relative z-10 inline-flex items-center gap-1.5 uppercase tracking-[0.12em]"
                  >
                    {item.kicker && (
                      <span
                        aria-hidden
                        className={`font-mono text-[9.5px] tracking-[0.14em] ${
                          active ? "text-primary/80" : "text-muted-foreground/60"
                        }`}
                      >
                        {item.kicker}
                      </span>
                    )}
                    {item.label}
                  </span>

                </>
              );
              const cls = `relative rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors lg:px-3.5 lg:text-[11.5px] xl:px-4 xl:text-[12px] ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`;


              return isHash ? (
                <a
                  key={item.label}
                  href={item.href}
                  aria-current={active ? "true" : undefined}
                  className={cls}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={(e) => {
                    e.preventDefault();
                    onNav(item.label, item.href);
                    scrollToHash(item.href);
                  }}
                >
                  {inner}
                </a>
              ) : (
                <Link
                  key={item.label}
                  to={item.href}
                  className={cls}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => onNav(item.label, item.href)}
                >
                  {inner}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <Link
                to="/learn"
                onClick={() => onCta("Profile")}
                aria-label="Go to your dashboard"
                className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/30 px-2 py-1 pr-3 transition-colors hover:bg-muted/60"
              >
                <Avatar className="h-7 w-7">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Profile"} />
                  <AvatarFallback className="text-[10px] font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-[11px] font-semibold uppercase tracking-[0.12em] text-foreground/90">
                  Dashboard
                </span>
              </Link>
            ) : (
              <>
                <Button
                  asChild
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-[12px] font-semibold uppercase tracking-[0.1em] text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                >
                  <Link to="/login" onClick={() => onCta("Sign In")}>
                    Sign In
                  </Link>
                </Button>
                <Button
                  asChild
                  size="sm"
                  className="group relative overflow-hidden rounded-full bg-primary px-4 text-[12px] font-bold uppercase tracking-[0.12em] text-primary-foreground shadow-[0_0_28px_-6px_hsl(var(--primary)/0.8)] transition-all duration-300 hover:bg-primary/90 hover:shadow-[0_0_40px_-4px_hsl(var(--primary))] active:scale-[0.98]"
                >
                  <Link to="/signup" onClick={() => onCta("Get Started")}>
                    <span
                      aria-hidden
                      className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 ease-out group-hover:translate-x-full motion-reduce:hidden"
                    />
                    <span className="relative z-10 inline-flex items-center">
                      Get Started
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5 motion-reduce:transition-none" />
                    </span>
                  </Link>
                </Button>
              </>
            )}
          </div>



          <div className="flex items-center gap-2 lg:hidden">
            {user && (
              <Link
                to="/learn"
                onClick={() => onCta("Profile")}
                aria-label="Go to your dashboard"
                className="flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/30 px-1 py-0.5 pr-2 transition-colors hover:bg-muted/60"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "Profile"} />
                  <AvatarFallback className="text-[9px] font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/90">
                  Dashboard
                </span>
              </Link>
            )}
            <button
              className="p-2 text-muted-foreground hover:text-foreground"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="apex-mobile-menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <motion.div
            id="apex-mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute left-0 right-0 top-full mt-2 rounded-2xl border border-border/60 bg-card/95 p-4 backdrop-blur-md"
          >
            <div className="flex flex-col gap-2">
              {navItems.map((item) => {
                const active = isActive(item.href);
                const cls = `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold uppercase tracking-[0.1em] transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                }`;
                const label = (
                  <>
                    {item.kicker && (
                      <span
                        aria-hidden
                        className={`font-mono text-[10px] tracking-[0.14em] ${
                          active ? "text-primary/80" : "text-muted-foreground/60"
                        }`}
                      >
                        {item.kicker}
                      </span>
                    )}
                    <span>{item.label}</span>
                  </>
                );
                return item.href.startsWith("#") ? (
                  <a
                    key={item.label}
                    href={item.href}
                    aria-current={active ? "true" : undefined}
                    className={cls}
                    onClick={(e) => {
                      e.preventDefault();
                      setMobileMenuOpen(false);
                      setTimeout(() => scrollToHash(item.href), 60);
                    }}
                  >
                    {label}
                  </a>
                ) : (
                  <Link
                    key={item.label}
                    to={item.href}
                    className={cls}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {label}
                  </Link>
                );
              })}
              <hr className="my-2 border-border/60" />
              {user ? (
                <Button
                  asChild
                  className="apex-shimmer-btn rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Link to="/learn" onClick={() => setMobileMenuOpen(false)}>
                    Go to Dashboard
                  </Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    className="justify-start text-muted-foreground hover:text-foreground"
                  >
                    <Link to="/login" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="apex-shimmer-btn rounded-full bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </motion.header>
    </div>
  );
}
