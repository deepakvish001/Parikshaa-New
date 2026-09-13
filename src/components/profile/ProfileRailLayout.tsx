import { ReactNode } from "react";
import { GlobalLeftRail } from "@/components/GlobalLeftRail";

/**
 * Minimal left icon-rail layout used on the public profile page (/u/:username).
 * Mirrors the slim vertical rail in the takeuforward reference: brand mark,
 * Home + Plus + Profile shortcuts, and the signed-in avatar pinned at the bottom.
 */
export function ProfileRailLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <GlobalLeftRail />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
