import { ReactNode } from "react";
import { AlertTriangle, Inbox, Loader2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Shared flat sales-ops states for admin pages. All three share a
 * common shell so tables / lists / cards get consistent framing
 * across the admin panel — amber accent inherited from home theme.
 */
interface StateShellProps {
  icon?: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "primary" | "danger";
  className?: string;
}

const toneMap = {
  default: "border-border bg-secondary text-muted-foreground",
  primary: "border-primary/30 bg-primary/10 text-primary",
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
} as const;

const StateShell = ({
  icon: Icon,
  title,
  description,
  action,
  tone = "default",
  className,
}: StateShellProps) => (
  <div
    role="status"
    className={cn(
      "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/40 px-6 py-12 text-center",
      className,
    )}
  >
    {Icon && (
      <span
        className={cn(
          "mb-3 grid h-11 w-11 place-items-center rounded-lg border",
          toneMap[tone],
        )}
      >
        <Icon className="h-5 w-5" />
      </span>
    )}
    <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    {description && (
      <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
        {description}
      </p>
    )}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const AdminEmpty = ({
  icon = Inbox,
  title = "Nothing here yet",
  description,
  action,
  className,
}: Partial<StateShellProps>) => (
  <StateShell
    icon={icon}
    title={title}
    description={description}
    action={action}
    className={className}
  />
);

export const AdminLoading = ({
  title = "Loading",
  description = "Fetching the latest data…",
  rows = 4,
  className,
}: {
  title?: string;
  description?: string;
  rows?: number;
  className?: string;
}) => (
  <div className={cn("rounded-xl border border-border bg-card p-5", className)}>
    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-muted-foreground">
      <Loader2 className="h-4 w-4 animate-spin text-primary motion-reduce:animate-none" />
      <span>{title}</span>
      <span className="text-xs text-muted-foreground/70">— {description}</span>
    </div>
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full rounded-md" />
      ))}
    </div>
  </div>
);

export const AdminError = ({
  title = "Something went wrong",
  description = "The request failed. Please retry — if it keeps failing, check the console.",
  onRetry,
  className,
}: {
  title?: string;
  description?: ReactNode;
  onRetry?: () => void;
  className?: string;
}) => (
  <StateShell
    icon={AlertTriangle}
    tone="danger"
    title={title}
    description={description}
    className={className}
    action={
      onRetry ? (
        <Button size="sm" variant="outline" onClick={onRetry}>
          Retry
        </Button>
      ) : undefined
    }
  />
);
