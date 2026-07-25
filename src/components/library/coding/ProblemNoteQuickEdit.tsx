import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { formatSavedAt, showDeleteUndoRedoToast } from "./noteToasts";
import { NoteHistoryMenu } from "./NoteHistoryMenu";


import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  NotebookPen,
  Bold,
  Italic,
  Strikethrough,
  Code2,
  List,
  ListOrdered,
  Eye,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useProblemNotes } from "@/hooks/useProblemNotes";
import { cn } from "@/lib/utils";

const MAX_CHARS = 10_000;

/**
 * Fully keyboard-accessible modal note editor for a problem. Shares
 * storage with the detail-page Notes panel via `useProblemNotes`, so
 * edits sync instantly in both directions.
 */
export function ProblemNoteQuickEdit({ slug, title }: { slug: string; title: string }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [confirmClear, setConfirmClear] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [draft, setDraft] = useState("");
  const { note, setNote, clear, savedAt, status, versions, restoreVersion, retry } =
    useProblemNotes(slug);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const autosaveTimer = useRef<number | null>(null);
  // Track the last `note` value we synced into the draft so we can
  // preserve in-progress local edits when external writes arrive.
  const lastSyncedNoteRef = useRef("");
  const prevStatusRef = useRef(status);
  const hasNote = note.trim().length > 0;
  const hasDraft = draft.trim().length > 0;
  const isDirty = open && draft !== note;
  const isSaving = open && (status === "saving" || draft !== note);

  // On open: hydrate draft from persisted note.
  useEffect(() => {
    if (open) {
      setDraft(note);
      lastSyncedNoteRef.current = note;
      setMode("edit");
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // External note changes (other tab / detail Notes tab): merge without
  // clobbering in-progress local edits.
  useEffect(() => {
    if (!open) return;
    if (draft === lastSyncedNoteRef.current) {
      setDraft(note);
    }
    lastSyncedNoteRef.current = note;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [note, open]);

  useEffect(() => {
    if (open && mode === "edit") {
      const t = window.setTimeout(() => textareaRef.current?.focus(), 30);
      return () => window.clearTimeout(t);
    }
  }, [open, mode]);

  // Autosave: while modal open, persist draft after a short debounce.
  useEffect(() => {
    if (!open) return;
    if (draft === note) return;
    if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    autosaveTimer.current = window.setTimeout(() => {
      setNote(draft);
    }, 800);
    return () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    };
  }, [draft, note, open, setNote]);

  // Fire a "Saved" toast only when a real storage write completes,
  // and a retryable error toast if the write fails.
  useEffect(() => {
    if (!open) {
      prevStatusRef.current = status;
      return;
    }
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
  }, [status, open, retry]);

  useEffect(
    () => () => {
      if (autosaveTimer.current) window.clearTimeout(autosaveTimer.current);
    },
    [],
  );

  const requestClose = () => {
    if (isDirty) {
      setConfirmClose(true);
    } else {
      setOpen(false);
    }
  };



  /**
   * Persist the current draft. When `closeAfter` is false (⌘/Ctrl+Enter),
   * we keep the modal open and preserve the textarea's selection and
   * scroll position so the user's edit context is intact.
   */
  const save = (closeAfter: boolean) => {
    setNote(draft);
    if (closeAfter) {
      setOpen(false);
      return;
    }
    const el = textareaRef.current;
    const selStart = el?.selectionStart ?? null;
    const selEnd = el?.selectionEnd ?? null;
    const scrollTop = el?.scrollTop ?? 0;

    // Restore focus + caret + scroll after React commits any re-render.
    requestAnimationFrame(() => {
      const t = textareaRef.current;
      if (!t) return;
      t.focus();
      if (selStart !== null && selEnd !== null) {
        t.setSelectionRange(selStart, selEnd);
      }
      t.scrollTop = scrollTop;
    });
  };


  const wrap = (before: string, after = before) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = el.value;
    const selected = value.slice(start, end);
    const next = value.slice(0, start) + before + selected + after + value.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + before.length + selected.length + after.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const prefixLines = (prefix: string | ((i: number) => string)) => {
    const el = textareaRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const value = el.value;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const block = value.slice(lineStart, end);
    const lines = block.split("\n");
    const transformed = lines
      .map((ln, i) => (typeof prefix === "string" ? prefix : prefix(i)) + ln)
      .join("\n");
    const next = value.slice(0, lineStart) + transformed + value.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(lineStart, lineStart + transformed.length);
    });
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // Cmd/Ctrl+Enter saves
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      save(false);
      return;
    }
    // Cmd/Ctrl+P toggles preview
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "p") {
      e.preventDefault();
      setMode((m) => (m === "edit" ? "preview" : "edit"));
    }
  };

  const tools: Array<{
    icon: typeof Bold;
    label: string;
    run: () => void;
  }> = [
    { icon: Bold, label: "Bold", run: () => wrap("**") },
    { icon: Italic, label: "Italic", run: () => wrap("*") },
    { icon: Strikethrough, label: "Strikethrough", run: () => wrap("~~") },
    { icon: Code2, label: "Inline code", run: () => wrap("`") },
    { icon: List, label: "Bulleted list", run: () => prefixLines("- ") },
    { icon: ListOrdered, label: "Numbered list", run: () => prefixLines((i) => `${i + 1}. `) },
  ];

  const isMac =
    typeof navigator !== "undefined" && /mac/i.test(navigator.platform);
  const modKey = isMac ? "⌘" : "Ctrl";

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        aria-label={
          hasNote
            ? `Edit personal note for ${title}`
            : `Add personal note for ${title}`
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        title={hasNote ? "Edit note" : "Add note"}
        className={cn(
          "inline-flex h-6 w-6 items-center justify-center rounded-md border transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-[#050505]",
          hasNote
            ? "border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
            : "border-zinc-800 text-zinc-500 hover:border-amber-500/40 hover:text-amber-300",
        )}
      >
        <NotebookPen className="h-3.5 w-3.5" aria-hidden />
      </button>

      <Dialog
        open={open}
        onOpenChange={(next) => {
          if (!next) requestClose();
          else setOpen(true);
        }}
      >
        <DialogContent
          className="max-w-2xl gap-4"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={onKeyDown}
          onEscapeKeyDown={(e) => {
            if (isDirty) {
              e.preventDefault();
              setConfirmClose(true);
            }
          }}
          onPointerDownOutside={(e) => {
            if (isDirty) {
              e.preventDefault();
              setConfirmClose(true);
            }
          }}
        >

          <DialogHeader>
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <DialogTitle className="truncate">{title}</DialogTitle>
                <DialogDescription>Add your notes below</DialogDescription>
              </div>
              {hasNote && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirmClear(true)}
                  aria-label={`Delete note for ${title}`}
                  className="h-8 gap-1.5 text-rose-300 hover:text-rose-200 hover:bg-rose-500/10"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  Clear
                </Button>
              )}
            </div>
          </DialogHeader>

          {/* Toolbar */}
          <div
            className="flex items-center gap-0.5 rounded-md border border-zinc-800 bg-zinc-950/60 p-1"
            role="toolbar"
            aria-label="Formatting"
          >
            {tools.map((t) => (
              <Button
                key={t.label}
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10"
                onClick={t.run}
                aria-label={t.label}
                title={t.label}
                disabled={mode === "preview"}
              >
                <t.icon className="h-3.5 w-3.5" aria-hidden />
              </Button>
            ))}
            <div className="mx-1 h-5 w-px bg-zinc-800" aria-hidden />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-[11px] text-zinc-400 hover:text-amber-300 hover:bg-amber-500/10"
              onClick={() => setMode(mode === "edit" ? "preview" : "edit")}
              aria-pressed={mode === "preview"}
              aria-label={mode === "edit" ? "Show preview" : "Back to edit"}
              title={`Toggle preview (${modKey}+P)`}
            >
              {mode === "edit" ? (
                <>
                  <Eye className="h-3 w-3" aria-hidden /> Preview
                </>
              ) : (
                <>
                  <Pencil className="h-3 w-3" aria-hidden /> Edit
                </>
              )}
            </Button>
          </div>

          {/* Editor / Preview */}
          {mode === "edit" ? (
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Write your notes here..."
              aria-label={`Markdown note for ${title}`}
              className="min-h-[300px] resize-none text-sm leading-relaxed"
            />
          ) : (
            <div
              className="prose prose-invert prose-sm max-w-none min-h-[300px] rounded-md border border-zinc-800 bg-zinc-950 p-4 overflow-auto"
              tabIndex={0}
              aria-label={`Preview of note for ${title}`}
            >
              {hasDraft ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft}</ReactMarkdown>
              ) : (
                <p className="text-zinc-500 italic m-0">Nothing to preview yet.</p>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span aria-live="polite" className="inline-flex items-center gap-1.5">
              {isSaving && (
                <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
              )}
              {isSaving ? "Saving…" : formatSavedAt(savedAt)}
              <span className="mx-1 text-zinc-700">·</span>
              {draft.length.toLocaleString()} / {MAX_CHARS.toLocaleString()} characters
            </span>
            <div className="flex items-center gap-2">
              <NoteHistoryMenu
                versions={versions}
                onRestore={restoreVersion}
                align="end"
              />
              <span>{modKey}+Enter to save</span>
            </div>
          </div>



          <DialogFooter>
            <Button type="button" variant="outline" onClick={requestClose}>
              Cancel

            </Button>
            <Button type="button" onClick={() => save(true)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
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
                setOpen(false);
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

      <AlertDialog open={confirmClose} onOpenChange={setConfirmClose}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Discard unsaved changes?</AlertDialogTitle>
            <AlertDialogDescription>
              You have edits that haven't been saved yet. Close without
              saving, or go back and press {modKey}+Enter to save.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setDraft(note);
                setConfirmClose(false);
                setOpen(false);
              }}
              className="bg-rose-600 hover:bg-rose-500"
            >
              Discard
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}


export default ProblemNoteQuickEdit;
