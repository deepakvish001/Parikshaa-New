/**
 * Pure model of the discussion notification triggers in
 * supabase/migrations/20260703105548_*.sql, plus an in-app dedup rule
 * used to collapse rapid repeat events (e.g. unlike → relike, quick
 * follow-up replies) into a single unread notification.
 *
 * Kept as a pure module so the behavior is unit-testable without a
 * live database. The SQL triggers remain the source of truth in
 * production; this mirror lets us pin the contract in tests.
 */

export type DiscussionNotificationType = "discussion_reply" | "discussion_like";

export interface DiscussionRow {
  id: string;
  user_id: string;
  problem_slug: string;
  parent_id?: string | null;
  content?: string;
}

export interface LikeRow {
  discussion_id: string;
  user_id: string;
}

export interface NotificationRow {
  user_id: string;
  type: DiscussionNotificationType;
  title: string;
  message: string;
  data: {
    problem_slug: string;
    discussion_id: string;
    parent_id?: string;
    from_user_id: string;
  };
  read: boolean;
  created_at: number;
}

/** Dedup window used by the in-app store (ms). */
export const NOTIFICATION_DEDUP_WINDOW_MS = 60_000;

/** Returns the notification a reply insert should produce, or null. */
export function buildReplyNotification(
  reply: DiscussionRow,
  parent: DiscussionRow | undefined,
  now: number,
): NotificationRow | null {
  if (!reply.parent_id || !parent) return null;
  if (parent.user_id === reply.user_id) return null;
  return {
    user_id: parent.user_id,
    type: "discussion_reply",
    title: "New reply on your comment",
    message: (reply.content ?? "").slice(0, 140),
    data: {
      problem_slug: parent.problem_slug,
      discussion_id: reply.id,
      parent_id: parent.id,
      from_user_id: reply.user_id,
    },
    read: false,
    created_at: now,
  };
}

/** Returns the notification a like insert should produce, or null. */
export function buildLikeNotification(
  like: LikeRow,
  target: DiscussionRow | undefined,
  now: number,
): NotificationRow | null {
  if (!target) return null;
  if (target.user_id === like.user_id) return null;
  return {
    user_id: target.user_id,
    type: "discussion_like",
    title: "Someone liked your comment",
    message: (target.content ?? "").slice(0, 140),
    data: {
      problem_slug: target.problem_slug,
      discussion_id: target.id,
      from_user_id: like.user_id,
    },
    read: false,
    created_at: now,
  };
}

/**
 * Dedup contract: collapse when an unread notification of the same
 * type from the same source about the same discussion already exists
 * within NOTIFICATION_DEDUP_WINDOW_MS. Once the previous one is read
 * or the window has elapsed, a new notification is delivered.
 */
export function shouldDeliver(
  incoming: NotificationRow,
  existing: NotificationRow[],
): boolean {
  return !existing.some(
    (n) =>
      !n.read &&
      n.type === incoming.type &&
      n.user_id === incoming.user_id &&
      n.data.discussion_id === incoming.data.discussion_id &&
      n.data.from_user_id === incoming.data.from_user_id &&
      incoming.created_at - n.created_at < NOTIFICATION_DEDUP_WINDOW_MS,
  );
}

export function ingest(
  incoming: NotificationRow | null,
  store: NotificationRow[],
): NotificationRow[] {
  if (!incoming) return store;
  if (!shouldDeliver(incoming, store)) return store;
  return [...store, incoming];
}

export function unreadCount(store: NotificationRow[], userId: string): number {
  return store.filter((n) => n.user_id === userId && !n.read).length;
}

export function markRead(
  store: NotificationRow[],
  predicate: (n: NotificationRow) => boolean,
): NotificationRow[] {
  return store.map((n) => (predicate(n) ? { ...n, read: true } : n));
}
