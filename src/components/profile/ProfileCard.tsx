import { cn } from "@/lib/utils";
import { ReactNode } from "react";

/** A glass card matching the profile design system. */
export const ProfileCard = ({
  title,
  rightSlot,
  children,
  className,
  innerClassName,
}: {
  title?: string;
  rightSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  innerClassName?: string;
}) => (
  <section
    className={cn(
      "rounded-2xl border border-amber-400/30 bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl p-4 sm:p-5",
      "shadow-[0_8px_30px_-12px_hsl(var(--primary)/0.35)] ring-1 ring-amber-400/10",
      "transition-colors hover:border-amber-400/50",
      "min-w-0 overflow-hidden flex flex-col h-full",
      className,
    )}
  >
    {(title || rightSlot) && (
      <header className="flex items-center justify-between mb-4 gap-2">
        {title && (
          <h2 className="text-lg md:text-xl font-semibold tracking-tight text-foreground antialiased subpixel-antialiased">
            {title}
          </h2>
        )}
        {rightSlot}
      </header>
    )}
    <div className={cn("min-w-0 flex-1", innerClassName)}>{children}</div>
  </section>
);

export const EmptyCard = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center text-center py-6 gap-2">
    <div className="h-12 w-12 rounded-full bg-muted/40 grid place-items-center">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground">
        <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0Z" />
        <path d="M8 12h8" />
      </svg>
    </div>
    <p className="text-xs text-muted-foreground italic">{message}</p>
  </div>
);

export const SourcePill = ({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) => (
  <div className="inline-flex items-center rounded-full border border-amber-400/30 bg-card/60 p-0.5 text-[11px] backdrop-blur-sm">
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        onClick={() => onChange(o.value)}
        className={cn(
          "px-2.5 py-1 rounded-full font-medium transition-colors focus-visible:outline-none focus-parikshaa",
          value === o.value
            ? "bg-gradient-to-b from-amber-500/25 to-orange-500/15 text-amber-100 ring-1 ring-amber-400/50"
            : "text-muted-foreground hover:text-foreground hover:bg-amber-500/5",
        )}
      >
        {o.label}
      </button>
    ))}
  </div>
);
