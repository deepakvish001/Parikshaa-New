import { Navigate } from "react-router-dom";

/**
 * Legacy alias: /jobs/internships is now the canonical URL and is served
 * by the JobsOrDetailDispatcher in App.tsx. This file is kept as a safety
 * redirect for any lingering imports/links; it just bounces to the same URL.
 */
export default function JobsInternships() {
  return <Navigate to="/jobs/internships" replace />;
}
