import { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, User as UserIcon, Briefcase, Swords, Eye, Map as MapIcon, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ProfileMenuContent } from "@/components/profile/ProfileMenuContent";
import logoLight from "@/assets/brand/logo-transparent.png";
import { cn } from "@/lib/utils";

/**
 * Minimal left icon-rail layout used on the public profile page (/u/:username).
 * Mirrors the slim vertical rail in the takeuforward reference: brand mark,
 * Home + Plus + Profile shortcuts, and the signed-in avatar pinned at the bottom.
 */
export function ProfileRailLayout({ children }: { children: ReactNode }) {
  const { user, profile, extendedProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const username = (extendedProfile as { username?: string } | null)?.username ?? null;
  const profileHref = username ? `/u/${username}` : user ? "/settings" : "/login";
  const isProfileActive = location.pathname.startsWith("/u/");

  const initials =
    profile?.full_name
      ?.split(" ")
      .map((p) => p[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U";

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Fixed left rail */}
      <aside
        className="fixed left-0 top-0 z-40 hidden h-screen w-[68px] flex-col items-center justify-between border-r border-border/40 bg-card/40 py-4 backdrop-blur-xl md:flex"
        aria-label="Profile navigation"
      >
        {/* Top: brand + primary nav */}
        <div className="flex flex-col items-center gap-2">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl ring-1 ring-border/50 hover:ring-primary/60 transition"
            aria-label="Parikshaa home"
          >
            <img src={logoLight} alt="Parikshaa logo" className="h-6 w-6 object-contain" />
          </Link>
          <div className="my-1 h-px w-8 bg-border/60" />

          <RailItem
            icon={<Home className="h-[18px] w-[18px]" />}
            label="Home"
            active={location.pathname === "/learn" || location.pathname === "/dashboard"}
            onClick={() => navigate("/learn")}
          />
          <RailItem
            icon={<Swords className="h-[18px] w-[18px]" />}
            label="Contest"
            active={location.pathname.startsWith("/contests")}
            onClick={() => navigate("/contests")}
          />
          <RailItem
            icon={<Briefcase className="h-[18px] w-[18px]" />}
            label="Jobs"
            active={location.pathname.startsWith("/jobs")}
            onClick={() => navigate("/jobs")}
          />
          <RailItem
            icon={<Eye className="h-[18px] w-[18px]" />}
            label="Visualize"
            active={location.pathname.startsWith("/learn/visualize")}
            onClick={() => navigate("/learn/visualize")}
          />
          <RailItem
            icon={<MapIcon className="h-[18px] w-[18px]" />}
            label="Roadmap"
            active={location.pathname.startsWith("/roadmaps")}
            onClick={() => navigate("/roadmaps")}
          />
          <RailItem
            icon={<Bell className="h-[18px] w-[18px]" />}
            label="Notifier"
            active={location.pathname.startsWith("/contest-notifier")}
            onClick={() => navigate("/contest-notifier")}
          />
          <RailItem
            icon={<UserIcon className="h-[18px] w-[18px]" />}
            label="Profile"
            active={isProfileActive}
            onClick={() => navigate(profileHref)}
          />
        </div>

        {/* Bottom: signed-in avatar */}
        <div className="flex flex-col items-center gap-2">
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted ring-1 ring-border/60 hover:ring-primary/60 transition"
                  aria-label="Profile menu"
                >
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xs font-semibold">{initials}</span>
                  )}
                  <span className="absolute right-0 top-0 h-2 w-2 rounded-full bg-destructive ring-2 ring-card" />
                </button>
              </PopoverTrigger>
              <PopoverContent side="right" align="end" className="w-72 p-0 border-border/60 bg-card/95 backdrop-blur-xl">
                <ProfileMenuContent />
              </PopoverContent>
            </Popover>
          ) : (
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border/60 hover:ring-primary/60 transition"
              aria-label="Sign in"
            >
              <UserIcon className="h-[18px] w-[18px]" />
            </button>
          )}
        </div>
      </aside>

      {/* Page body — leaves space for the rail on md+ */}
      <main className="md:pl-[68px]">{children}</main>
    </div>
  );
}

function RailItem({
  icon,
  label,
  active,
  onClick,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex w-[52px] flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition",
        active
          ? "bg-primary/10 text-primary ring-1 ring-primary/40"
          : "text-muted-foreground hover:bg-muted/40 hover:text-foreground",
      )}
    >
      {icon}
      <span className="text-[10px] font-medium leading-none">{label}</span>
    </button>
  );
}
