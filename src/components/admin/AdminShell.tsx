import { NavLink, useLocation, Link, Outlet } from "react-router-dom";
import {
  Shield, FileCode2, Upload, ScrollText, LayoutGrid,
  Users, KeyRound, Sparkles, CalendarClock, Megaphone, Flag,
  Settings as SettingsIcon, Database, HeartPulse, Clock,
  ChevronDown, Star, Map as MapIcon, Inbox, ShieldAlert,
  Award, Trophy, Command as CommandIcon, ChevronRight, Pin,
  Bell, Brain, Code2, Newspaper, FileText, MessageCircle,
  GraduationCap, Building2, TrendingUp, BarChart3, Mail, History as HistoryIcon, Briefcase,,
  CloudCog,
} from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { AdminCommandPalette } from "./AdminCommandPalette";
import { AdminBackdrop } from "./AdminBackdrop";
import { useAdminSidebarPrefs } from "@/hooks/admin/useAdminSidebarPrefs";
import { useAdminBreadcrumb } from "@/hooks/admin/useAdminBreadcrumb";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarHeader,
  useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAdminSidebarBadges, BadgeDetail } from "@/hooks/admin/useAdminSidebarBadges";
import { BadgeKey } from "@/hooks/admin/useAdminBadgePrefs";
import { AdminBadgeSettings } from "./AdminBadgeSettings";
import { AdminUserDrawer } from "./AdminUserDrawer";
import { adminUserDrawer, useAdminUserDrawerStore } from "@/hooks/admin/useAdminUserDrawerStore";
import { useAdminRealtimeSync } from "@/hooks/admin/useAdminRealtimeSync";
import { Radio } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /**
   * When true, the item is only "active" for an exact pathname match.
   * When false/undefined, the item is also active for any pathname that
   * starts with `to + "/"`. This default keeps overlapping routes (e.g.
   * `/admin/contests` vs `/admin/contests/new`) correctly highlighted on
   * the parent item; pair with `end: true` on a child if you want the
   * parent to deactivate when a child is selected.
   */
  end?: boolean;
  /**
   * Optional custom predicate to override the default isActive logic.
   * Receives the current pathname and returns whether this item should be
   * highlighted. Useful for routes with dynamic segments.
   */
  match?: (pathname: string) => boolean;
  /**
   * Optional sub-navigation. Rendered indented beneath the parent only when
   * the parent (or any sub-item) is active. Sub-items follow the same
   * `end` / `match` rules as top-level items.
   */
  children?: NavItem[];
  /**
   * Stable test selector hook for Playwright assertions.
   */
  testId?: string;
}
interface NavGroup { label: string; items: NavItem[] }

const AdminShellContext = createContext(false);

function resolveDynamicChildren(item: NavItem, _pathname: string): NavItem[] {
  return item.children ?? [];
}

const GROUPS: NavGroup[] = [
  { label: "Overview", items: [
    { to: "/admin", label: "Dashboard", icon: LayoutGrid, end: true },
  ]},
  { label: "Content", items: [
    {
      to: "/admin/problems",
      label: "Coding Problems",
      icon: FileCode2,
      children: [
        { to: "/admin/problems", label: "All problems", icon: FileCode2, end: true },
        { to: "/admin/problems/new", label: "New problem", icon: Sparkles, end: true },
        { to: "/admin/problems/import", label: "Bulk Import", icon: Upload, end: true },
        { to: "/admin/problems/publish-history", label: "Publish History", icon: HistoryIcon, end: true },
      ],
    },
    {
      to: "/admin/blog",
      label: "Blog",
      icon: Newspaper,
      children: [
        { to: "/admin/blog", label: "All posts", icon: FileText, end: true },
        { to: "/admin/blog/new", label: "New post", icon: Sparkles, end: true },
        { to: "/admin/blog/comments", label: "Comments", icon: MessageCircle, end: true },
        { to: "/admin/blog/audit", label: "Audit log", icon: HistoryIcon, end: true },
      ],
    },
  ]},
  { label: "System", items: [
    { to: "/admin/mirror-health", label: "Mirror Health", icon: CloudCog },
  ]},
  { label: "People", items: [
    { to: "/admin/users", label: "Users", icon: Users },
  ]},
  { label: "Engagement", items: [
    { to: "/admin/support", label: "Support Inbox", icon: Inbox },
    { to: "/admin/leads", label: "Leads & Subscribers", icon: Mail },
    { to: "/admin/jobs", label: "Job Openings", icon: Briefcase },
    { to: "/admin/contests", label: "Contests", icon: Trophy },
  ]},
];


const TRACKED: BadgeKey[] = ["/admin/support"];


const Badge = ({ count, tone = "default" }: { count: number; tone?: "default" | "alert" }) => {
  if (!count) return null;
  return (
    <span
      className={cn(
        "ml-auto inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1.5 text-[11px] font-semibold leading-none",
        tone === "alert"
          ? "bg-destructive text-destructive-foreground"
          : "bg-primary/15 text-primary"
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
};

interface AdminSidebarProps {
  onOpenPalette: () => void;
}

const AdminSidebar = ({ onOpenPalette }: AdminSidebarProps) => {
  const { pathname } = useLocation();
  const { state, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  const { data: badges, isLoading: badgesLoading, markSeen, clearAll } = useAdminSidebarBadges();
  const prefs = useAdminSidebarPrefs(pathname);

  const isActive = (to: string, end?: boolean, match?: (p: string) => boolean) => {
    if (match) return match(pathname);
    return end ? pathname === to : pathname === to || pathname.startsWith(to + "/");
  };

  const flatItems = useMemo(() => GROUPS.flatMap((g) => g.items), []);
  const findItem = (to: string) => flatItems.find((i) => i.to === to);
  const pinnedItems = prefs.pinned.map(findItem).filter(Boolean) as NavItem[];

  const groupHasActive = (g: NavGroup) =>
    g.items.some((i) => isActive(i.to, i.end, i.match));

  // Auto-open active group + close mobile drawer
  useEffect(() => {
    for (const g of GROUPS) if (groupHasActive(g) && prefs.openGroups[g.label] === false) {
      prefs.setGroupOpen(g.label, true);
    }
    if (isMobile) setOpenMobile(false);
    const matched = TRACKED.find((t) => isActive(t));
    if (matched) markSeen(matched);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const groupBadgeCount = (g: NavGroup) =>
    g.items.reduce((acc, i) => {
      const det = badges?.[i.to as BadgeKey];
      return acc + (det?.unseen ?? 0);
    }, 0);

  const activeRef = useRef<HTMLAnchorElement | null>(null);
  useEffect(() => {
    const t = setTimeout(() => {
      activeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 80);
    return () => clearTimeout(t);
  }, [pathname]);

  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const toggleItemOpen = (to: string) =>
    setOpenItems((prev) => ({ ...prev, [to]: !(prev[to] ?? false) }));

  const renderItem = (item: NavItem, opts?: { compact?: boolean; pinnedRow?: boolean }) => {
    const Icon = item.icon;
    const active = isActive(item.to, item.end, item.match);
    const subItems = resolveDynamicChildren(item, pathname);
    const subActive = subItems.some((s) => isActive(s.to, s.end, s.match));
    const hasChildren = subItems.length > 0;
    // Auto-open when active/sub-active; otherwise honor user toggle (default closed)
    const userOpen = openItems[item.to];
    const expanded = userOpen ?? (active || subActive);
    const showSubNav = !collapsed && hasChildren && expanded && !opts?.pinnedRow;
    const detail: BadgeDetail | undefined = badges?.[item.to as BadgeKey];
    const tracked = (TRACKED as string[]).includes(item.to);
    const showSkeleton = tracked && badgesLoading && !detail;
    const unseen = detail?.unseen ?? 0;
    const tone: "default" | "alert" = "default" as "default" | "alert";

    const isPinned = prefs.isPinned(item.to);

    const linkEl = (
      <NavLink
        ref={active && !opts?.pinnedRow ? (activeRef as any) : undefined}
        to={item.to}
        end={item.end}
        data-testid={item.testId ?? `admin-nav-${item.to.replace(/^\/admin\/?/, "") || "dashboard"}`}
        className={cn(
          "group/item relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
          active
            ? "border border-primary/20 bg-primary/10 text-primary shadow-[0_0_15px_hsl(var(--primary)/0.10)] admin-nav-flash"
            : "border border-transparent text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
        )}
      >
        <span className="relative flex shrink-0 items-center">
          <Icon
            className={cn(
              "h-4 w-4 shrink-0 transition-transform duration-200",
              active ? "text-primary" : "text-muted-foreground/70 group-hover/item:scale-110"
            )}
          />
          {collapsed && unseen > 0 && (
            <span
              className={cn(
                "absolute -right-1.5 -top-1.5 h-2 w-2 rounded-full ring-2 ring-sidebar",
                tone === "alert" ? "bg-destructive" : "bg-primary"
              )}
            />
          )}
        </span>
        {!collapsed && (
          <>
            <span className="truncate text-[14px] tracking-tight">{item.label}</span>
            <span className="ml-auto flex items-center gap-1">
              {showSkeleton ? (
                <Skeleton className="h-4 w-6 rounded-full" />
              ) : (
                <Badge count={unseen} tone={tone} />
              )}
              {!opts?.pinnedRow && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    prefs.togglePin(item.to);
                  }}
                  className={cn(
                    "rounded p-0.5 opacity-0 transition-opacity hover:bg-muted-foreground/10 group-hover/item:opacity-100",
                    isPinned && "opacity-100"
                  )}
                  aria-label={isPinned ? "Unpin" : "Pin"}
                >
                  <Star
                    className={cn(
                      "h-3.5 w-3.5",
                      isPinned ? "fill-primary text-primary" : "text-muted-foreground"
                    )}
                  />
                </button>
              )}
              {hasChildren && !opts?.pinnedRow && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleItemOpen(item.to);
                  }}
                  className="rounded p-0.5 hover:bg-muted-foreground/10"
                  aria-label={expanded ? "Collapse" : "Expand"}
                  aria-expanded={expanded}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      expanded ? "rotate-0" : "-rotate-90"
                    )}
                  />
                </button>
              )}
            </span>
          </>
        )}
      </NavLink>
    );

    const button = (
      <SidebarMenuButton asChild isActive={active || subActive}>
        {linkEl}
      </SidebarMenuButton>
    );

    const wrapped = tracked && !opts?.pinnedRow ? (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          <div className="font-medium">{item.label}</div>
          {showSkeleton ? (
            <div className="text-muted-foreground"></div>
          ) : (
            <div className="text-muted-foreground">{detail?.hint}</div>
          )}
        </TooltipContent>
      </Tooltip>
    ) : collapsed ? (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right" className="text-xs">
          {item.label}
        </TooltipContent>
      </Tooltip>
    ) : (
      button
    );

    return (
      <SidebarMenuItem key={`${opts?.pinnedRow ? "pin-" : ""}${item.to}`}>
        {wrapped}

        {showSubNav && (
          <ul
            data-testid={`admin-subnav-${item.to.replace(/^\/admin\/?/, "")}`}
            className="mt-1 ml-7 flex flex-col gap-0.5 border-l border-border/40 pl-3"
          >
            {subItems.map((sub) => {
              const SubIcon = sub.icon;
              const subOn = isActive(sub.to, sub.end, sub.match);
              return (
                <li key={sub.to}>
                  <NavLink
                    to={sub.to}
                    end={sub.end}
                    data-testid={sub.testId}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                      subOn
                        ? "bg-primary/10 text-primary font-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <SubIcon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{sub.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        )}
      </SidebarMenuItem>
    );
  };

  return (
    <Sidebar
      collapsible="icon"
      className="border-r border-border bg-background"
    >
      <SidebarHeader className="h-16 border-b border-border px-3 py-0 flex flex-row items-center bg-background">
        <div className={cn("flex w-full items-center gap-3", collapsed && "justify-center")}>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded bg-gradient-to-br from-primary to-orange-600 font-bold text-primary-foreground">
            P
          </div>
          {!collapsed && (
            <>
              <span className="text-[15px] font-bold uppercase tracking-tight text-foreground">
                Parikshaa
              </span>
              <span className="ml-auto">
                <AdminBadgeSettings onMarkAllRead={clearAll} />
              </span>
            </>
          )}
        </div>
      </SidebarHeader>



      <TooltipProvider delayDuration={250}>
        <SidebarContent className="gap-0">
          {/* Pinned section */}
          {pinnedItems.length > 0 && (
            <SidebarGroup className="py-1">
              {!collapsed && (
                <SidebarGroupLabel className="flex h-7 items-center gap-2 px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground/70">
                  <Pin className="h-3.5 w-3.5" />
                  <span>Pinned</span>
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {pinnedItems.map((item) => renderItem(item, { pinnedRow: true }))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          {GROUPS.map((group) => {
            const hasActive = groupHasActive(group);
            const persistedOpen = prefs.openGroups[group.label];
            const open = collapsed ? true : (persistedOpen ?? true);
            const groupCount = groupBadgeCount(group);

            return (
              <Collapsible
                key={group.label}
                open={open}
                onOpenChange={(v) => prefs.setGroupOpen(group.label, v)}
              >
                <SidebarGroup className="py-1">
                  {!collapsed && (
                    <CollapsibleTrigger asChild>
                      <SidebarGroupLabel
                        className={cn(
                          "flex h-7 cursor-pointer items-center gap-2 rounded-md px-2.5 text-[10px] font-bold uppercase tracking-[0.14em] hover:bg-muted/40",
                          hasActive ? "text-primary" : "text-muted-foreground/70"
                        )}
                      >
                        <span>{group.label}</span>
                        {groupCount > 0 && <Badge count={groupCount} />}
                        <ChevronDown
                          className={cn(
                            "ml-auto h-4 w-4 transition-transform duration-200",
                            open ? "rotate-0" : "-rotate-90"
                          )}
                        />
                      </SidebarGroupLabel>
                    </CollapsibleTrigger>
                  )}

                  <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
                    <SidebarGroupContent>
                      <SidebarMenu>
                        {group.items.map((item) => renderItem(item))}
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
            );
          })}
        </SidebarContent>
      </TooltipProvider>
    </Sidebar>
  );
};

export const AdminShell = ({ children }: { children?: React.ReactNode }) => {
  const hasParentShell = useContext(AdminShellContext);

  if (hasParentShell) {
    return <>{children ?? <Outlet />}</>;
  }

  return <AdminShellRoot>{children}</AdminShellRoot>;
};

const AdminShellRoot = ({ children }: { children?: React.ReactNode }) => {
  const drawer = useAdminUserDrawerStore();
  useAdminRealtimeSync();
  const { pathname } = useLocation();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const prefs = useAdminSidebarPrefs(pathname);
  const crumbs = useAdminBreadcrumb(pathname, GROUPS);

  return (
    <AdminShellContext.Provider value={true}>
      <SidebarProvider>
        <a
          href="#admin-main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground focus:shadow-lg"
        >
          Skip to admin content
        </a>
        <div className="relative flex min-h-screen w-full bg-background">
          <AdminSidebar onOpenPalette={() => setPaletteOpen(true)} />
          <SidebarInset className="min-w-0 flex-1 bg-transparent">
            <div className="sticky top-0 z-20 flex h-14 items-center justify-between gap-2 border-b border-border bg-background px-2 sm:h-16 sm:px-6">

            <div className="flex min-w-0 items-center gap-3">
              <SidebarTrigger />
              <span aria-hidden className="hidden h-5 w-px bg-border sm:block" />
              <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                {crumbs.map((c, i) => (
                  <span key={`${c.label}-${i}`} className="flex min-w-0 items-center gap-1">
                    {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />}
                    {c.to && i < crumbs.length - 1 ? (
                      <Link to={c.to} className="truncate hover:text-foreground">
                        {c.label}
                      </Link>
                    ) : (
                      <span className={cn("truncate", i === crumbs.length - 1 && "font-medium text-foreground")}>
                        {c.label}
                      </span>
                    )}
                  </span>
                ))}
              </nav>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPaletteOpen(true)}
                className="group hidden h-8 w-64 items-center gap-2 rounded-full border border-border bg-secondary/60 pl-3 pr-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 focus-visible:border-primary/50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40 md:inline-flex"
              >
                <svg className="h-3.5 w-3.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <span className="flex-1 truncate">Jump to anywhere…</span>
                <kbd className="rounded border border-border/60 bg-background/60 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">⌘K</kbd>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPaletteOpen(true)}
                aria-label="Open command palette"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-secondary/60 p-0 text-muted-foreground hover:border-primary/40 hover:text-foreground md:hidden"
              >
                <CommandIcon className="h-3.5 w-3.5" />
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-500">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60 motion-reduce:hidden" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      </span>
                      <span className="hidden sm:inline">Live</span>
                      <Radio className="h-3 w-3 sm:hidden" aria-hidden />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    Realtime admin sync is active
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
            <main
              id="admin-main"
              aria-label="Admin content"
              aria-live="polite"
              aria-atomic="false"
              className="relative min-w-0 flex-1 px-3 py-4 sm:px-6 sm:py-6 lg:px-8"
            >
              <AdminBackdrop />
              <div
                key={pathname}
                className="admin-surface relative animate-in fade-in slide-in-from-bottom-3 duration-500 motion-reduce:animate-none motion-reduce:transform-none"
              >
                {children ?? <Outlet />}
              </div>
            </main>
          </SidebarInset>
        </div>
        <AdminCommandPalette
          open={paletteOpen}
          onOpenChange={setPaletteOpen}
          groups={GROUPS}
          pinned={prefs.pinned}
          recent={prefs.recent}
        />
        <AdminUserDrawer
          userId={drawer.userId}
          open={drawer.open}
          onOpenChange={(v) => adminUserDrawer.setOpen(v)}
        />
      </SidebarProvider>
    </AdminShellContext.Provider>
  );
};
