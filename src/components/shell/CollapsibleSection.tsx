import { ReactNode, useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface CollapsibleSectionProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  badge?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Compact collapsible wrapper for non-table page sections.
 * Keeps long pages organised and scannable by collapsing secondary content.
 */
export function CollapsibleSection({
  title,
  description,
  icon: Icon,
  defaultOpen = false,
  badge,
  children,
  className,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("w-full", className)}>
      <div className="rounded-xl border border-border/50 bg-card/40 backdrop-blur-sm overflow-hidden">
        <CollapsibleTrigger
          className={cn(
            "w-full flex items-center gap-3 px-4 sm:px-5 py-3 text-left transition-colors",
            "hover:bg-muted/40 focus-parikshaa",
            open && "border-b border-border/40",
          )}
        >
          {Icon && (
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary/15 to-orange-500/15 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{title}</p>
            {description && (
              <p className="text-xs text-muted-foreground truncate">{description}</p>
            )}
          </div>
          {badge}
          <ChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform shrink-0",
              open && "rotate-180",
            )}
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
          <div className="p-4 sm:p-5">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

export default CollapsibleSection;
