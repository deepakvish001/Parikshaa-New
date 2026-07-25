import { useEffect, useState } from "react";
import { Trash2, Pin, PinOff, Plus } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ActionIcon } from "@/components/common/ActionIcon";
import { toast } from "sonner";
import {
  useUserProjects,
  useUserProjectMutations,
  type UserProject,
} from "@/hooks/useUserProjects";

interface Draft {
  title: string;
  description: string;
  repo_url: string;
  live_url: string;
  tech_stack: string; // comma-separated
  cover_image_url: string;
  pinned: boolean;
}

const emptyDraft: Draft = {
  title: "", description: "", repo_url: "", live_url: "", tech_stack: "", cover_image_url: "", pinned: false,
};

export function ProjectsManagerSheet({
  userId,
  open,
  onOpenChange,
}: {
  userId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: projects } = useUserProjects(userId);
  const { create, update, remove } = useUserProjectMutations(userId);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDraft(emptyDraft);
      setEditingId(null);
    }
  }, [open]);

  const startEdit = (p: UserProject) => {
    setEditingId(p.id);
    setDraft({
      title: p.title,
      description: p.description ?? "",
      repo_url: p.repo_url ?? "",
      live_url: p.live_url ?? "",
      tech_stack: p.tech_stack.join(", "),
      cover_image_url: p.cover_image_url ?? "",
      pinned: p.pinned,
    });
  };

  const onSave = async () => {
    if (!draft.title.trim()) {
      toast.error("Title is required");
      return;
    }
    const payload = {
      title: draft.title.trim(),
      description: draft.description.trim() || null,
      repo_url: draft.repo_url.trim() || null,
      live_url: draft.live_url.trim() || null,
      tech_stack: draft.tech_stack.split(",").map((t) => t.trim()).filter(Boolean),
      cover_image_url: draft.cover_image_url.trim() || null,
      pinned: draft.pinned,
    };
    try {
      if (editingId) {
        await update.mutateAsync({ id: editingId, ...payload });
        toast.success("Project updated");
      } else {
        if ((projects?.length ?? 0) >= 12) {
          toast.error("You can showcase up to 12 projects");
          return;
        }
        await create.mutateAsync({ ...payload, source: "manual" });
        toast.success("Project added");
      }
      setDraft(emptyDraft);
      setEditingId(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  };

  const onDelete = async (id: string) => {
    try {
      await remove.mutateAsync(id);
      toast.success("Project removed");
      if (editingId === id) {
        setEditingId(null);
        setDraft(emptyDraft);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to remove");
    }
  };

  const togglePinned = async (p: UserProject) => {
    try {
      await update.mutateAsync({ id: p.id, pinned: !p.pinned });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Manage Projects</SheetTitle>
          <SheetDescription>
            Showcase up to 12 projects on your public profile.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-3 rounded-xl border border-amber-400/20 bg-amber-500/[0.04] p-3">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
            {editingId ? "Edit project" : "Add new project"}
          </p>
          <Input
            placeholder="Title *"
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
          <Textarea
            placeholder="Short description"
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-1 gap-2">
            <Input
              placeholder="Repo URL (https://github.com/...)"
              value={draft.repo_url}
              onChange={(e) => setDraft({ ...draft, repo_url: e.target.value })}
            />
            <Input
              placeholder="Live URL (https://...)"
              value={draft.live_url}
              onChange={(e) => setDraft({ ...draft, live_url: e.target.value })}
            />
            <Input
              placeholder="Tech stack (comma-separated: React, TypeScript, Postgres)"
              value={draft.tech_stack}
              onChange={(e) => setDraft({ ...draft, tech_stack: e.target.value })}
            />
            <Input
              placeholder="Cover image URL (optional)"
              value={draft.cover_image_url}
              onChange={(e) => setDraft({ ...draft, cover_image_url: e.target.value })}
            />
          </div>
          <label className="inline-flex items-center gap-2 text-[12px] text-foreground/90">
            <input
              type="checkbox"
              checked={draft.pinned}
              onChange={(e) => setDraft({ ...draft, pinned: e.target.checked })}
              className="accent-amber-500"
            />
            Pin to top
          </label>
          <div className="flex gap-2">
            <Button onClick={onSave} disabled={create.isPending || update.isPending} className="flex-1">
              <Plus className="h-4 w-4 mr-1" />
              {editingId ? "Save changes" : "Add project"}
            </Button>
            {editingId && (
              <Button
                variant="outline"
                onClick={() => { setEditingId(null); setDraft(emptyDraft); }}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6">
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
            Your projects ({projects?.length ?? 0})
          </p>
          {(projects?.length ?? 0) === 0 ? (
            <p className="text-[12px] text-muted-foreground italic">No projects yet.</p>
          ) : (
            <ul className="space-y-2">
              {projects!.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/40 px-3 py-2 min-w-0"
                >
                  <button
                    type="button"
                    onClick={() => startEdit(p)}
                    className="flex-1 text-left min-w-0 focus-parikshaa rounded"
                  >
                    <div className="text-[13px] font-medium text-foreground truncate">{p.title}</div>
                    {p.tech_stack.length > 0 && (
                      <div className="text-[10px] text-muted-foreground truncate">
                        {p.tech_stack.join(" · ")}
                      </div>
                    )}
                  </button>
                  <ActionIcon
                    icon={p.pinned ? PinOff : Pin}
                    label={p.pinned ? "Unpin" : "Pin"}
                    size={7}
                    iconSize={3.5}
                    tone={p.pinned ? "amber" : "default"}
                    onClick={() => togglePinned(p)}
                  />
                  <ActionIcon
                    icon={Trash2}
                    label="Delete project"
                    size={7}
                    iconSize={3.5}
                    tone="rose"
                    onClick={() => onDelete(p.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
