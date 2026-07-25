import { useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import {
  ProgressRing,
  CalendarRoadmap,
  DailyPlanner,
} from "@/components/learn/RightRailWidgets";
import { TooltipProvider } from "@/components/ui/tooltip";
import { HeroAmbientLayers } from "@/components/landing/HeroAmbientLayers";
import { trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

const RAIL_HIDDEN_KEY = "parikshaa.rightRail.hidden";
const RAIL_ID = "global-right-rail-panel";

/**
 * GlobalRightRail
 *
 * Sitewide right-hand panel with a fixed edge toggle that keeps
 * its position across open/close states, animates smoothly, and
 * emits analytics events.
 */
export function GlobalRightRail() {
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState<boolean>(() => {
    try { return localStorage.getItem(RAIL_HIDDEN_KEY) === "1"; } catch { return false; }
  });
  const [plannerExpanded, setPlannerExpanded] = useState(false);

  const blocked = useMemo(() => {
    const blocklist = [
      /^\/learn(\/|$)/,
      /^\/contests\/.+\/play/,
      /^\/library\/problems\/[^/]+$/,
      /^\/mock-interview\/.+\/session/,
    ];
    return blocklist.some((re) => re.test(pathname));
  }, [pathname]);

  if (blocked) return null;

  const toggle = () => {
    const next = !hidden;
    setHidden(next);
    try { localStorage.setItem(RAIL_HIDDEN_KEY, next ? "1" : "0"); } catch { /* noop */ }
    trackEvent(next ? "right_rail_close" : "right_rail_open", {
      source: "toggle_button",
      pathname,
    });
  };

  const isOpen = !hidden;

  return (
    <TooltipProvider>
      {/* Fixed edge toggle — same position in both states, no layout shift */}
      <button
        type="button"
        onClick={toggle}
        aria-label={isOpen ? "Hide side panel" : "Show side panel"}
        aria-expanded={isOpen}
        aria-controls={RAIL_ID}
        title={isOpen ? "Hide side panel" : "Show side panel"}
        className={cn(
          "group hidden xl:flex fixed top-20 z-50",
          "h-12 w-9 items-center justify-center",
          "rounded-l-xl border border-r-0 border-amber-500/40",
          "bg-gradient-to-b from-amber-500/25 to-orange-500/25 backdrop-blur-md",
          "text-amber-500 shadow-lg shadow-amber-500/20",
          "hover:from-amber-500/40 hover:to-orange-500/40 hover:shadow-amber-500/40",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "transition-[right,background,box-shadow] duration-300 ease-out",
          isOpen ? "right-[340px]" : "right-0",
        )}
        style={{ willChange: "right" }}
      >
        {isOpen ? (
          <PanelRightClose className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden="true" />
        ) : (
          <PanelRightOpen className="h-5 w-5 transition-transform duration-200 group-hover:-translate-x-0.5" aria-hidden="true" />
        )}
        <span className="sr-only">{isOpen ? "Hide side panel" : "Show side panel"}</span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute right-full mr-2 whitespace-nowrap rounded-md border border-amber-500/30 bg-card/95 px-2 py-1 text-[11px] font-medium text-foreground opacity-0 shadow-md transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          {isOpen ? "Hide panel" : "Open panel"}
        </span>
      </button>

      {/* Panel — width animates for smooth slide without layout shift */}
      <aside
        id={RAIL_ID}
        aria-label="Quick panel"
        aria-hidden={!isOpen}
        className={cn(
          "relative isolate hidden xl:flex flex-col shrink-0 border-l border-border/40",
          "learn-dark-surface bg-background text-foreground font-apex-sans antialiased backdrop-blur-xl",
          "sticky top-0 min-h-screen h-screen overflow-hidden",
          "transition-[width] duration-300 ease-out",
          isOpen ? "w-[340px]" : "w-0 border-l-0",
        )}
        style={{ willChange: "width" }}
      >
        <div
          className={cn(
            "w-[340px] h-full flex flex-col transition-opacity duration-200",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        >
          <HeroAmbientLayers variant="rail" />
          <div className="relative z-10 flex flex-col gap-3 flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
            <div className="flex items-center px-1">
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
                Your Day
              </span>
            </div>

            {plannerExpanded ? (
              <div className="flex-1 min-h-0">
                <DailyPlanner
                  expanded
                  onExpand={() => setPlannerExpanded(true)}
                  onCollapse={() => setPlannerExpanded(false)}
                />
              </div>
            ) : (
              <>
                <ProgressRing />
                <CalendarRoadmap />
                <DailyPlanner
                  expanded={false}
                  onExpand={() => setPlannerExpanded(true)}
                  onCollapse={() => setPlannerExpanded(false)}
                />
              </>
            )}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}

export default GlobalRightRail;
