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
import ComponentsPage from "./pages/ComponentsPage";
import PublicListPage from "./pages/PublicListPage";
import AdminPage from "./pages/AdminPage";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";

function App() {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  // Handle public list routes first
  if (window.location.pathname.startsWith('/lists/')) {
    const listId = window.location.pathname.split('/')[2];
    if (listId) {
      return (
        <QueryClientProvider client={queryClient}>
          <PublicListPage params={{ id: listId }} />
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
      <div className="min-h-screen bg-background">
        <main className="min-h-screen">
          <Switch>
            {!user && <Route path="/" component={HomePage} />}
            {user ? (
              <>
                <Route path="/" component={MatchmakerPage} />
                <Route path="/matchmaker" component={MatchmakerPage} />
                <Route path="/directory" component={DirectoryPage} />
                <Route path="/designer/:id" component={DesignerDetailsPage} />
                <Route path="/lists" component={ListsPage} />
                <Route path="/components" component={ComponentsPage} />
                {user.isAdmin && <Route path="/admin" component={AdminPage} />}
              </>
            ) : (
              <Route path="*" component={HomePage} />
            )}
          </Switch>
        </main>
        <Toaster />
      </div>
    </QueryClientProvider>
  );
}

export default App;