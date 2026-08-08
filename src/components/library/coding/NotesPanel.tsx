import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatSavedAt, showDeleteUndoRedoToast } from "./noteToasts";
import { NoteHistoryMenu } from "./NoteHistoryMenu";



import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold,
  Italic,
  Strikethrough,
  Code2,
  List,
  ListOrdered,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useProblemNotes } from "@/hooks/useProblemNotes";
import { cn } from "@/lib/utils";

const MAX_CHARS = 10_000;

interface Props {
  slug: string;
  title: string;
}

/**
 * Full-tab personal markdown notes panel. Shares storage and feature
 * parity with `ProblemNoteQuickEdit` (toolbar, edit/preview, clear
 * with confirm, ⌘/Ctrl+Enter save, char counter) via `useProblemNotes`.
 */
export const NotesPanel = ({ slug, title }: Props) => {
  const { note, setNote, clear, savedAt, status, versions, restoreVersion, retry } =
    useProblemNotes(slug);
  const [draft, setDraft] = useState(note);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [confirmClear, setConfirmClear] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  // Tracks the last `note` value we've synced INTO the draft. If an
  // external write arrives (other tab, quick-edit popover) while the
  // user has unsaved local edits, we keep the local draft instead of
  // clobbering their in-progress work.
  const lastSyncedNoteRef = useRef(note);
  const prevStatusRef = useRef(status);

  useEffect(() => {
    if (draft === lastSyncedNoteRef.current) {
      setDraft(note);
    }
    lastSyncedNoteRef.current = note;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note]);

  // Autosave while typing (debounced), so users don't need ⌘+Enter.
  const autosaveTimer = useRef<number | null>(null);
  useEffect(() => {
    if (draft === note) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      setNote(draft);
    }, 800);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [draft, note, setNote]);

  // Fire a "Saved" toast only when a storage write actually completes,
  // and a retryable error toast when a save fails.
  useEffect(() => {
    if (prevStatusRef.current === "saving" && status === "saved") {
      toast.success("Note saved", { duration: 1500 });
    }
    if (prevStatusRef.current !== "error" && status === "error") {
      toast.error("Couldn't save note", {
        description: "Your changes are still in the editor.",
        duration: 10_000,
        action: {
          label: "Retry",
          onClick: () => {
            if (retry()) toast.success("Note saved", { duration: 1500 });
          },
        },
      });
    }
    prevStatusRef.current = status;
  }, [status, retry]);

  useEffect(
    () => () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    },
    [],
  );

  const hasDraft = draft.trim().length > 0;
  const hasNote = note.trim().length > 0;

  const isMac =
    typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl";

  const isSaving = status === "saving" || draft !== note;
  const savedLabel = isSaving ? "Saving…" : formatSavedAt(savedAt);




  const save = () => {
    setNote(draft);
    const el = textareaRef.current;
    const s = el?.selectionStart ?? null;
    const e = el?.selectionEnd ?? null;
    const top = el?.scrollTop ?? 0;
    requestAnimationFrame(() => {
      const t = textareaRef.current;
      if (!t) return;
      t.focus();
      if (s !== null && e !== null) t.setSelectionRange(s, e);
      t.scrollTop = top;
    });
  };


  const wrap = (before: string, after = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? 0;
    const v = el.value;
    const sel = v.slice(s, e);
    const next = v.slice(0, s) + before + sel + after + v.slice(e);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = s + before.length + sel.length + after.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const prefixLines = (prefix: string | ((i: number) => string)) => {
    const el = textareaRef.current;
    if (!el) return;
    const s = el.selectionStart ?? 0;
    const e = el.selectionEnd ?? 0;
    const v = el.value;
    const lineStart = v.lastIndexOf("\n", s - 1) + 1;
    const block = v.slice(lineStart, e);
    const lines = block.split("\n");
    const transformed = lines
      .map((ln, i) => (typeof prefix === "string" ? prefix : prefix(i)) + ln)
      .join("\n");
    const next = v.slice(0, lineStart) + transformed + v.slice(e);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + transformed.length);
    });
  };

  const onKeyDown = (ev: React.KeyboardEvent) => {
    if ((ev.metaKey || ev.ctrlKey) && ev.key === "Enter") {
      ev.preventDefault();
      save();
      return;
    }
    if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === "p") {
      ev.preventDefault();
      setMode((m) => (m === "edit" ? "preview" : "edit"));
    }
  };

  const tools: Array<{ icon: typeof Bold; label: string; run: () => void }> = [
    { icon: Bold, label: "Bold", run: () => wrap("**") },
    { icon: Italic, label: "Italic", run: () => wrap("*") },
    { icon: Strikethrough, label: "Strikethrough", run: () => wrap("~~") },
    { icon: Code2, label: "Inline code", run: () => wrap("`") },
    { icon: List, label: "Bulleted list", run: () => prefixLines("- ") },
    { icon: ListOrdered, label: "Numbered list", run: () => prefixLines((i) => `${i + 1}. `) },
  ];

  return (
    <div className="space-y-3" onKeyDown={onKeyDown}>
      <div className="flex items-center justify-between gap-2 p-2 rounded-[1.25rem] bg-muted/20 border border-border/30">
        <div
          className="flex items-center gap-0.5"
          role="toolbar"
          aria-label="Formatting"
        >
          {tools.map((t) => (
            <Button
              key={t.label}
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-xl hover:bg-foreground/5 hover:text-foreground transition-all"
              onClick={t.run}
              aria-label={t.label}
              title={t.label}
              disabled={mode === "preview"}
            >
              <t.icon className="h-3.5 w-3.5" aria-hidden />
            </Button>
          ))}
          <div className="mx-1 h-5 w-px bg-border/50" aria-hidden />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 px-3 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-foreground/5 transition-all"
            onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
            aria-pressed={mode === "preview"}
            aria-label={mode === "edit" ? "Show preview" : "Back to edit"}
            title={`Toggle preview (${modKey}+P)`}
          >
            {mode === "edit" ? (
              <>
                <Eye className="h-3.5 w-3.5" aria-hidden /> Preview
              </>
            ) : (
              <>
                <Pencil className="h-3.5 w-3.5" aria-hidden /> Edit
              </>
            )}
          </Button>
        </div>

        <div className="flex items-center gap-3 px-2">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {isSaving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500" />
            ) : savedAt ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Loader2 className="h-3.5 w-3.5 opacity-50" />
            )}
            <span aria-live="polite">{savedLabel}</span>
          </div>
          <NoteHistoryMenu versions={versions} onRestore={restoreVersion} />
          {hasNote && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all"
              onClick={() => setConfirmClear(true)}
              aria-label={`Delete note for ${title}`}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </Button>
          )}
        </div>
      </div>


      {mode === "edit" ? (
        <Textarea
          ref={textareaRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
          placeholder={
            "# My approach\n\n- Brute force: O(n²)\n- Optimised with hashmap → O(n)\n\n```py\n# Pseudocode here\n```"
          }
          aria-label={`Markdown note for ${title}`}
          className={cn("font-mono text-sm min-h-[400px] rounded-[1.5rem] bg-[#0a0a0c]/80 border-border/40 selection:bg-primary/20 p-6 resize-y leading-relaxed focus-visible:ring-primary/20")}
        />
      ) : (
        <Card className="p-8 rounded-[1.5rem] bg-[#0a0a0c]/80 border-border/40 shadow-2xl shadow-black/40 prose prose-invert max-w-none min-h-[400px] selection:bg-primary/20 overflow-y-auto">
          {hasDraft ? (
            <ReactMarkdown 
              remarkPlugins={[remarkGfm]}
              components={{
                code: ({node, ...props}) => <code className="text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded-md border border-amber-500/20 font-mono" {...props} />,
                pre: ({node, ...props}) => <pre className="bg-black/40 border border-border/20 p-4 rounded-xl overflow-x-auto" {...props} />
              }}
            >
              {draft}
            </ReactMarkdown>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-20 text-center space-y-4">
              <div className="h-16 w-16 rounded-[2rem] bg-muted/20 flex items-center justify-center">
                <FileText className="h-8 w-8 text-muted-foreground/20" />
              </div>
              <p className="text-muted-foreground/40 text-sm font-black uppercase tracking-[0.2em]">
                Note is empty
              </p>
            </div>
          )}
        </Card>
      )}

      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span aria-live="polite">
          {draft.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
        </span>
        <span>{modKey}+Enter to save</span>
      </div>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              Your personal note for “{title}” will be permanently removed
              from this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const previous = note;
                clear();
                setDraft("");
                setConfirmClear(false);
                showDeleteUndoRedoToast({
                  title,
                  previous,
                  applyValue: setNote,
                  applyClear: clear,
                });
              }}
              className="bg-rose-600 hover:bg-rose-500"
            >
              Delete note
            </AlertDialogAction>

          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
