import { ReactNode } from "react";
import { useLocation } from "react-router-dom";

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { GlobalLeftRail } from "@/components/GlobalLeftRail";
import { GlobalRightRail } from "@/components/GlobalRightRail";
import StreakReminderProvider from "@/components/StreakReminderProvider";
import { useRoutePersistence } from "@/hooks/useRoutePeristence";
import { GuestSignupBanner } from "@/components/GuestSignupBanner";
import { DelayedLoginPrompt } from "@/components/DelayedLoginPrompt";
import { GuestWelcomeTour } from "@/components/GuestWelcomeTour";
import { cn } from "@/lib/utils";


interface DashboardLayoutProps {
  children: ReactNode;
}

function RoutePersistenceHandler() {
  useRoutePersistence();
  return null;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  // LearnHub (/learn and /learn/sheets/:id) renders its own rail outside this layout,
  // so we always show the global rail here for every other dashboard page.
  const { pathname } = useLocation();
  const isLearnRoute = pathname.startsWith("/learn");
  const isHeroRoute = isLearnRoute || pathname.startsWith("/settings");


  return (
    <SidebarProvider className={cn(isHeroRoute && "bg-transparent")}>
      <StreakReminderProvider>
        <RoutePersistenceHandler />
        <GlobalLeftRail />
        <SidebarInset className={cn(isHeroRoute && "bg-transparent")}>
          <GuestSignupBanner />
          <DelayedLoginPrompt />
          <GuestWelcomeTour />
          
          {children}
        </SidebarInset>
        <GlobalRightRail />
      </StreakReminderProvider>
    </SidebarProvider>
  );
}
