import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Heart,
  MessageCircle,
  Reply,
  Trash2,
  Loader2,
  Pencil,
  Image as ImageIcon,
  Code2,
  Search,
  X,
  Copy,
  Check,
} from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SignInGate } from "@/components/library/coding/SignInGate";

// Sanitize schema: extend defaults to allow highlight.js classes on code/span/pre
// and title attribute on img. Images are only allowed via http/https (default).
const MARKDOWN_SANITIZE_SCHEMA = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), ["className"]],
    span: [...(defaultSchema.attributes?.span ?? []), ["className"]],
    pre: [...(defaultSchema.attributes?.pre ?? []), ["className"]],
    img: [...(defaultSchema.attributes?.img ?? []), "title", "loading", "referrerPolicy"],
  },
};

import {
  validateAttachment,
  isSafeImageUrl,
  SIGNED_URL_TTL_SECONDS,
} from "./discussionAttachments";

const REPLY_INITIAL = 3;
const REPLY_STEP = 5;

type DiscussionRow = {
  id: string;
  problem_slug: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

type ProfileLite = { user_id: string; full_name: string | null; avatar_url: string | null };

type Node = DiscussionRow & {
  author?: ProfileLite;
  likes: number;
  likedByMe: boolean;
  replies: Node[];
};

interface Props {
  slug: string;
}

const MAX_LEN = 4000;
const PAGE_SIZE = 20;

function useDebounced<T>(value: T, delay = 200): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}


async function uploadAttachment(userId: string, file: File): Promise<string | null> {
  const check = validateAttachment(file);
  if (check.ok !== true) {
    toast.error(check.reason);
    return null;
  }
  const path = `${userId}/${crypto.randomUUID()}.${check.ext}`;
  const { error } = await supabase.storage.from("discussion-attachments").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (error) {
    toast.error(error.message);
    return null;
  }
  const { data, error: signErr } = await supabase.storage
    .from("discussion-attachments")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);
  if (signErr || !data) {
    toast.error(signErr?.message ?? "Could not sign attachment URL");
    return null;
  }
  return data.signedUrl;
}

export function ProblemDiscussion({ slug }: Props) {
  const { user } = useAuth();
  const [rows, setRows] = useState<DiscussionRow[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileLite>>({});
  const [likes, setLikes] = useState<{ discussion_id: string; user_id: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [rootCount, setRootCount] = useState(0);
  const [rootsLoaded, setRootsLoaded] = useState(0);
  const [posting, setPosting] = useState(false);
  const [draft, setDraft] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search, 200);
  const mainTextareaRef = useRef<HTMLTextAreaElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Scroll to (and briefly highlight) a comment referenced by
  // `#discussion-<id>` when arriving from a notification. Retries a
  // few times because comments hydrate asynchronously.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const hash = window.location.hash;
    if (!hash.startsWith("#discussion-")) return;
    let tries = 0;
    const tick = () => {
      const el = document.getElementById(hash.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        el.classList.add("ring-2", "ring-amber-500/60", "rounded-lg");
        window.setTimeout(() => {
          el.classList.remove("ring-2", "ring-amber-500/60", "rounded-lg");
        }, 2400);
        return;
      }
      if (tries++ < 20) window.setTimeout(tick, 200);
    };
    tick();
  }, [rows.length]);


  const fetchPage = useCallback(
    async (reset: boolean) => {
      if (reset) setLoading(true);
      else setLoadingMore(true);

      const offset = reset ? 0 : rootsLoaded;

      // Count roots
      const { count } = await supabase
        .from("coding_problem_discussions")
        .select("id", { count: "exact", head: true })
        .eq("problem_slug", slug)
        .is("parent_id", null)
        .is("deleted_at", null);
      setRootCount(count ?? 0);

      // Fetch a page of roots (latest first)
      const { data: roots, error: rootErr } = await supabase
        .from("coding_problem_discussions")
        .select("*")
        .eq("problem_slug", slug)
        .is("parent_id", null)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);
      if (rootErr) {
        console.error(rootErr);
        setLoading(false);
        setLoadingMore(false);
        return;
      }
      const rootList = (roots ?? []) as DiscussionRow[];
      const rootIds = rootList.map((r) => r.id);

      // Fetch all descendants for these roots (single level of parent_id lookup;
      // covers the 3-level UI cap since replies chain via parent_id).
      let descendants: DiscussionRow[] = [];
      if (rootIds.length) {
        const collected: DiscussionRow[] = [];
        let frontier = rootIds;
        for (let depth = 0; depth < 4 && frontier.length; depth++) {
          const { data: children } = await supabase
            .from("coding_problem_discussions")
            .select("*")
            .eq("problem_slug", slug)
            .is("deleted_at", null)
            .in("parent_id", frontier);
          const arr = (children ?? []) as DiscussionRow[];
          if (!arr.length) break;
          collected.push(...arr);
          frontier = arr.map((r) => r.id);
        }
        descendants = collected;
      }

      const combined = [...rootList, ...descendants];
      const merged = reset
        ? combined
        : [
            ...rows.filter((r) => !combined.find((c) => c.id === r.id)),
            ...combined,
          ];
      setRows(merged);
      setRootsLoaded(offset + rootList.length);

      const ids = merged.map((r) => r.id);
      const userIds = Array.from(new Set(merged.map((r) => r.user_id)));
      const [likesRes, profRes] = await Promise.all([
        ids.length
          ? supabase.from("coding_problem_discussion_likes").select("*").in("discussion_id", ids)
          : Promise.resolve({ data: [] as { discussion_id: string; user_id: string }[] }),
        userIds.length
          ? supabase.from("profiles").select("user_id, full_name, avatar_url").in("user_id", userIds)
          : Promise.resolve({ data: [] as ProfileLite[] }),
      ]);
      setLikes((likesRes.data ?? []) as { discussion_id: string; user_id: string }[]);
      const map: Record<string, ProfileLite> = {};
      ((profRes.data ?? []) as ProfileLite[]).forEach((p) => (map[p.user_id] = p));
      setProfiles(map);

      setLoading(false);
      setLoadingMore(false);
    },
    [slug, rows, rootsLoaded],
  );

  const refreshCurrent = useCallback(async () => {
    // Refresh already-loaded roots + descendants without changing pagination window.
    const window = Math.max(PAGE_SIZE, rootsLoaded);
    setRootsLoaded(0);
    const prev = rows;
    setRows([]);
    await fetchPage(true);
    void prev;
    void window;
    // Note: fetchPage(true) resets to first page; that's acceptable because realtime
    // events usually add content near the top.
  }, [fetchPage, rootsLoaded, rows]);

  useEffect(() => {
    setRootsLoaded(0);
    setRows([]);
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  useEffect(() => {
    const ch = supabase
      .channel(`discussion:${slug}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coding_problem_discussions", filter: `problem_slug=eq.${slug}` },
        () => refreshCurrent(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coding_problem_discussion_likes" },
        () => refreshCurrent(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [slug, refreshCurrent]);

  // Infinite scroll sentinel
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          !loading &&
          !loadingMore &&
          rootsLoaded < rootCount
        ) {
          fetchPage(false);
        }
      },
      { rootMargin: "200px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [fetchPage, loading, loadingMore, rootsLoaded, rootCount]);

  const tree = useMemo<Node[]>(() => {
    const likeCounts: Record<string, number> = {};
    const likedByMe: Record<string, boolean> = {};
    likes.forEach((l) => {
      likeCounts[l.discussion_id] = (likeCounts[l.discussion_id] ?? 0) + 1;
      if (user && l.user_id === user.id) likedByMe[l.discussion_id] = true;
    });
    const nodes: Record<string, Node> = {};
    rows.forEach((r) => {
      nodes[r.id] = {
        ...r,
        author: profiles[r.user_id],
        likes: likeCounts[r.id] ?? 0,
        likedByMe: !!likedByMe[r.id],
        replies: [],
      };
    });
    const roots: Node[] = [];
    rows.forEach((r) => {
      const n = nodes[r.id];
      if (r.parent_id && nodes[r.parent_id]) nodes[r.parent_id].replies.push(n);
      else if (!r.parent_id) roots.push(n);
    });
    roots.sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
    return roots;
  }, [rows, likes, profiles, user]);

  const filteredTree = useMemo<Node[]>(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return tree;
    const matches = (n: Node): boolean => {
      if (n.content.toLowerCase().includes(q)) return true;
      return n.replies.some(matches);
    };
    const prune = (n: Node): Node => ({ ...n, replies: n.replies.filter(matches).map(prune) });
    return tree.filter(matches).map(prune);
  }, [tree, debouncedSearch]);

  const post = async (content: string, parent_id: string | null) => {
    if (!user) {
      toast.error("Sign in to join the discussion");
      return false;
    }
    const trimmed = content.trim();
    if (!trimmed) return false;
    if (trimmed.length > MAX_LEN) {
      toast.error(`Max ${MAX_LEN} characters`);
      return false;
    }
    setPosting(true);
    const { error } = await supabase.from("coding_problem_discussions").insert({
      problem_slug: slug,
      user_id: user.id,
      parent_id,
      content: trimmed,
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return false;
    }
    refreshCurrent();
    return true;
  };

  const saveEdit = async (id: string) => {
    if (!user) return;
    const trimmed = editDraft.trim();
    if (!trimmed) return;
    if (trimmed.length > MAX_LEN) {
      toast.error(`Max ${MAX_LEN} characters`);
      return;
    }
    const { error } = await supabase
      .from("coding_problem_discussions")
      .update({ content: trimmed })
      .eq("id", id)
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    setEditingId(null);
    setEditDraft("");
    refreshCurrent();
  };

  const toggleLike = async (n: Node) => {
    if (!user) {
      toast.error("Sign in to like");
      return;
    }
    if (n.likedByMe) {
      await supabase
        .from("coding_problem_discussion_likes")
        .delete()
        .eq("discussion_id", n.id)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("coding_problem_discussion_likes")
        .insert({ discussion_id: n.id, user_id: user.id });
    }
  };

  const remove = async (n: Node) => {
    if (!user || n.user_id !== user.id) return;
    if (!confirm("Delete this comment?")) return;
    await supabase
      .from("coding_problem_discussions")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", n.id);
    refreshCurrent();
  };

  const insertAtCursor = (
    ref: React.RefObject<HTMLTextAreaElement>,
    value: string,
    setValue: (v: string) => void,
    snippet: string,
  ) => {
    const el = ref.current;
    if (!el) {
      setValue(value + snippet);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const next = value.slice(0, start) + snippet + value.slice(end);
    setValue(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + snippet.length;
      el.setSelectionRange(pos, pos);
    });
  };

  const handleImageUpload = async (
    ref: React.RefObject<HTMLTextAreaElement>,
    value: string,
    setValue: (v: string) => void,
    file: File,
  ) => {
    if (!user) {
      toast.error("Sign in to upload");
      return;
    }
    const url = await uploadAttachment(user.id, file);
    if (!url) return;
    insertAtCursor(ref, value, setValue, `\n![image](${url})\n`);
  };

  const total = rootCount;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        <MessageCircle className="h-4 w-4 text-fuchsia-400" />
        <span className="font-medium text-foreground">Discussion</span>
        <span>· {total} {total === 1 ? "thread" : "threads"}</span>
        <div className="ml-auto relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search comments..."
            className="h-8 pl-7 pr-7 text-xs w-48 sm:w-64"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      <Card className="p-4">
        {user ? (
          <div className="space-y-2">
            <Textarea
              ref={mainTextareaRef}
              placeholder="Share your approach, ask a question, or drop a hint. Markdown supported."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              maxLength={MAX_LEN}
            />
            <ComposerToolbar
              value={draft}
              setValue={setDraft}
              textareaRef={mainTextareaRef}
              onImage={(file) => handleImageUpload(mainTextareaRef, draft, setDraft, file)}
              onInsertCode={() =>
                insertAtCursor(mainTextareaRef, draft, setDraft, "\n```\n\n```\n")
              }
            />
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {draft.length}/{MAX_LEN} · Markdown + images
              </span>
              <Button
                size="sm"
                disabled={posting || !draft.trim()}
                onClick={async () => {
                  const ok = await post(draft, null);
                  if (ok) setDraft("");
                }}
              >
                {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Post"}
              </Button>
            </div>
          </div>
        ) : (
          <SignInGate action="discussion" />
        )}
      </Card>

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : filteredTree.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {debouncedSearch
              ? "No comments match your search."
              : "No comments yet. Be the first to start the discussion."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredTree.map((n) => (
            <Comment
              key={n.id}
              node={n}
              depth={0}
              currentUserId={user?.id}
              highlight={debouncedSearch}
              replyingTo={replyTo}
              replyDraft={replyDraft}
              setReplyingTo={setReplyTo}
              setReplyDraft={setReplyDraft}
              editingId={editingId}
              editDraft={editDraft}
              setEditingId={setEditingId}
              setEditDraft={setEditDraft}
              onSaveEdit={saveEdit}
              posting={posting}
              onReplySubmit={async (parentId) => {
                const ok = await post(replyDraft, parentId);
                if (ok) {
                  setReplyDraft("");
                  setReplyTo(null);
                }
              }}
              onLike={toggleLike}
              onDelete={remove}
              onImageUpload={handleImageUpload}
              onInsertSnippet={insertAtCursor}
            />
          ))}
          <div ref={sentinelRef} />
          {loadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loadingMore && rootsLoaded < rootCount && (
            <div className="flex justify-center">
              <Button variant="outline" size="sm" onClick={() => fetchPage(false)}>
                Load more ({rootCount - rootsLoaded} left)
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ComposerToolbar({
  value,
  setValue,
  textareaRef,
  onImage,
  onInsertCode,
}: {
  value: string;
  setValue: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
  onImage: (file: File) => void;
  onInsertCode: () => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  void value;
  void setValue;
  void textareaRef;
  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          setUploading(true);
          await onImage(f);
          setUploading(false);
          e.target.value = "";
        }}
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <ImageIcon className="h-3.5 w-3.5" />
        )}
        Image
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 gap-1 px-2 text-xs"
        onClick={onInsertCode}
      >
        <Code2 className="h-3.5 w-3.5" />
        Code
      </Button>
    </div>
  );
}

interface CommentProps {
  node: Node;
  depth: number;
  currentUserId?: string;
  highlight: string;
  replyingTo: string | null;
  replyDraft: string;
  setReplyingTo: (id: string | null) => void;
  setReplyDraft: (v: string) => void;
  editingId: string | null;
  editDraft: string;
  setEditingId: (id: string | null) => void;
  setEditDraft: (v: string) => void;
  onSaveEdit: (id: string) => void;
  posting: boolean;
  onReplySubmit: (parentId: string) => void;
  onLike: (n: Node) => void;
  onDelete: (n: Node) => void;
  onImageUpload: (
    ref: React.RefObject<HTMLTextAreaElement>,
    value: string,
    setValue: (v: string) => void,
    file: File,
  ) => void;
  onInsertSnippet: (
    ref: React.RefObject<HTMLTextAreaElement>,
    value: string,
    setValue: (v: string) => void,
    snippet: string,
  ) => void;
}

function Comment(props: CommentProps) {
  const {
    node,
    depth,
    currentUserId,
    highlight,
    replyingTo,
    replyDraft,
    setReplyingTo,
    setReplyDraft,
    editingId,
    editDraft,
    setEditingId,
    setEditDraft,
    onSaveEdit,
    posting,
    onReplySubmit,
    onLike,
    onDelete,
    onImageUpload,
    onInsertSnippet,
  } = props;
  const isMine = currentUserId && node.user_id === currentUserId;
  const name = node.author?.full_name || "Anonymous";
  const initial = name.slice(0, 1).toUpperCase();
  const edited = new Date(node.updated_at).getTime() - new Date(node.created_at).getTime() > 2000;
  const isEditing = editingId === node.id;
  const editRef = useRef<HTMLTextAreaElement>(null);
  const replyRef = useRef<HTMLTextAreaElement>(null);
  const [visibleReplies, setVisibleReplies] = useState(REPLY_INITIAL);
  const replySentinelRef = useRef<HTMLDivElement>(null);

  const sortedReplies = useMemo(
    () =>
      node.replies
        .slice()
        .sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at)),
    [node.replies],
  );
  const shownReplies = sortedReplies.slice(0, visibleReplies);
  const remainingReplies = sortedReplies.length - shownReplies.length;

  useEffect(() => {
    if (remainingReplies <= 0) return;
    const el = replySentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleReplies((v) => v + REPLY_STEP);
        }
      },
      { rootMargin: "150px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [remainingReplies]);

  return (
    <div id={`discussion-${node.id}`} className={cn(depth > 0 && "ml-4 sm:ml-8 border-l border-border/60 pl-3 sm:pl-4")}>

      <Card className="p-3 sm:p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-8 w-8 shrink-0">
            {node.author?.avatar_url && <AvatarImage src={node.author.avatar_url} alt={name} />}
            <AvatarFallback className="text-xs">{initial}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">{name}</span>
              <span>·</span>
              <span>{formatDistanceToNow(new Date(node.created_at), { addSuffix: true })}</span>
              {edited && (
                <span
                  className="italic"
                  title={`Edited ${formatDistanceToNow(new Date(node.updated_at), { addSuffix: true })}`}
                >
                  (edited)
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  ref={editRef}
                  value={editDraft}
                  onChange={(e) => setEditDraft(e.target.value)}
                  rows={3}
                  maxLength={MAX_LEN}
                  autoFocus
                />
                <ComposerToolbar
                  value={editDraft}
                  setValue={setEditDraft}
                  textareaRef={editRef}
                  onImage={(f) => onImageUpload(editRef, editDraft, setEditDraft, f)}
                  onInsertCode={() =>
                    onInsertSnippet(editRef, editDraft, setEditDraft, "\n```\n\n```\n")
                  }
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(null);
                      setEditDraft("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={!editDraft.trim()}
                    onClick={() => onSaveEdit(node.id)}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert mt-1.5 max-w-none break-words prose-img:rounded-md prose-img:max-h-96 prose-pre:my-2 prose-pre:p-0 prose-pre:bg-transparent">
                <SafeMarkdown content={node.content} highlight={highlight} />
              </div>
            )}

            {!isEditing && (
              <div className="mt-2 flex items-center gap-1 text-xs">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2"
                  onClick={() => onLike(node)}
                >
                  <Heart
                    className={cn(
                      "h-3.5 w-3.5",
                      node.likedByMe ? "fill-rose-500 text-rose-500" : "text-muted-foreground",
                    )}
                  />
                  <span>{node.likes}</span>
                </Button>
                {depth < 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2"
                    onClick={() => setReplyingTo(replyingTo === node.id ? null : node.id)}
                  >
                    <Reply className="h-3.5 w-3.5" />
                    Reply
                  </Button>
                )}
                {isMine && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setEditingId(node.id);
                        setEditDraft(node.content);
                      }}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 gap-1 px-2 text-muted-foreground hover:text-rose-500"
                      onClick={() => onDelete(node)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            )}

            {replyingTo === node.id && (
              <div className="mt-3 space-y-2">
                <Textarea
                  ref={replyRef}
                  placeholder={`Reply to ${name}...`}
                  value={replyDraft}
                  onChange={(e) => setReplyDraft(e.target.value)}
                  rows={2}
                  maxLength={MAX_LEN}
                  autoFocus
                />
                <ComposerToolbar
                  value={replyDraft}
                  setValue={setReplyDraft}
                  textareaRef={replyRef}
                  onImage={(f) => onImageUpload(replyRef, replyDraft, setReplyDraft, f)}
                  onInsertCode={() =>
                    onInsertSnippet(replyRef, replyDraft, setReplyDraft, "\n```\n\n```\n")
                  }
                />
                <div className="flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setReplyingTo(null);
                      setReplyDraft("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    disabled={posting || !replyDraft.trim()}
                    onClick={() => onReplySubmit(node.id)}
                  >
                    {posting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Reply"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
      {sortedReplies.length > 0 && (
        <div className="mt-3 space-y-3">
          {shownReplies.map((child) => (
            <Comment key={child.id} {...props} node={child} depth={depth + 1} />
          ))}
          {remainingReplies > 0 && (
            <>
              <div ref={replySentinelRef} />
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => setVisibleReplies((v) => v + REPLY_STEP)}
              >
                Show {Math.min(REPLY_STEP, remainingReplies)} more{" "}
                {remainingReplies === 1 ? "reply" : "replies"} ({remainingReplies} left)
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function highlightChildren(children: React.ReactNode, query: string): React.ReactNode {
  if (!query) return children;
  const q = query.toLowerCase();
  const walk = (node: React.ReactNode): React.ReactNode => {
    if (typeof node === "string") {
      const parts: React.ReactNode[] = [];
      const lower = node.toLowerCase();
      let i = 0;
      let idx = lower.indexOf(q, i);
      let key = 0;
      while (idx !== -1) {
        if (idx > i) parts.push(node.slice(i, idx));
        parts.push(
          <mark key={key++} className="rounded bg-amber-500/30 px-0.5 text-foreground">
            {node.slice(idx, idx + q.length)}
          </mark>,
        );
        i = idx + q.length;
        idx = lower.indexOf(q, i);
      }
      if (i < node.length) parts.push(node.slice(i));
      return parts;
    }
    if (Array.isArray(node)) return node.map((n, k) => <span key={k}>{walk(n)}</span>);
    return node;
  };
  return walk(children);
}

export default ProblemDiscussion;

/**
 * Cache for highlighted code output — keyed by `${language}::${code}` so
 * switching tabs / loading more replies doesn't force rehype-highlight to
 * re-tokenize snippets we've already rendered.
 */
const highlightedNodeCache = new Map<string, React.ReactNode>();

function SafeImage({ src, alt }: { src: string; alt: string }) {
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [nonce, setNonce] = useState(0);
  if (state === "error") {
    return (
      <span className="my-2 inline-flex items-center gap-2 rounded-md border border-dashed border-border/60 bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <span>Image failed to load</span>
        <button
          type="button"
          onClick={() => {
            setState("loading");
            setNonce((n) => n + 1);
          }}
          className="rounded px-2 py-0.5 text-amber-400 underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
        >
          Retry
        </button>
      </span>
    );
  }
  return (
    <span className="relative my-2 inline-block max-w-full">
      {state === "loading" && (
        <Skeleton className="absolute inset-0 h-full w-full rounded-md" aria-hidden />
      )}
      <img
        key={nonce}
        src={src}
        alt={alt}
        loading="lazy"
        referrerPolicy="no-referrer"
        onLoad={() => setState("ok")}
        onError={() => setState("error")}
        className={cn(
          "max-h-96 rounded-md border border-border/60 transition-opacity",
          state === "loading" ? "opacity-0" : "opacity-100",
        )}
      />
    </span>
  );
}

const CopyableCodeBlock = React.memo(function CopyableCodeBlock({
  code,
  language,
  className,
  children,
}: {
  code: string;
  language?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <div className="group relative my-2 overflow-hidden rounded-md border border-border/60 bg-[#0d1117]">
      <div className="flex items-center justify-between border-b border-border/40 px-3 py-1 text-[11px] text-muted-foreground">
        <span className="font-mono uppercase tracking-wide">{language || "code"}</span>
        <button
          type="button"
          onClick={onCopy}
          onKeyDown={(e) => {
            if (e.key === "c" && (e.metaKey || e.ctrlKey)) return;
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              onCopy();
            }
          }}
          aria-label={copied ? "Code copied to clipboard" : "Copy code to clipboard"}
          aria-live="polite"
          className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-muted-foreground transition hover:bg-white/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-1 focus-visible:ring-offset-[#0d1117]"
        >
          {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        tabIndex={0}
        className={cn(
          "!m-0 overflow-x-auto p-3 text-xs leading-relaxed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/70",
          className,
        )}
      >
        <code className={className}>{children}</code>
      </pre>
    </div>
  );
});

export function SafeMarkdown({ content, highlight }: { content: string; highlight: string }) {
  const components: Components = useMemo(
    () => ({
      pre: ({ children }) => <>{children}</>,
      code: ({ className, children, ...rest }) => {
        const isInline = !/language-/.test(className || "");
        if (isInline) {
          return (
            <code
              className={cn(
                "rounded bg-foreground/10 px-1 py-0.5 font-mono text-[0.85em]",
                className,
              )}
              {...rest}
            >
              {children}
            </code>
          );
        }
        const lang = (className || "").match(/language-([\w-]+)/)?.[1];
        const raw = Array.isArray(children)
          ? children.map((c) => (typeof c === "string" ? c : "")).join("")
          : String(children ?? "");
        return (
          <CopyableCodeBlock code={raw.replace(/\n$/, "")} language={lang} className={className}>
            {children}
          </CopyableCodeBlock>
        );
      },
      img: ({ src, alt }) => {
        if (!isSafeImageUrl(src)) return null;
        return <SafeImage src={src as string} alt={alt ?? ""} />;
      },
      p: ({ children }) => <p>{highlight ? highlightChildren(children, highlight) : children}</p>,
      li: ({ children }) => (
        <li>{highlight ? highlightChildren(children, highlight) : children}</li>
      ),
      a: ({ href, children }) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow ugc"
          className="text-amber-400 underline underline-offset-2 hover:text-amber-300"
        >
          {children}
        </a>
      ),
    }),
    [highlight],
  );

  // Cache the rendered <ReactMarkdown> node keyed by content+highlight so
  // switching tabs / loading more replies doesn't re-run rehype-highlight
  // over snippets we've already tokenized.
  const cacheKey = `${highlight}::${content}`;
  const cached = highlightedNodeCache.get(cacheKey);
  if (cached) return <>{cached}</>;

  const node = (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[[rehypeSanitize, MARKDOWN_SANITIZE_SCHEMA], rehypeHighlight]}
      components={components}
    >
      {content}
    </ReactMarkdown>
  );
  // Bound cache to avoid unbounded growth.
  if (highlightedNodeCache.size > 200) {
    const firstKey = highlightedNodeCache.keys().next().value;
    if (firstKey) highlightedNodeCache.delete(firstKey);
  }
  highlightedNodeCache.set(cacheKey, node);
  return node;
}
