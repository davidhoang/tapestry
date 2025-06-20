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
import MatchmakerChatPage from "./pages/MatchmakerChatPage";
import ComponentsPage from "./pages/ComponentsPage";
import PublicListPage from "./pages/PublicListPage";
import AdminPage from "./pages/AdminPage";
import ProfilePage from "./pages/ProfilePage";
import RegisterPage from "./pages/RegisterPage";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";
import Footer from "./components/Footer";
import OnboardingProvider from "./components/OnboardingProvider";

function App() {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  // Handle public list routes first
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
          <main className="flex-1">
            <Switch>
              {!user && <Route path="/" component={HomePage} />}
              <Route path="/register" component={RegisterPage} />
              {user ? (
                <>
                  <Route path="/" component={MatchmakerPage} />
                  <Route path="/matchmaker" component={MatchmakerPage} />
          <Route path="/chat" component={MatchmakerChatPage} />
                  <Route path="/directory" component={DirectoryPage} />
                  <Route path="/designer/:slug" component={DesignerDetailsPage} />
                  <Route path="/lists" component={ListsPage} />
                  <Route path="/profile" component={ProfilePage} />
                  <Route path="/components" component={ComponentsPage} />
                  {user.isAdmin && <Route path="/admin" component={AdminPage} />}
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