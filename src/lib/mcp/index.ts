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
import { dbQueryTool } from "./tools/db-query-advanced";
import { dbRpcTool } from "./tools/db-rpc";
import { storageListTool, storageUploadTool, storageDeleteTool, storageSignedUrlTool } from "./tools/storage";
import { invokeEdgeFunctionTool } from "./tools/invoke-function";
import { adminManageRoleTool } from "./tools/admin-manage-role";
import {
  publishCodingProblemTool,
  listCodingProblemVersionsTool,
  rollbackCodingProblemTool,
} from "./tools/publish-coding-problem";
import { publishCodingSolutionTool } from "./tools/publish-coding-solution";
import { publishCodingBundleTool } from "./tools/publish-coding-bundle";
import { ensureAdminAccessTool } from "./tools/ensure-admin-access";
import {
  createSheetTool,
  listSheetsTool,
  addProblemsToSheetTool,
  removeProblemFromSheetTool,
  listSheetItemsTool,
  shareSheetTool,
  publishRoadmapTool,
  listRoadmapsTool,
} from "./tools/sheets";
import {
  listSheetTemplatesTool,
  createSheetFromTemplateTool,
  cloneSheetTool,
  reorderSheetItemsTool,
  publishSheetBundleTool,
} from "./tools/sheet-templates";
import {
  regenerateShareSheetLinkTool,
  updateSheetSectionsTool,
  getSheetDetailsTool,
  previewPublishSheetBundleTool,
} from "./tools/sheet-manage";
import {
  bulkRemoveProblemsFromSheetTool,
  getSheetShareStatusTool,
  deleteOrArchiveSheetTool,
} from "./tools/sheet-lifecycle";

// The OAuth issuer MUST be the direct Supabase host, built from the project ref,
// not from SUPABASE_URL (which may be the Lovable Cloud proxy).
const projectRef =
  import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "parikshaa-mcp",
  title: "Parikshaa",
  version: "0.1.0",
  instructions:
    "Parikshaa MCP server for admins/owners. Tools act as the signed-in user (RLS enforced) but admin/owner roles have broad read/write across all features. Start with `ensure_admin_access` then `whoami`. For any table: db_select (simple), db_query (advanced filters), db_insert/db_update/db_delete. For DB functions: db_rpc. For files: storage_list/upload/delete/signed_url. For business logic: invoke_edge_function. For access control: admin_manage_role. Coding-content publishing: publish_coding_bundle / publish_coding_problem / publish_coding_solution.",
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
    dbQueryTool,
    dbRpcTool,
    storageListTool,
    storageUploadTool,
    storageDeleteTool,
    storageSignedUrlTool,
    invokeEdgeFunctionTool,
    adminManageRoleTool,
    publishCodingProblemTool,
    listCodingProblemVersionsTool,
    rollbackCodingProblemTool,
    publishCodingSolutionTool,
    publishCodingBundleTool,
    ensureAdminAccessTool,
    createSheetTool,
    listSheetsTool,
    addProblemsToSheetTool,
    removeProblemFromSheetTool,
    listSheetItemsTool,
    shareSheetTool,
    publishRoadmapTool,
    listRoadmapsTool,
    listSheetTemplatesTool,
    createSheetFromTemplateTool,
    cloneSheetTool,
    reorderSheetItemsTool,
    publishSheetBundleTool,
    regenerateShareSheetLinkTool,
    updateSheetSectionsTool,
    getSheetDetailsTool,
    previewPublishSheetBundleTool,
  ],
});
