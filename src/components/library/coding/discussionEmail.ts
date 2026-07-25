/**
 * Email delivery rules for problem-discussion notifications.
 *
 * Contract: an email fires for the SAME event that produces an in-app
 * notification (see discussionNotifications.ts) — never in addition to,
 * never in place of. If the in-app notification is suppressed
 * (self-action, deduped, missing target), the email is suppressed too.
 */

import type { NotificationRow } from "./discussionNotifications";

export interface EmailPreferences {
  email_notifications_enabled: boolean;
  notify_discussion_reply: boolean;
  notify_discussion_like: boolean;
}

export const DEFAULT_EMAIL_PREFS: EmailPreferences = {
  email_notifications_enabled: true,
  notify_discussion_reply: true,
  notify_discussion_like: true,
};

/**
 * Given the in-app notification the trigger produced (or null when the
 * in-app side was suppressed) and the recipient's prefs, decide whether
 * to enqueue an email.
 */
export function shouldSendDiscussionEmail(
  inApp: NotificationRow | null,
  prefs: EmailPreferences,
): boolean {
  if (!inApp) return false; // mirror in-app suppression
  if (!prefs.email_notifications_enabled) return false;
  if (inApp.type === "discussion_reply") return prefs.notify_discussion_reply;
  if (inApp.type === "discussion_like") return prefs.notify_discussion_like;
  return false;
}
