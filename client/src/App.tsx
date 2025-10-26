import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "./components/Navigation";
import HomePage from "./pages/HomePage";
import DirectoryPage from "./pages/DirectoryPage";
import DesignerDetailsPage from "./pages/DesignerDetailsPage";
import SearchResultsPage from "./pages/SearchResultsPage";
import ListsPage from "./pages/ListsPage";
import MatchmakerPage from "./pages/MatchmakerPage";
import HiringPage from "./pages/HiringPage";
import FeedbackAnalyticsPage from "./pages/FeedbackAnalyticsPage";
import InboxPage from "./pages/InboxPage";

import ComponentsPage from "./pages/ComponentsPage";
import PublicListPage from "./pages/PublicListPage";
import PublicPortfolioPage from "./pages/PublicPortfolioPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import WorkspacePage from "./pages/WorkspacePage";
import WorkspaceMembersPage from "./pages/WorkspaceMembersPage";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";
import Footer from "./components/Footer";
import OnboardingProvider from "./components/OnboardingProvider";
import InvitePage from "./pages/InvitePage";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

// Component to handle default route redirection based on user role
function DefaultRoute() {
  const [, setLocation] = useLocation();
  const [hasRedirected, setHasRedirected] = useState(false);
  
  const { data: workspaces, isLoading } = useQuery({
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
      
      // Redirect to inbox for users who can edit, directory for view-only
      const targetPath = canEdit 
        ? `/${defaultWorkspace.slug}/inbox` 
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
  const [, setLocation] = useLocation();

  // Handle public routes first
  if (window.location.pathname.startsWith('/lists/')) {
    const slugOrId = window.location.pathname.split('/')[2];
    if (slugOrId) {
      return (
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">
              <PublicListPage params={{ slugOrId }} />
            </div>
            <Footer />
          </div>
          <Toaster />
        </QueryClientProvider>
      );
    }
  }

  // Handle public portfolio routes
  if (window.location.pathname.startsWith('/portfolio/')) {
    const portfolioSlug = window.location.pathname.split('/')[2];
    if (portfolioSlug) {
      return (
        <QueryClientProvider client={queryClient}>
          <PublicPortfolioPage />
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
        <div className="min-h-screen flex flex-col">
          <Navigation />
          <main className="flex-1">
            <Switch>
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
                  <Route path="/:workspaceSlug" component={DirectoryPage} />
                  <Route path="/:workspaceSlug/directory" component={DirectoryPage} />
                  <Route path="/:workspaceSlug/directory/:slug" component={DesignerDetailsPage} />
                  <Route path="/:workspaceSlug/search" component={SearchResultsPage} />
                  <Route path="/:workspaceSlug/lists" component={ListsPage} />
                  <Route path="/:workspaceSlug/inbox" component={InboxPage} />
                  <Route path="/:workspaceSlug/matchmaker" component={MatchmakerPage} />
                  <Route path="/:workspaceSlug/hiring" component={HiringPage} />
                  <Route path="/:workspaceSlug/feedback-analytics" component={FeedbackAnalyticsPage} />
                </>
              ) : (
                <Route path="*" component={HomePage} />
              )}
            </Switch>
          </main>
          <Footer />
          <Toaster />
        </div>
      </OnboardingProvider>
    </QueryClientProvider>
  );
}

export default App;