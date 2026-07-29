import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { logActivityOnce } from "@/lib/activity/log";

/**
 * Logs a page_view activity for each distinct route the signed-in user visits.
 * De-duplicated per browser session so navigation loops don't spam the log.
 */
export function ActivityTracker() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const path = location.pathname;
    logActivityOnce(`page:${path}`, "page_view", "Visited page", path, {
      path,
      search: location.search || undefined,
      referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
    });
  }, [user, location.pathname, location.search]);

  return null;
}

export default ActivityTracker;
