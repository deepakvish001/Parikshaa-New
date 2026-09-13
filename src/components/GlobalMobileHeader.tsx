import { Link, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";

import { GLOBAL_NAV_ITEMS } from "@/components/GlobalLeftRail";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import parikshaaLogo from "@/assets/brand/logo-transparent.png";

export function GlobalMobileHeader() {
  const { pathname } = useLocation();
  const { user, profile } = useAuth() as any;
  const active = GLOBAL_NAV_ITEMS.find((item) => item.matches(pathname));
  const initials = (profile?.full_name || user?.email || "U").toString().slice(0, 2).toUpperCase();

  return (
    <header className="fixed inset-x-0 top-0 z-[60] flex h-14 items-center justify-between border-b border-border/60 bg-background/95 px-3 backdrop-blur-xl md:hidden">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Open navigation">
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="top-14 z-50 h-[calc(100dvh-3.5rem)] w-[min(19rem,86vw)] border-border/60 p-3 [&+div]:top-14">
          <SheetHeader className="px-2 pb-3 text-left">
            <SheetTitle className="flex items-center gap-2">
              <img src={parikshaaLogo} alt="" className="h-8 w-8 object-contain" />
              Parikshaa
            </SheetTitle>
          </SheetHeader>
          <nav aria-label="Main navigation" className="space-y-1">
            {GLOBAL_NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <SheetClose asChild key={item.label}>
                  <Link
                    to={item.to}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border px-3 py-3 text-sm font-medium transition-colors",
                      item.matches(pathname)
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </SheetClose>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>

      <Link to={active?.to ?? "/learn"} className="flex items-center gap-2 text-sm font-semibold">
        <img src={parikshaaLogo} alt="Parikshaa" className="h-7 w-7 object-contain" />
        <span>{active?.label ?? "Parikshaa"}</span>
      </Link>

      <Link to={user ? "/profile" : "/login"} aria-label={user ? "Open profile" : "Sign in"}>
        <Avatar className="h-8 w-8 border border-border/60">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px]">{initials}</AvatarFallback>
        </Avatar>
      </Link>
    </header>
  );
}