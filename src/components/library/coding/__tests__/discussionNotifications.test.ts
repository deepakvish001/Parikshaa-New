import { describe, it, expect } from "vitest";
import {
  buildLikeNotification,
  buildReplyNotification,
  ingest,
  markRead,
  NOTIFICATION_DEDUP_WINDOW_MS,
  shouldDeliver,
  unreadCount,
  type DiscussionRow,
  type NotificationRow,
} from "../discussionNotifications";

const AUTHOR = "author-1";
const REPLIER = "replier-2";
const LIKER = "liker-3";
const SLUG = "two-sum";

const parent: DiscussionRow = {
  id: "d-root",
  user_id: AUTHOR,
  problem_slug: SLUG,
  content: "How do you think about the hash-map trade-off here?",
};

const reply = (id: string, user_id: string, content = "Nice idea"): DiscussionRow => ({
  id,
  user_id,
  problem_slug: SLUG,
  parent_id: parent.id,
  content,
});

describe("discussion reply notifications", () => {
  it("notifies the parent author on someone else's reply", () => {
    const n = buildReplyNotification(reply("r1", REPLIER), parent, 1_000);
    expect(n).not.toBeNull();
    expect(n!).toMatchObject({
      user_id: AUTHOR,
      type: "discussion_reply",
      read: false,
      data: { problem_slug: SLUG, parent_id: parent.id, from_user_id: REPLIER },
    });
  });

  it("does not self-notify when the author replies to themselves", () => {
    expect(buildReplyNotification(reply("r2", AUTHOR), parent, 1_000)).toBeNull();
  });

  it("ignores root comments (no parent)", () => {
    const root: DiscussionRow = { id: "d-2", user_id: REPLIER, problem_slug: SLUG };
    expect(buildReplyNotification(root, undefined, 1_000)).toBeNull();
  });

  it("truncates long reply content to 140 chars for the preview", () => {
    const long = "x".repeat(500);
    const n = buildReplyNotification(reply("r3", REPLIER, long), parent, 1_000)!;
    expect(n.message).toHaveLength(140);
  });
});

describe("discussion like notifications", () => {
  it("notifies the discussion owner when someone else likes it", () => {
    const n = buildLikeNotification({ discussion_id: parent.id, user_id: LIKER }, parent, 1_000);
    expect(n).not.toBeNull();
    expect(n!).toMatchObject({
      user_id: AUTHOR,
      type: "discussion_like",
      read: false,
      data: { discussion_id: parent.id, from_user_id: LIKER },
    });
  });

  it("does not notify when the author likes their own comment", () => {
    expect(
      buildLikeNotification({ discussion_id: parent.id, user_id: AUTHOR }, parent, 1_000),
    ).toBeNull();
  });
});

describe("dedup + unread state", () => {
  it("collapses a rapid repeat like from the same user into one unread notification", () => {
    const first = buildLikeNotification({ discussion_id: parent.id, user_id: LIKER }, parent, 1_000)!;
    const second = buildLikeNotification({ discussion_id: parent.id, user_id: LIKER }, parent, 5_000)!;
    let store: NotificationRow[] = [];
    store = ingest(first, store);
    store = ingest(second, store);
    expect(store).toHaveLength(1);
    expect(unreadCount(store, AUTHOR)).toBe(1);
  });

  it("delivers a new notification once the previous one is marked read", () => {
    const first = buildReplyNotification(reply("r1", REPLIER), parent, 1_000)!;
    const second = buildReplyNotification(reply("r2", REPLIER, "follow-up"), parent, 2_000)!;
    let store = ingest(first, []);
    store = markRead(store, (n) => n.data.discussion_id === "r1");
    store = ingest(second, store);
    expect(store).toHaveLength(2);
    expect(unreadCount(store, AUTHOR)).toBe(1);
  });

  it("delivers a new notification once the dedup window has elapsed", () => {
    const t0 = 1_000;
    const first = buildLikeNotification({ discussion_id: parent.id, user_id: LIKER }, parent, t0)!;
    const later = buildLikeNotification(
      { discussion_id: parent.id, user_id: LIKER },
      parent,
      t0 + NOTIFICATION_DEDUP_WINDOW_MS + 1,
    )!;
    let store = ingest(first, []);
    store = ingest(later, store);
    expect(store).toHaveLength(2);
    expect(unreadCount(store, AUTHOR)).toBe(2);
  });

  it("does not dedup across different sources or different discussions", () => {
    const likeA = buildLikeNotification({ discussion_id: parent.id, user_id: LIKER }, parent, 1_000)!;
    const likeB = buildLikeNotification(
      { discussion_id: parent.id, user_id: "liker-other" },
      parent,
      1_500,
    )!;
    const other: DiscussionRow = { ...parent, id: "d-other" };
    const likeC = buildLikeNotification({ discussion_id: other.id, user_id: LIKER }, other, 2_000)!;
    let store: NotificationRow[] = [];
    for (const n of [likeA, likeB, likeC]) store = ingest(n, store);
    expect(store).toHaveLength(3);
    expect(unreadCount(store, AUTHOR)).toBe(3);
  });

  it("does not dedup a like against a reply on the same discussion", () => {
    const likeN = buildLikeNotification({ discussion_id: parent.id, user_id: REPLIER }, parent, 1_000)!;
    const replyN = buildReplyNotification(reply("r1", REPLIER), parent, 1_100)!;
    let store = ingest(likeN, []);
    store = ingest(replyN, store);
    expect(store).toHaveLength(2);
  });

  it("shouldDeliver treats a prior read notification as non-blocking", () => {
    const prior: NotificationRow = {
      user_id: AUTHOR,
      type: "discussion_like",
      title: "t",
      message: "m",
      data: { problem_slug: SLUG, discussion_id: parent.id, from_user_id: LIKER },
      read: true,
      created_at: 1_000,
    };
    const incoming = buildLikeNotification({ discussion_id: parent.id, user_id: LIKER }, parent, 1_500)!;
    expect(shouldDeliver(incoming, [prior])).toBe(true);
  });
});
