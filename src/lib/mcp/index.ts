import { auth, defineMcp } from "@lovable.dev/mcp-js";
import whoamiTool from "./tools/whoami";
import listFoldersTool from "./tools/list-folders";
import listQuizAttemptsTool from "./tools/list-quiz-attempts";
import getProgressStatsTool from "./tools/get-progress-stats";
import listFolderItemsTool from "./tools/list-folder-items";
import listSolvedProblemsTool from "./tools/list-solved-problems";
import listTopicProgressTool from "./tools/list-topic-progress";
import listJournalEntriesTool from "./tools/list-journal-entries";
import listNotificationsTool from "./tools/list-notifications";
import listGoalsTool from "./tools/list-goals";
import searchCodingProblemsTool from "./tools/search-coding-problems";
import listPlatformStatsTool from "./tools/list-platform-stats";
import createFolderTool from "./tools/create-folder";
import addFolderItemTool from "./tools/add-folder-item";
import createJournalEntryTool from "./tools/create-journal-entry";
import markNotificationsReadTool from "./tools/mark-notifications-read";
import { dbSelectTool, dbInsertTool, dbUpdateTool, dbDeleteTool } from "./tools/db-universal";
import {
  publishCodingProblemTool,
  listCodingProblemVersionsTool,
  rollbackCodingProblemTool,
} from "./tools/publish-coding-problem";

// The OAuth issuer MUST be the direct Supabase host, built from the project ref,
// not from SUPABASE_URL (which may be the Lovable Cloud proxy).
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "parikshaa-mcp",
  title: "Parikshaa",
  version: "0.1.0",
  instructions:
    "Parikshaa MCP server. Tools act as the signed-in user (RLS enforced). Start with `whoami`. Use the feature-specific tools (list_folders, list_quiz_attempts, etc.) for common tasks, and the universal `db_select` / `db_insert` / `db_update` / `db_delete` tools to read or write ANY other table in the app.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    whoamiTool,
    listFoldersTool,
    listFolderItemsTool,
    listQuizAttemptsTool,
    getProgressStatsTool,
    listSolvedProblemsTool,
    listTopicProgressTool,
    listJournalEntriesTool,
    listNotificationsTool,
    listGoalsTool,
    searchCodingProblemsTool,
    listPlatformStatsTool,
    createFolderTool,
    addFolderItemTool,
    createJournalEntryTool,
    markNotificationsReadTool,
    dbSelectTool,
    dbInsertTool,
    dbUpdateTool,
    dbDeleteTool,
    publishCodingProblemTool,
    listCodingProblemVersionsTool,
    rollbackCodingProblemTool,
  ],
});
