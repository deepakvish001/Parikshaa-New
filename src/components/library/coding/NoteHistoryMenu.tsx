import { History } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import type { NoteVersion } from "@/hooks/useProblemNotes";

const formatAbsolute = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const formatRelative = (ts: number) => {
  const diff = Date.now() - ts;
  const sec = Math.max(1, Math.round(diff / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
};

interface Props {
  versions: NoteVersion[];
  onRestore: (index: number) => void;
  align?: "start" | "end";
}

/**
 * Popover history menu showing up to the last 10 saved versions of a
 * problem's note. Clicking an entry restores that snapshot as the
 * current draft (autosave will then push it as a fresh version).
 */
export function NoteHistoryMenu({ versions, onRestore, align = "end" }: Props) {
  const disabled = versions.length === 0;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 gap-1.5 px-2 text-[11px]"
          disabled={disabled}
          aria-label="Version history"
          title={disabled ? "No saved versions yet" : "Version history"}
        >
          <History className="h-3.5 w-3.5" aria-hidden />
          History
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className="w-72">
        <DropdownMenuLabel>Last {versions.length} versions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {versions.map((v, i) => (
          <DropdownMenuItem
            key={`${v.at}-${i}`}
            onSelect={() => onRestore(i)}
            className="flex flex-col items-start gap-0.5"
            title={formatAbsolute(v.at)}
          >
            <span className="flex w-full items-center justify-between gap-2 text-xs font-medium">
              <span>{formatAbsolute(v.at)}</span>
              <span className="text-[10px] font-normal text-muted-foreground">
                {formatRelative(v.at)}
                {i === 0 && (
                  <span className="ml-1.5 text-emerald-500">· latest</span>
                )}
              </span>
            </span>
            <span className="line-clamp-1 text-[11px] text-muted-foreground">
              {v.value.trim().split("\n")[0] || "(empty)"}
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
