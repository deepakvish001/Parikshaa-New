import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireOnboarding?: boolean;
  allowSkipOnboarding?: boolean;
}

const ProtectedRoute = ({ 
  children, 
  requireOnboarding = false,
  allowSkipOnboarding = false 
}: ProtectedRouteProps) => {
  const { user, loading, onboardingCompleted, prepHubOnboardingCompleted } = useAuth();
  const location = useLocation();

  if (loading) {
    return null;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If route requires onboarding and user hasn't completed it
  // Redirect to onboarding unless coming from onboarding page (to allow skip)
  if (requireOnboarding && !onboardingCompleted && !allowSkipOnboarding) {
    const skippedOnboarding = sessionStorage.getItem("skippedOnboarding");
    if (!skippedOnboarding) {
      return <Navigate to="/onboarding" replace />;
    }
  }

  // Prep Hub specific onboarding
  if (location.pathname.startsWith('/prephub') && location.pathname !== '/prephub/onboarding' && !prepHubOnboardingCompleted) {
    return <Navigate to="/prephub/onboarding" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
