import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, LogIn, UserPlus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";

export type SignInGateAction = "notes" | "discussion" | "run" | "submit";

interface ActionCopy {
  title: string;
  description: string;
  signInLabel: string;
  createLabel: string;
  attemptedAction: string;
}

const ACTION_COPY: Record<SignInGateAction, ActionCopy> = {
  notes: {
    title: "Sign in to write Notes",
    description:
      "Save personal notes for this problem and sync them across your devices.",
    signInLabel: "Sign in to write notes",
    createLabel: "Create account to write notes",
    attemptedAction: "write notes on this problem",
  },
  discussion: {
    title: "Sign in to join the Discussion",
    description:
      "Post comments, reply to threads, and like helpful answers from the community.",
    signInLabel: "Sign in to comment",
    createLabel: "Create account to comment",
    attemptedAction: "post in the discussion",
  },
  run: {
    title: "Sign in to Run your code",
    description:
      "Execute your solution against the sample tests and see real output.",
    signInLabel: "Sign in to run code",
    createLabel: "Create account to run code",
    attemptedAction: "run your code",
  },
  submit: {
    title: "Sign in to Submit your solution",
    description:
      "Submit against all test cases, track your progress, and earn XP.",
    signInLabel: "Sign in to submit",
    createLabel: "Create account to submit",
    attemptedAction: "submit your solution",
  },
};

interface Props {
  /** Preset action; drives the title, description, button labels and attempted-action copy. */
  action?: SignInGateAction;
  /** Back-compat: free-form feature name (e.g. "Notes"). Ignored if `action` is provided. */
  feature?: string;
  /** Optional override for the description line. */
  description?: string;
}

/**
 * Blocks guest access to authenticated-only problem features with clear,
 * action-specific copy and CTAs to sign in or create an account.
 */
export const SignInGate = ({ action, feature, description }: Props) => {
  const navigate = useNavigate();
  const location = useLocation();
  const intended = location.pathname + location.search + location.hash;

  const resolved: ActionCopy = action
    ? ACTION_COPY[action]
    : {
        title: `Sign in to use ${feature ?? "this feature"}`,
        description:
          description ??
          `Create a free account to unlock ${feature ?? "this feature"} and sync across devices.`,
        signInLabel: "Sign In",
        createLabel: "Create Account",
        attemptedAction: `use ${feature ?? "this feature"}`,
      };

  const copy: ActionCopy = {
    ...resolved,
    description: description ?? resolved.description,
  };

  const go = (target: "/login" | "/signup") => {
    try {
      localStorage.setItem(
        "pendingAuthAction",
        JSON.stringify({
          path: intended,
          action: copy.attemptedAction,
          actionKey: action ?? null,
          ts: Date.now(),
        }),
      );
    } catch {
      /* ignore */
    }
    navigate(target, { state: { from: { pathname: intended } } });
  };

  return (
    <Card
      data-testid="sign-in-gate"
      data-action={action ?? "generic"}
      role="region"
      aria-label={copy.title}
      className="p-8 text-center flex flex-col items-center gap-4 max-w-md mx-auto mt-6"
    >
      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
        <Lock className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold">{copy.title}</h3>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button onClick={() => go("/login")} className="gap-2" aria-label={copy.signInLabel}>
          <LogIn className="h-4 w-4" /> Sign In
        </Button>
        <Button
          variant="outline"
          onClick={() => go("/signup")}
          className="gap-2"
          aria-label={copy.createLabel}
        >
          <UserPlus className="h-4 w-4" /> Create Account
        </Button>
      </div>
    </Card>
  );
};
