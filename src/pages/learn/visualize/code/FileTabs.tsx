import { useEffect, useState } from "react";
import { FileCode2, Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { CodeFile } from "./useCodeFiles";

interface FileTabsProps {
  files: CodeFile[];
  activeId: string;
  errorCounts?: Record<string, number>;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, name: string) => void;
}

/** VS Code-like tab strip + quick file picker (Ctrl/⌘+P). */
export const FileTabs = ({
  files,
  activeId,
  errorCounts = {},
  onSelect,
  onClose,
  onAdd,
  onRename,
}: FileTabsProps) => {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        setPickerOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commitRename = () => {
    if (editingId) onRename(editingId, draft);
    setEditingId(null);
  };

  return (
    <div className="shrink-0 flex items-center gap-1 border-b border-border/50 bg-white/[0.02] px-1.5">
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
        {files.map((f) => {
          const active = f.id === activeId;
          const errs = errorCounts[f.id] ?? 0;
          return (
            <div
              key={f.id}
              role="tab"
              aria-selected={active}
              tabIndex={0}
              onClick={() => onSelect(f.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(f.id);
                }
              }}
              onDoubleClick={() => {
                setEditingId(f.id);
                setDraft(f.name);
              }}
              className={cn(
                "group flex shrink-0 cursor-pointer items-center gap-1.5 rounded-t border-b-2 px-2.5 py-1.5 text-[11px] transition-colors",
                active
                  ? "border-sky-400 bg-white/[0.06] text-foreground"
                  : "border-transparent text-muted-foreground hover:bg-white/[0.04]",
              )}
            >
              <FileCode2 className={cn("h-3.5 w-3.5", errs > 0 && "text-destructive")} />
              {editingId === f.id ? (
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitRename();
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-28 rounded bg-background/70 px-1 text-[11px] outline-none ring-1 ring-sky-400/50"
                />
              ) : (
                <span className="max-w-[10rem] truncate font-mono">{f.name}</span>
              )}
              {errs > 0 && (
                <span className="rounded bg-destructive/20 px-1 text-[10px] text-destructive">{errs}</span>
              )}
              {files.length > 1 && (
                <button
                  type="button"
                  aria-label={`Close ${f.name}`}
                  className="rounded p-0.5 opacity-0 transition-opacity hover:bg-white/10 group-hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClose(f.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          );
        })}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 shrink-0 px-1.5"
          onClick={onAdd}
          title="New file"
          aria-label="New file"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Button
        size="sm"
        variant="ghost"
        className="h-7 shrink-0 gap-1 px-2 text-[11px] text-muted-foreground"
        onClick={() => setPickerOpen(true)}
        title="Quick open (Ctrl/⌘ + P)"
      >
        <Search className="h-3.5 w-3.5" /> Go to file
      </Button>

      <CommandDialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <CommandInput placeholder="Search files…" />
        <CommandList>
          <CommandEmpty>No files found.</CommandEmpty>
          <CommandGroup heading="Files">
            {files.map((f) => (
              <CommandItem
                key={f.id}
                value={`${f.name} ${f.language}`}
                onSelect={() => {
                  onSelect(f.id);
                  setPickerOpen(false);
                }}
              >
                <FileCode2 className="mr-2 h-4 w-4" />
                <span className="font-mono">{f.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">{f.language}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </div>
  );
};

export default FileTabs;
