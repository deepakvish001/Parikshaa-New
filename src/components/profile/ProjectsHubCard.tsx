import { useState } from "react";
import { ExternalLink, Github, Pin, Plus, FolderKanban } from "lucide-react";
import { ProfileCard, EmptyCard } from "./ProfileCard";
import { ActionIcon } from "@/components/common/ActionIcon";
import { useUserProjects, type UserProject } from "@/hooks/useUserProjects";
import { useAuth } from "@/contexts/AuthContext";
import { ProjectsManagerSheet } from "./ProjectsManagerSheet";

export function ProjectsHubCard({ userId }: { userId: string }) {
  const { user } = useAuth();
  const isOwner = !!user && user.id === userId;
  const { data, isLoading } = useUserProjects(userId);
  const [managerOpen, setManagerOpen] = useState(false);

  const projects = (data ?? []).slice(0, 6);

  return (
    <ProfileCard
      title="Projects"
      rightSlot={
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {isLoading ? "…" : `${data?.length ?? 0} project${(data?.length ?? 0) === 1 ? "" : "s"}`}
          </span>
          {isOwner && (
            <ActionIcon
              icon={Plus}
              label="Manage projects"
              tooltip="Add or edit projects"
              tone="amber"
              size={7}
              iconSize={3.5}
              onClick={() => setManagerOpen(true)}
            />
          )}
        </div>
      }
    >
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse" aria-busy="true">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted/30" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyCard
          message={
            isOwner
              ? "Add your first project — share what you've shipped"
              : "No projects to show yet"
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {projects.map((p) => <ProjectTile key={p.id} project={p} />)}
        </div>
      )}

      {isOwner && (
        <ProjectsManagerSheet
          userId={userId}
          open={managerOpen}
          onOpenChange={setManagerOpen}
        />
      )}
    </ProfileCard>
  );
}

function ProjectTile({ project: p }: { project: UserProject }) {
  return (
    <article className="group rounded-xl border border-amber-400/20 bg-gradient-to-br from-card/70 to-card/40 overflow-hidden flex flex-col min-w-0 hover:border-amber-400/45 transition-colors">
      <div className="relative h-24 bg-gradient-to-br from-amber-500/20 via-orange-500/15 to-amber-500/5">
        {p.cover_image_url && (
          <img
            src={p.cover_image_url}
            alt=""
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}
        {p.pinned && (
          <span className="absolute top-1.5 left-1.5 inline-flex items-center gap-1 rounded-full bg-amber-500/90 text-amber-950 text-[10px] font-semibold px-1.5 py-0.5">
            <Pin className="h-2.5 w-2.5" /> Pinned
          </span>
        )}
        {!p.cover_image_url && (
          <div className="absolute inset-0 grid place-items-center text-amber-300/60">
            <FolderKanban className="h-7 w-7" />
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-foreground truncate" title={p.title}>{p.title}</h3>
        {p.description && (
          <p className="text-[12px] text-muted-foreground line-clamp-2">{p.description}</p>
        )}
        {p.tech_stack.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {p.tech_stack.slice(0, 4).map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full border border-amber-400/30 bg-amber-500/10 text-amber-200 text-[10px] px-1.5 py-0.5"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="flex items-center gap-1 pt-1">
          {p.repo_url && (
            <a
              href={p.repo_url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${p.title} repository`}
              className="inline-flex items-center gap-1 text-[11px] text-amber-200 hover:text-amber-100 focus-parikshaa rounded px-1"
            >
              <Github className="h-3 w-3" /> Repo
            </a>
          )}
          {p.live_url && (
            <a
              href={p.live_url}
              target="_blank"
              rel="noreferrer"
              aria-label={`${p.title} live demo`}
              className="inline-flex items-center gap-1 text-[11px] text-amber-200 hover:text-amber-100 focus-parikshaa rounded px-1"
            >
              <ExternalLink className="h-3 w-3" /> Live
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
