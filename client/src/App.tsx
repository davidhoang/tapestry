import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "./components/Navigation";
import HomePage from "./pages/HomePage";
import DirectoryPage from "./pages/DirectoryPage";
import DesignerDetailsPage from "./pages/DesignerDetailsPage";
import ListsPage from "./pages/ListsPage";
import MatchmakerPage from "./pages/MatchmakerPage";
import HiringPage from "./pages/HiringPage";
import FeedbackAnalyticsPage from "./pages/FeedbackAnalyticsPage";

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

function App() {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  // Handle public routes first
  if (window.location.pathname.startsWith('/lists/')) {
    const listId = window.location.pathname.split('/')[2];
    if (listId) {
      return (
        <QueryClientProvider client={queryClient}>
          <div className="min-h-screen flex flex-col">
            <div className="flex-1">
              <PublicListPage params={{ id: listId }} />
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
                  <Route path="/" component={MatchmakerPage} />
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
                  <Route path="/:workspaceSlug/lists" component={ListsPage} />
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