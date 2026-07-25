import { describe, it, expect } from "vitest";
import {
  buildLikeNotification,
  buildReplyNotification,
  ingest,
  type DiscussionRow,
  type NotificationRow,
} from "../discussionNotifications";
import {
  DEFAULT_EMAIL_PREFS,
  shouldSendDiscussionEmail,
} from "../discussionEmail";

const parent: DiscussionRow = {
  id: "d1",
  user_id: "author",
  problem_slug: "two-sum",
  content: "root",
};
const reply: DiscussionRow = {
  id: "d2",
  user_id: "other",
  problem_slug: "two-sum",
  parent_id: "d1",
  content: "reply",
};

const replyN = buildReplyNotification(reply, parent, 1_000)!;
const likeN = buildLikeNotification({ discussion_id: parent.id, user_id: "other" }, parent, 1_000)!;

describe("email delivery mirrors in-app rules", () => {
  it("sends email for a reply when the in-app notification is delivered", () => {
    expect(shouldSendDiscussionEmail(replyN, DEFAULT_EMAIL_PREFS)).toBe(true);
  });

  it("does not send email when the in-app notification was suppressed (self-action)", () => {
    const self = buildReplyNotification({ ...reply, user_id: "author" }, parent, 1_000);
    expect(self).toBeNull();
    expect(shouldSendDiscussionEmail(self, DEFAULT_EMAIL_PREFS)).toBe(false);
  });

  it("does not send email when a duplicate was collapsed by dedup", () => {
    let store: NotificationRow[] = [];
    store = ingest(likeN, store);
    const dup = buildLikeNotification({ discussion_id: parent.id, user_id: "other" }, parent, 2_000)!;
    const before = store.length;
    store = ingest(dup, store);
    const wasDeduped = store.length === before;
    const emailInput = wasDeduped ? null : dup;
    expect(wasDeduped).toBe(true);
    expect(shouldSendDiscussionEmail(emailInput, DEFAULT_EMAIL_PREFS)).toBe(false);
  });

  it("respects the master email toggle", () => {
    expect(
      shouldSendDiscussionEmail(replyN, { ...DEFAULT_EMAIL_PREFS, email_notifications_enabled: false }),
    ).toBe(false);
  });

  it("respects the per-type reply toggle", () => {
    expect(
      shouldSendDiscussionEmail(replyN, { ...DEFAULT_EMAIL_PREFS, notify_discussion_reply: false }),
    ).toBe(false);
    expect(
      shouldSendDiscussionEmail(likeN, { ...DEFAULT_EMAIL_PREFS, notify_discussion_reply: false }),
    ).toBe(true);
  });

  it("respects the per-type like toggle", () => {
    expect(
      shouldSendDiscussionEmail(likeN, { ...DEFAULT_EMAIL_PREFS, notify_discussion_like: false }),
    ).toBe(false);
    expect(
      shouldSendDiscussionEmail(replyN, { ...DEFAULT_EMAIL_PREFS, notify_discussion_like: false }),
    ).toBe(true);
  });

  it("ignores unrelated notification types", () => {
    const other = { ...replyN, type: "new_follower" as unknown as NotificationRow["type"] };
    expect(shouldSendDiscussionEmail(other, DEFAULT_EMAIL_PREFS)).toBe(false);
  });
});
