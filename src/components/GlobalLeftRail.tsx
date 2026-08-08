import { Link, useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Home as HomeIcon,
  User as UserIcon,
  Settings,
  Sun,
  Moon,
  Bell,
  LogOut,
  Calendar,
  ChevronRight as ChevronRightIcon,
  BookOpen,
  FileSpreadsheet,
  Brain,
  Trophy,
  Award,
  LibraryBig,
  Swords,
  LayoutDashboard,
  Briefcase,
  Map as MapIcon,
  Timer,
  Sparkles,
  Eye,
} from "lucide-react";


import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeSync } from "@/hooks/useThemeSync";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import parikshaaLogo from "@/assets/brand/logo-transparent.png";

function MenuLink({
  icon: Icon,
  label,
  onClick,
  locked,
  badge,
  trailing,
}: {
  icon: any;
  label: string;
  onClick?: () => void;
  locked?: boolean;
  badge?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
        locked
          ? "text-muted-foreground/70 hover:bg-muted/30"
          : "text-foreground/90 hover:bg-muted/40",
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="flex-1 text-left">{label}</span>
      {badge && (
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/15 text-primary">
          {badge}
        </span>
      )}
      {locked && <span className="text-muted-foreground">🔒</span>}
      {trailing}
    </button>
  );
}

export function GlobalLeftRail() {
  const { user, profile, extendedProfile, signOut } = useAuth() as any;
  const username = extendedProfile?.username ?? null;
  const profileHref = user ? (username ? `/u/${username}` : "/profile") : "/login";
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { resolvedTheme, setTheme } = useThemeSync();
  const isDark = resolvedTheme !== "light";

  const initials =
    (profile?.full_name || user?.email || "U")
      .toString()
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase())
      .join("") || "U";

  // Contextual second rail item based on current section
  const contextItem = (() => {
    const sheetMatch = pathname.match(/^\/learn\/sheets\/([^/]+)/);
    if (sheetMatch) return { icon: BookOpen, label: "Sheet", to: pathname };
    if (pathname.startsWith("/learn/sheets")) return { icon: FileSpreadsheet, label: "Sheets", to: "/learn/sheets" };
    if (pathname.startsWith("/learn/dsa-studio") || pathname.startsWith("/learn/dsa-tracker")) return { icon: Brain, label: "DSA", to: "/learn/dsa-studio" };
    if (pathname.startsWith("/learn/leaderboard")) return { icon: Trophy, label: "Leaders", to: "/learn/leaderboard" };
    if (pathname.startsWith("/learn/achievements")) return { icon: Award, label: "Awards", to: "/learn/achievements" };
    if (pathname.startsWith("/library")) return { icon: LibraryBig, label: "Library", to: "/library" };
    if (pathname.startsWith("/contests")) return { icon: Swords, label: "Contests", to: "/contests" };
    if (pathname.startsWith("/dashboard")) return { icon: LayoutDashboard, label: "Dashboard", to: "/dashboard" };
    return null;
  })();

  const railItems = [
    { icon: HomeIcon, label: "Home", to: "/learn", active: pathname === "/learn" },
    { icon: Swords, label: "Contest", to: "/contests", active: pathname.startsWith("/contests") },
    
    { icon: Briefcase, label: "Jobs", to: "/jobs", active: pathname.startsWith("/jobs") },
    { icon: Eye, label: "Visualize", to: "/learn/visualize", active: pathname.startsWith("/learn/visualize") },
    { icon: MapIcon, label: "Roadmap", to: "/roadmaps", active: pathname.startsWith("/roadmaps") },
    { icon: Bell, label: "Notifier", to: "/contest-notifier", active: pathname.startsWith("/contest-notifier") },
  ];

  const handleHomeNavigation = () => {
    localStorage.removeItem("lastVisitedRoute");
  };


  const handleSignOut = async () => {
    try {
      await signOut?.();
      toast.success("Signed out");
      navigate("/");
    } catch {
      toast.error("Could not sign out");
    }
  };

  const lockedToast = (label: string) => toast.info(`${label} — coming soon`);

  return (
    <aside className="hidden md:flex shrink-0 w-16 h-svh sticky top-0 flex-col items-center justify-between py-4 border-r border-border/50 bg-background z-30">
      <div className="flex flex-col items-center gap-4 w-full">
        <Link
          to="/"
          aria-label="Parikshaa home"
          className="h-10 w-10 rounded-xl bg-card/50 border border-border/60 flex items-center justify-center overflow-hidden"
        >
          <img src={parikshaaLogo} alt="Parikshaa" className="h-7 w-7 object-contain" />
        </Link>

        <div className="flex flex-col items-center gap-2 w-full px-2">
          {railItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.to}
                onClick={item.to === "/learn" ? handleHomeNavigation : undefined}
                className={cn(
                  "group w-full flex flex-col items-center gap-1 rounded-xl py-2 transition-colors",
                  item.active
                    ? "bg-primary/10 text-primary border border-primary/25"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40 border border-transparent",
                )}
              >
                <Icon className="h-5 w-5" strokeWidth={1.75} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-full px-2">



        <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Profile menu"
            className="relative h-10 w-10 rounded-full ring-2 ring-border/60 hover:ring-primary/50 transition"
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
              <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
            </Avatar>
            {user && (
              <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-background" />
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent side="right" align="end" className="w-72 p-0 border-border/60 bg-card/95 backdrop-blur-xl">
          {user ? (
            <div className="flex items-center gap-3 p-3 border-b border-border/60">
              <Avatar className="h-10 w-10">
                <AvatarImage src={profile?.avatar_url || undefined} alt={profile?.full_name || "User"} />
                <AvatarFallback className="bg-muted text-xs">{initials}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-semibold truncate">{profile?.full_name || "User"}</div>
                <div className="text-xs text-muted-foreground truncate">{user.email}</div>
              </div>
            </div>
          ) : (
            <div className="p-3 border-b border-border/60">
              <Link
                to="/login"
                className="block w-full text-center text-sm font-medium rounded-lg border border-primary/40 bg-primary/10 text-primary px-3 py-2 hover:bg-primary/20 transition-colors"
              >
                Sign in
              </Link>
            </div>
          )}

          <div className="p-1.5">
            <MenuLink icon={UserIcon} label="My Profile" onClick={() => navigate(profileHref)} />
            <MenuLink icon={Settings} label="Account" onClick={() => navigate(user ? "/settings" : "/login")} />
            <MenuLink icon={Calendar} label="Sessions" locked onClick={() => lockedToast("Sessions")} />

            <MenuLink
              icon={isDark ? Sun : Moon}
              label={isDark ? "Light Mode" : "Dark Mode"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
            />
            <MenuLink
              icon={Bell}
              label="Notification"
              trailing={<ChevronRightIcon className="h-4 w-4 text-muted-foreground" />}
              onClick={() => navigate(user ? "/notifications" : "/login")}
            />
          </div>

          {user && (
            <div className="border-t border-border/60 p-1.5">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button
                    type="button"
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Sign out of Parikshaa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      You'll need to sign in again to track your progress, streaks, and continue learning.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleSignOut}
                      className="bg-rose-500 text-white hover:bg-rose-600"
                    >
                      Logout
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </PopoverContent>
      </Popover>
      </div>
    </aside>
  );
}

export default GlobalLeftRail;
