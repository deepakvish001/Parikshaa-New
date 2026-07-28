import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { AchievementNotificationProvider } from "@/contexts/AchievementNotificationContext";
import { LevelUpProvider } from "@/contexts/LevelUpContext";
import { PushNotificationProvider } from "@/contexts/PushNotificationContext";
import { FaviconNotificationProvider } from "@/contexts/FaviconNotificationContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { RouteRestorer } from "@/components/RouteRestorer";
import { CrossTabAuthSync } from "@/components/CrossTabAuthSync";
import TopicPalettePreview from "@/pages/dev/TopicPalettePreview";
import { DashboardLayout } from "@/components/DashboardLayout";
import BrandAmbientBackdrop from "@/components/BrandAmbientBackdrop";

import RouteSeo from "@/components/RouteSeo";


import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import LearnHub from "./pages/learn/LearnHub";
import Leaderboard from "./pages/dashboard/Leaderboard";


import DsaStudio from "./pages/learn/DsaStudio";
import DsaStudioProblem from "./pages/learn/DsaStudioProblem";
import DsaStudioPattern from "./pages/learn/DsaStudioPattern";
import DsaStudioPatternsPage from "./pages/learn/dsa-studio/PatternsPage";
import DsaStudioTricksPage from "./pages/learn/dsa-studio/TricksPage";
import DsaStudioEdgePage from "./pages/learn/dsa-studio/EdgePage";
import DsaStudioJournalPage from "./pages/learn/dsa-studio/JournalPage";

import VisualizeHub from "./pages/learn/visualize/VisualizeHub";
import VisualizeTrack from "./pages/learn/visualize/VisualizeTrack";
import VisualizePlayer from "./pages/learn/visualize/VisualizePlayer";
import CodePlayground from "./pages/learn/CodePlayground";
import WeeklyContests from "./pages/contests/WeeklyContests";
import ContestDetails from "./pages/contests/ContestDetails";
import ContestRatings from "./pages/contests/ContestRatings";


import Settings from "./pages/Settings";
import AuthCallback from "./pages/AuthCallback";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import NotFound from "./pages/NotFound";
import OAuthConsent from "./pages/OAuthConsent";
import Connect from "./pages/Connect";

import SheetDetail from "./pages/SheetDetail";

// Library Pages
import PositionResources from "./pages/library/PositionResources";
import PositionDetail from "./pages/library/PositionDetail";
import CompanyResources from "./pages/library/CompanyResources";
import CompanyDetail from "./pages/library/CompanyDetail";
import MassRecruitment from "./pages/library/MassRecruitment";
import InterviewQuestions from "./pages/library/InterviewQuestions";
import DSAQuestions from "./pages/library/DSAQuestions";
import SQLQuestions from "./pages/library/SQLQuestions";
import AptitudeQuestions from "./pages/library/AptitudeQuestions";
import CoreCSSubjects from "./pages/library/CoreCSSubjects";
import HandwrittenNotes from "./pages/library/HandwrittenNotes";
import Quiz from "./pages/library/Quiz";
import QuizHistory from "./pages/library/QuizHistory";
import CodingProblems from "./pages/library/CodingProblems";
import CodingProblemDetail from "./pages/library/CodingProblemDetail";
import RunHistory from "./pages/library/RunHistory";

// Fundamentals Pages
import Language from "./pages/fundamentals/Language";
import OOPsConcepts from "./pages/fundamentals/OOPsConcepts";
import FundamentalsOverview from "./pages/fundamentals/Overview";

// System Design Pages
import HighLevelDesign from "./pages/system-design/HighLevelDesign";
import LowLevelDesign from "./pages/system-design/LowLevelDesign";
import SystemDesignOverview from "./pages/system-design/SystemDesignOverview";

// Research Pages
import ResearchOverview from "./pages/research/Overview";
import JobPortals from "./pages/research/JobPortals";
import ResumeTemplates from "./pages/research/ResumeTemplates";
import ResumeAnalyser from "./pages/research/ResumeAnalyser";
import ColdOutreach from "./pages/research/ColdOutreach";
import MyActivity from "./pages/research/MyActivity";

import PublicProfile from "./pages/PublicProfile";
import ContestNotifier from "./pages/ContestNotifier";
import { ProfileRailLayout } from "./components/profile/ProfileRailLayout";

import { AdminRoute } from "@/components/AdminRoute";
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AdminShell } from "./components/admin/AdminShell";
import AdminProblemsList from "./pages/admin/AdminProblemsList";
import PublishHistory from "./pages/admin/PublishHistory";
import ProblemEditor from "./pages/admin/ProblemEditor";
import BulkImport from "./pages/admin/BulkImport";

import AdminUsers from "./pages/admin/AdminUsers";

import SupportInbox from "./pages/admin/SupportInbox";

import AiInsightFeedback from "./pages/admin/AiInsightFeedback";

import LeadsInbox from "./pages/admin/LeadsInbox";

import SharedFolder from "./pages/SharedFolder";
import PublicSheetShare from "./pages/PublicSheetShare";
import Achievements from "./pages/Achievements";
import NotificationCenter from "./pages/NotificationCenter";
import NotificationPreferences from "./pages/NotificationPreferences";

import AdminBlogList from "./pages/admin/blog/AdminBlogList";
import AdminBlogEditor from "./pages/admin/blog/AdminBlogEditor";
import AdminBlogComments from "./pages/admin/blog/AdminBlogComments";
import AdminBlogAudit from "./pages/admin/blog/AdminBlogAudit";
import AdminBlogRevisions from "./pages/admin/blog/AdminBlogRevisions";
import AdminJobs from "./pages/admin/AdminJobs";
import AdminContests from "./pages/admin/AdminContests";
import ContestProblemsEditor from "./pages/admin/ContestProblemsEditor";
import Jobs from "./pages/Jobs";
import Roadmaps from "./pages/Roadmaps";
import RoadmapDetail from "./pages/RoadmapDetail";
import JobDetail from "./pages/JobDetail";
import JobsOrDetailDispatcher, { LegacyCategoryRedirect } from "./pages/JobsOrDetail";
import JobApply from "./pages/JobApply";
import BlogIndex from "./pages/blog/BlogIndex";
import BlogPost from "./pages/blog/BlogPost";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: "always",
      retry: 1,
    },
  },
});

const PublicDashboardWrapper = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);

// Shared theme wrapper for every /learn/* route. Forces homepage deep-black
// (#030305) + amber/orange palette via the `learn-dark-surface` token block
// in index.css so nested pages can't drift from the LearnHub theme.
const LearnThemeLayout = () => (
  <div className="learn-dark-surface dark relative min-h-screen bg-background text-foreground">
    <Outlet />
  </div>
);

const LearnDashboardWrapper = () => (
  <DashboardLayout>
    <Outlet />
  </DashboardLayout>
);

// Dedicated theme shell for /contests/* — keeps deep-black + amber palette
// but isolates it from LearnThemeLayout so contest pages can evolve
// independently without inheriting learn-hub-specific styles.
const ContestThemeLayout = () => (
  <div className="contest-dark-surface dark relative min-h-screen bg-background text-foreground">
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  </div>
);


const ProtectedDashboardWrapper = () => (
  <ProtectedRoute requireOnboarding>
    <DashboardLayout>
      <Outlet />
    </DashboardLayout>
  </ProtectedRoute>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        <AuthProvider>
          <PushNotificationProvider>
          <FaviconNotificationProvider>
          <AchievementNotificationProvider>
          <LevelUpProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <RouteRestorer />
              <CrossTabAuthSync />
              <RouteSeo />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dev/topic-palette" element={<TopicPalettePreview />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/auth" element={<Navigate to="/login" replace />} />
                <Route path="/auth/*" element={<Navigate to="/login" replace />} />
                <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
                <Route path="/connect" element={<Connect />} />

                <Route path="/shared/:shareCode" element={<SharedFolder />} />
                <Route path="/share/sheet/:token" element={<PublicSheetShare />} />
                <Route
                  path="/onboarding"
                  element={
                    <ProtectedRoute>
                      <Onboarding />
                    </ProtectedRoute>
                  }
                />

                {/* All /learn/* routes share the LearnTheme wrapper so the
                    deep-black + amber/orange palette can't drift per-page. */}
                <Route path="/learn" element={<LearnThemeLayout />}>
                  <Route element={<LearnHub />}>
                    <Route index element={null} />
                    <Route path="sheets/:sheetId" element={<SheetDetail />} />
                  </Route>
                  <Route element={<LearnDashboardWrapper />}>
                    <Route path="achievements" element={<ProtectedRoute requireOnboarding><Achievements /></ProtectedRoute>} />
                    <Route path="notifications" element={<ProtectedRoute requireOnboarding><NotificationCenter /></ProtectedRoute>} />
                    <Route path="notifications/preferences" element={<ProtectedRoute requireOnboarding><NotificationPreferences /></ProtectedRoute>} />
                    <Route path="sheets" element={<Navigate to="/learn" replace />} />
                    <Route path="dsa-studio" element={<DsaStudio />} />
                    <Route path="dsa-studio/problems" element={<DsaStudio />} />
                    <Route path="dsa-studio/patterns" element={<DsaStudioPatternsPage />} />
                    <Route path="dsa-studio/tricks" element={<DsaStudioTricksPage />} />
                    <Route path="dsa-studio/edge" element={<DsaStudioEdgePage />} />
                    <Route path="dsa-tracker" element={<DsaStudioJournalPage />} />
                    <Route path="dsa-studio/journal" element={<Navigate to="/learn/dsa-tracker" replace />} />
                    <Route path="dsa-roadmap" element={<Navigate to="/roadmaps/complete-dsa-roadmap" replace />} />
                    <Route path="dsa-studio/pattern/:patternId" element={<DsaStudioPattern />} />
                    <Route path="dsa-studio/:slug" element={<DsaStudioProblem />} />
                    <Route path="leaderboard" element={<Leaderboard />} />
                    
                    <Route path="playground" element={<CodePlayground />} />
                    <Route path="visualize" element={<VisualizeHub />} />
                    <Route path="visualize/algo/:algoId" element={<VisualizePlayer />} />
                    <Route path="visualize/:trackId" element={<VisualizeTrack />} />
                  </Route>
                </Route>


                {/* Retired Matrix Overview — redirect legacy /dashboard/* to /learn */}
                <Route path="/dashboard" element={<Navigate to="/learn" replace />} />
                <Route path="/dashboard/*" element={<Navigate to="/learn" replace />} />

                {/* Public profile */}
                <Route
                  path="/u/:username"
                  element={
                    <ProfileRailLayout>
                      <PublicProfile />
                    </ProfileRailLayout>
                  }
                />

                {/* Library routes - public */}
                <Route path="/library" element={<PublicDashboardWrapper />}>
                  <Route path="positions" element={<PositionResources />} />
                  <Route path="positions/:roleId" element={<PositionDetail />} />
                  <Route path="companies" element={<CompanyResources />} />
                  <Route path="companies/:companyId" element={<CompanyDetail />} />
                  <Route path="recruitment" element={<MassRecruitment />} />
                  <Route path="interview" element={<InterviewQuestions />} />
                  <Route path="dsa" element={<DSAQuestions />} />
                  <Route path="sql" element={<SQLQuestions />} />
                  <Route path="aptitude" element={<AptitudeQuestions />} />
                  <Route path="cs" element={<CoreCSSubjects />} />
                  <Route path="notes" element={<HandwrittenNotes />} />
                  <Route path="quiz" element={<Quiz />} />
                  <Route path="quiz-history" element={<QuizHistory />} />
                  <Route path="problems" element={<CodingProblems />} />
                  <Route path="problems/:slug" element={<CodingProblemDetail />} />
                  <Route path="runs" element={<RunHistory />} />
                </Route>

                {/* Retired routes — redirect to /learn */}
                <Route path="/contests" element={<ContestThemeLayout />}>
                  <Route index element={<WeeklyContests />} />
                  <Route path="weekly" element={<Navigate to="/contests" replace />} />
                  <Route path="ratings" element={<ContestRatings />} />
                  <Route path=":slug" element={<ContestDetails />} />
                  <Route path="*" element={<Navigate to="/contests" replace />} />
                </Route>
                <Route path="/arena/*" element={<Navigate to="/learn" replace />} />
                <Route path="/experiences/*" element={<Navigate to="/learn" replace />} />
                <Route path="/mock-interview/*" element={<Navigate to="/learn" replace />} />
                <Route path="/platform/*" element={<Navigate to="/learn" replace />} />
                <Route path="/library/problems/weekly" element={<Navigate to="/library/problems" replace />} />
                <Route path="/library/problems/leaderboard" element={<Navigate to="/library/problems" replace />} />

                {/* Fundamentals routes - public */}
                <Route path="/fundamentals" element={<PublicDashboardWrapper />}>
                  <Route index element={<FundamentalsOverview />} />
                  <Route path="overview" element={<FundamentalsOverview />} />
                  <Route path="language" element={<Language />} />
                  <Route path="oops" element={<OOPsConcepts />} />
                </Route>

                {/* System Design routes - public */}
                <Route path="/system-design" element={<PublicDashboardWrapper />}>
                  <Route index element={<SystemDesignOverview />} />
                  <Route path="overview" element={<SystemDesignOverview />} />
                  <Route path="hld" element={<HighLevelDesign />} />
                  <Route path="lld" element={<LowLevelDesign />} />
                </Route>

                {/* Research routes */}
                <Route path="/research" element={<PublicDashboardWrapper />}>
                  <Route index element={<ResearchOverview />} />
                  <Route path="overview" element={<ResearchOverview />} />
                  <Route path="jobs" element={<JobPortals />} />
                  <Route path="resume" element={<ResumeTemplates />} />
                  <Route path="analyser" element={<ResumeAnalyser />} />
                  <Route path="outreach" element={<ColdOutreach />} />
                </Route>
                <Route path="/research" element={<ProtectedDashboardWrapper />}>
                  <Route path="activity" element={<MyActivity />} />
                </Route>

                {/* Blog - public */}
                <Route path="/blog" element={<PublicDashboardWrapper />}>
                  <Route index element={<BlogIndex />} />
                  <Route path=":slug" element={<BlogPost />} />
                  <Route path=":category/:slug" element={<BlogPost />} />
                </Route>

                {/* Jobs - public */}
                <Route path="/jobs" element={<PublicDashboardWrapper />}>
                  <Route index element={<Jobs />} />
                  {/* Single param disambiguates category vs job detail: job
                      slugs always end with a UUID; anything else falls back
                      to the category view (unknown = show all). */}
                  <Route path=":categoryOrSlug" element={<JobsOrDetailDispatcher />} />
                  <Route path=":categoryOrSlug/apply" element={<JobApply />} />
                  {/* Legacy path — 308-equivalent redirect via component */}
                  <Route path="category/:categorySlug" element={<LegacyCategoryRedirect />} />
                </Route>

                {/* Contest Notifier - public */}
                <Route path="/contest-notifier" element={<PublicDashboardWrapper />}>
                  <Route index element={<ContestNotifier />} />
                </Route>

                {/* Roadmaps - public */}
                <Route path="/roadmaps" element={<PublicDashboardWrapper />}>
                  <Route index element={<Roadmaps />} />
                  <Route path=":slug" element={<RoadmapDetail />} />
                </Route>

                {/* Settings */}
                <Route
                  path="/settings"
                  element={
                    <DashboardLayout>
                      <Settings />
                    </DashboardLayout>
                  }
                />

                {/* Admin routes */}
                <Route
                  path="/admin"
                  element={
                    <AdminRoute>
                      <AdminShell />
                    </AdminRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="problems" element={<AdminProblemsList />} />
                  <Route path="problems/new" element={<ProblemEditor />} />
                  <Route path="problems/import" element={<BulkImport />} />
                  <Route path="problems/:slug/edit" element={<ProblemEditor />} />
                  <Route path="problems/publish-history" element={<PublishHistory />} />

                  <Route path="users" element={<AdminUsers />} />

                  <Route path="support" element={<SupportInbox />} />
                  <Route path="ai-insight-feedback" element={<AiInsightFeedback />} />

                  <Route path="leads" element={<LeadsInbox />} />

                  <Route path="blog" element={<AdminBlogList />} />
                  <Route path="blog/new" element={<AdminBlogEditor />} />
                  <Route path="blog/:id/edit" element={<AdminBlogEditor />} />
                  <Route path="blog/:id/revisions" element={<AdminBlogRevisions />} />
                  <Route path="blog/comments" element={<AdminBlogComments />} />
                  <Route path="blog/audit" element={<AdminBlogAudit />} />

                  <Route path="jobs" element={<AdminJobs />} />
                  <Route path="contests" element={<AdminContests />} />
                  <Route path="contests/:id" element={<ContestProblemsEditor />} />
                </Route>

                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
          </LevelUpProvider>
          </AchievementNotificationProvider>
          </FaviconNotificationProvider>
          </PushNotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
