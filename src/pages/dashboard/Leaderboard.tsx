import { Link, useLocation } from "react-router-dom";
import { Trophy, LogIn, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { PageShell, PageHeader } from "@/components/shell";

export default function Leaderboard() {
  const { user } = useAuth();
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  const fromState = { from: { pathname: returnTo.split("?")[0], search: returnTo.includes("?") ? `?${returnTo.split("?")[1]}` : "" } };

  return (
    <PageShell width="default" className="space-y-6 sm:py-10">
      <PageHeader
        eyebrow="Rankings"
        eyebrowIcon={Trophy}
        title="Leaderboard"
        description="Global rankings across the platform."
      />

      <Card className="p-10 text-center space-y-3 max-w-xl mx-auto">
        {!user ? (
          <>
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mx-auto">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Sign in to view rankings</h2>
            <p className="text-sm text-muted-foreground">
              The platform leaderboard is available once you're signed in.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-2 pt-2">
              <Button asChild>
                <Link to="/login" state={fromState}>
                  <LogIn className="h-4 w-4 mr-1.5" />
                  Sign in
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/signup" state={fromState}>Create account</Link>
              </Button>
            </div>
          </>
        ) : (
          <>
            <Trophy className="h-10 w-10 mx-auto text-primary" />
            <h2 className="text-lg font-semibold">Leaderboard coming soon</h2>
            <p className="text-sm text-muted-foreground">
              We're rebuilding rankings for the streamlined Learn experience.
            </p>
          </>
        )}
      </Card>
    </PageShell>
  );
}
