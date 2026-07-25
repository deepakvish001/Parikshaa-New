import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Unified page wrapper extracted from /learn (LearnHub) and /u/:username (ProfileShell).
 * Standardises background, max-width, and dynamic padding across the app.
 */
export function PageShell({
  children,
  className,
  width = "wide",
}: {
  children: ReactNode;
  className?: string;
  /** narrow=4xl (forms/settings), default=6xl, wide=1400px (dashboards/profile) */
  width?: "narrow" | "default" | "wide";
}) {
  const widthCls =
    width === "narrow"
      ? "max-w-4xl"
      : width === "default"
      ? "max-w-6xl"
      : "max-w-[1400px]";

  return (
    <div className="min-h-screen bg-background">
      <main
        className={cn(
          "mx-auto px-3 sm:px-5 lg:px-8 py-4 sm:py-6",
          widthCls,
          className,
        )}
      >
        {children}
      </main>
    </div>
  );
}

export default PageShell;
