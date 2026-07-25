import { Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeSync } from "@/hooks/useThemeSync";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import XPLevelBadge from "@/components/XPLevelBadge";
import { CompactPageHero } from "@/components/common/CompactPageHero";

const SettingsHeader = () => {
  const { user, profile, extendedProfile } = useAuth() as any;
  const { theme, setTheme } = useThemeSync();
  const navigate = useNavigate();
  const username = extendedProfile?.username ?? null;
  const profileHref = user ? (username ? `/u/${username}` : "/settings") : "/login";

  const getInitials = (name: string | null | undefined) => {
    if (!name) return user?.email?.charAt(0).toUpperCase() || "U";
    return name.split(" ").map((n) => n.charAt(0)).join("").toUpperCase().slice(0, 2);
  };

  return (
    <>
      {/* Slim top bar — same rhythm as ApexNavbar */}
      <header className="sticky top-0 z-40 border-b border-border/40 bg-background/70 backdrop-blur-xl">
        <div className="flex items-center justify-between h-14 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 min-w-0">
            <SidebarTrigger className="text-muted-foreground hover:text-foreground hover:bg-accent" />
            <span
              style={{ fontFamily: "'JetBrains Mono', ui-monospace, monospace" }}
              className="hidden sm:inline text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground truncate"
            >
              00 / My Account
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => navigate(profileHref)}
              aria-label="Open my profile"
              className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-full border border-border/60 bg-card/50 hover:border-primary/50 hover:bg-card/70 transition-colors focus-visible:outline-none focus-parikshaa"
            >
              <Avatar className="w-6 h-6 border border-primary/40">
                <AvatarImage src={profile?.avatar_url || undefined} />
                <AvatarFallback className="bg-muted text-[10px] font-semibold">
                  {getInitials(profile?.full_name)}
                </AvatarFallback>
              </Avatar>
              <span
                style={{ fontFamily: "'Space Grotesk', system-ui, sans-serif" }}
                className="text-xs font-semibold text-foreground/90 max-w-[140px] truncate"
              >
                {profile?.full_name || "User"}
              </span>
            </button>

            <div className="hidden sm:block">
              <XPLevelBadge compact />
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="text-muted-foreground hover:text-foreground hover:bg-accent"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </header>

      <CompactPageHero
        kicker="00"
        eyebrowLabel="My Account / Settings"
        title="Settings"
        subtext="Manage your profile, security, and preferences."
        headingId="settings-heading"
        as="h2"
      />



    </>
  );
};

export default SettingsHeader;
