import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "./components/Navigation";
import MobileBottomNav from "./components/MobileBottomNav";
import CommandPalette from "./components/CommandPalette";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";
import Footer from "./components/Footer";
import OnboardingProvider from "./components/OnboardingProvider";
import { useQuery } from "@tanstack/react-query";
import { lazy, Suspense, useEffect, useState } from "react";

// Eager-loaded pages (critical path)
import HomePage from "./pages/HomePage";
import RegisterPage from "./pages/RegisterPage";

// Lazy-loaded pages for better initial bundle size
const DirectoryPage = lazy(() => import("./pages/DirectoryPage"));
const DesignerDetailsPage = lazy(() => import("./pages/DesignerDetailsPage"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));
const ListsPage = lazy(() => import("./pages/ListsPage"));
const MatchmakerPage = lazy(() => import("./pages/MatchmakerPage"));
const HiringPage = lazy(() => import("./pages/HiringPage"));
const FeedbackAnalyticsPage = lazy(() => import("./pages/FeedbackAnalyticsPage"));
const InboxPage = lazy(() => import("./pages/InboxPage"));
const ComponentsPage = lazy(() => import("./pages/ComponentsPage"));
const PublicListPage = lazy(() => import("./pages/PublicListPage"));
const PublicPortfolioPage = lazy(() => import("./pages/PublicPortfolioPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const WorkspacePage = lazy(() => import("./pages/WorkspacePage"));
const WorkspaceMembersPage = lazy(() => import("./pages/WorkspaceMembersPage"));
const InvitePage = lazy(() => import("./pages/InvitePage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const ApiTokensPage = lazy(() => import("./pages/ApiTokensPage"));
const RecommendationsPage = lazy(() => import("./pages/RecommendationsPage"));
const EmailListPage = lazy(() => import("./pages/EmailListPage"));
const DocsPage = lazy(() => import("./pages/DocsPage"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}

// Command Palette wrapper that extracts workspace slug from URL
function CommandPaletteWrapper() {
  const [location] = useLocation();
  const { user } = useUser();
  
  const { data: workspaces } = useQuery<Array<{ slug: string }>>({
    queryKey: ["/api/workspaces"],
    enabled: !!user,
  });

  if (!user || !workspaces?.length) return null;

  const currentWorkspaceSlug = location.split('/')[1] || workspaces[0]?.slug;
  const validWorkspace = workspaces.find((w) => w.slug === currentWorkspaceSlug);
  const workspaceSlug = validWorkspace?.slug || workspaces[0]?.slug;

  if (!workspaceSlug) return null;

  return <CommandPalette workspaceSlug={workspaceSlug} />;
}

// Component to handle default route redirection based on user role
function DefaultRoute() {
  const [, setLocation] = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  const { data: workspaces, isLoading } = useQuery<Array<{ slug: string; role: string }>>({
    queryKey: ['/api/workspaces'],
  });

  useEffect(() => {
    if (!isLoading && workspaces && workspaces.length > 0 && !hasRedirected) {
      // Sort workspaces by role priority: owner > admin > editor > member
      const roleOrder: Record<string, number> = { 'owner': 4, 'admin': 3, 'editor': 2, 'member': 1 };
      const sortedWorkspaces = [...workspaces].sort((a, b) => {
        const roleA = roleOrder[a.role] || 0;
        const roleB = roleOrder[b.role] || 0;
        return roleB - roleA;
      });

      const defaultWorkspace = sortedWorkspaces[0];
      const canEdit = ['owner', 'admin', 'editor'].includes(defaultWorkspace.role);
      
      // Redirect to home for users who can edit, directory for view-only
      const targetPath = canEdit 
        ? `/${defaultWorkspace.slug}/home` 
        : `/${defaultWorkspace.slug}/directory`;
      
      setHasRedirected(true);
      setLocation(targetPath);
    }
  }, [workspaces, isLoading, hasRedirected, setLocation]);

  // Show loading only while fetching, then nothing after redirect
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // After redirect or if no workspaces, render nothing
  return null;
}

function App() {
  const { user, isLoading } = useUser();
  const [location, setLocation] = useLocation();

  // Handle public routes first
  if (window.location.pathname.startsWith('/lists/')) {
    const slugOrId = window.location.pathname.split('/')[2];
    if (slugOrId) {
      return (
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<PageLoader />}>
            <div className="min-h-screen flex flex-col">
              <div className="flex-1">
                <PublicListPage params={{ slugOrId }} />
              </div>
              <Footer />
            </div>
          </Suspense>
          <Toaster />
        </QueryClientProvider>
      );
    }
  }

  // Handle public docs routes (window.location is reliable for direct navigation)
  console.log('APP RENDER — pathname:', window.location.pathname, '| href:', window.location.href, '| wouter location:', location);
  if (window.location.pathname === '/docs/mcp' || window.location.pathname === '/docs/mcp/') {
    return (
      <Suspense fallback={<PageLoader />}>
        <DocsPage />
      </Suspense>
    );
  }
  if (window.location.pathname === '/docs' || window.location.pathname === '/docs/') {
    window.location.replace('/docs/mcp');
    return null;
  }

  // Handle public portfolio routes
  if (window.location.pathname.startsWith('/portfolio/')) {
    const portfolioSlug = window.location.pathname.split('/')[2];
    if (portfolioSlug) {
      return (
        <QueryClientProvider client={queryClient}>
          <Suspense fallback={<PageLoader />}>
            <PublicPortfolioPage />
          </Suspense>
          <Toaster />
        </QueryClientProvider>
      );
    }
  }

  // For all other routes
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <OnboardingProvider>
        <CommandPaletteWrapper />
        <div className="min-h-screen flex flex-col pb-16 md:pb-0">
          {location !== '/docs/mcp' && <Navigation />}
          <main className="flex-1">
            <Suspense fallback={<PageLoader />}>
              <Switch>
                <Route path="/docs/mcp" component={DocsPage} />
                <Route path="/docs">{() => { window.location.replace('/docs/mcp'); return null; }}</Route>
                {!user && <Route path="/" component={HomePage} />}
                <Route path="/register" component={RegisterPage} />
                <Route path="/invite/:token" component={InvitePage} />
                {user ? (
                  <>
                    <Route path="/" component={DefaultRoute} />
                    <Route path="/profile" component={ProfilePage} />
                    <Route path="/workspaces" component={WorkspacePage} />
                    <Route path="/workspaces/members" component={WorkspaceMembersPage} />
                    <Route path="/components" component={ComponentsPage} />
                    {user.isAdmin && <Route path="/admin" component={AdminPage} />}
                    
                    {/* Legacy routes for backward compatibility */}
                    <Route path="/designer/:slug" component={DesignerDetailsPage} />
                    <Route path="/designers/:id" component={DesignerDetailsPage} />
                    
                    {/* Workspace-specific routes */}
                    <Route path="/:workspaceSlug" component={RecommendationsPage} />
                    <Route path="/:workspaceSlug/directory" component={DirectoryPage} />
                    <Route path="/:workspaceSlug/directory/:slug" component={DesignerDetailsPage} />
                    <Route path="/:workspaceSlug/search" component={SearchResultsPage} />
                    <Route path="/:workspaceSlug/lists/:listSlug/email" component={EmailListPage} />
                    <Route path="/:workspaceSlug/lists/:listSlug" component={ListsPage} />
                    <Route path="/:workspaceSlug/lists" component={ListsPage} />
                    <Route path="/:workspaceSlug/inbox" component={InboxPage} />
                    <Route path="/:workspaceSlug/home" component={RecommendationsPage} />
                    <Route path="/:workspaceSlug/matchmaker" component={MatchmakerPage} />
                    <Route path="/:workspaceSlug/hiring" component={HiringPage} />
                    <Route path="/:workspaceSlug/activity" component={ActivityPage} />
                    <Route path="/:workspaceSlug/api-tokens" component={ApiTokensPage} />
                    <Route path="/:workspaceSlug/feedback-analytics" component={FeedbackAnalyticsPage} />
                  </>
                ) : (
                  <Route path="*" component={HomePage} />
                )}
              </Switch>
            </Suspense>
          </main>
          {location !== '/docs/mcp' && <Footer />}
          {user && location !== '/docs/mcp' && <MobileBottomNav />}
          <Toaster />
        </div>
      </OnboardingProvider>
    </QueryClientProvider>
  );
}

export default App;