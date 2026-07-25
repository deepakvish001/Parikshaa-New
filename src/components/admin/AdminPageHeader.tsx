import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AdminPageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  chips?: { label: string; tone?: "default" | "primary" | "success" | "danger" }[];
  actions?: ReactNode;
  className?: string;
}

const toneClasses: Record<string, string> = {
  default: "border-border/70 bg-secondary/60 text-muted-foreground",
  primary: "border-accent/40 bg-accent/10 text-accent",
  success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-400",
  danger: "border-destructive/40 bg-destructive/10 text-destructive",
};

/**
 * SalesOps-style page header. Flat, clean, no orbs/gradients — just a
 * clear title row with optional chips and right-aligned actions.
 */
export const AdminPageHeader = ({
  eyebrow,
  title,
  description,
  chips,
  actions,
  className,
}: AdminPageHeaderProps) => (
  <header
    className={cn(
      "mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-border/60 pb-5",
      className,
    )}
  >
    <div className="min-w-0">
      {eyebrow && (
        <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
          {eyebrow}
        </div>
      )}
      <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
        {title}
      </h1>
      {description && (
        <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {chips && chips.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {chips.map((c, i) => (
            <span
              key={i}
              className={cn(
                "inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
                toneClasses[c.tone ?? "default"],
              )}
            >
              {c.label}
            </span>
          ))}
        </div>
      )}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </header>
);
