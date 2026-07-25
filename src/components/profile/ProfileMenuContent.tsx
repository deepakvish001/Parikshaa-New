import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import {
  User as UserIcon,
  Settings,
  Sun,
  Moon,
  Bell,
  LogOut,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";


import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { useThemeSync } from "@/hooks/useThemeSync";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

/**
 * Shared body for the "profile menu" popover used by the global left rail
 * and the profile-page rail (/u/:username). Assumes it is rendered inside a
 * <PopoverContent> so it can be dropped in unchanged.
 */
export function ProfileMenuContent() {
  const { user, profile, extendedProfile, signOut } = useAuth() as any;
  const navigate = useNavigate();
  const { resolvedTheme, setTheme } = useThemeSync();
  const isDark = resolvedTheme !== "light";

  const username = extendedProfile?.username ?? null;
  const profileHref = user ? (username ? `/u/${username}` : "/settings") : "/login";

  const initials =
    (profile?.full_name || user?.email || "U")
      .toString()
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((s: string) => s[0]?.toUpperCase())
      .join("") || "U";

  

  const handleSignOut = async () => {
    try {
      await signOut?.();
      toast.success("Signed out");
      navigate("/");
    } catch {
      toast.error("Could not sign out");
    }
  };

  return (
    <>
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
    </>
  );
}

export default ProfileMenuContent;
