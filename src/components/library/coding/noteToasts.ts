import { toast } from "sonner";

const formatSavedAt = (ts: number | null): string => {
  if (!ts) return "Not saved yet";
  const d = new Date(ts);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  const ss = d.getSeconds().toString().padStart(2, "0");
  return `Last saved at ${hh}:${mm}:${ss}`;
};

/**
 * Fire a delete-note toast with an Undo action. If the user clicks
 * Undo we restore the *exact* previous note (captured in this call,
 * so subsequent edits before the toast expires can't affect it) and
 * immediately offer a Redo toast that re-applies the deletion.
 */
const showDeleteUndoRedoToast = (opts: {
  title: string;
  previous: string;
  applyValue: (v: string) => void; // usually setNote from useProblemNotes
  applyClear: () => void; // usually clear from useProblemNotes
}) => {
  const { title, previous, applyValue, applyClear } = opts;
  toast(`Note for “${title}” deleted`, {
    duration: 8000,
    action: {
      label: "Undo",
      onClick: () => {
        applyValue(previous);
        toast.success("Note restored", {
          duration: 8000,
          action: {
            label: "Redo delete",
            onClick: () => {
              applyClear();
              toast(`Note for “${title}” deleted`);
            },
          },
        });
      },
    },
  });
};

export { formatSavedAt, showDeleteUndoRedoToast };
