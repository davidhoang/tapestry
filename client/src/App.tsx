import { Switch, Route, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "./components/Navigation";
import HomePage from "./pages/HomePage";
import DirectoryPage from "./pages/DirectoryPage";
import ListsPage from "./pages/ListsPage";
import MatchmakerPage from "./pages/MatchmakerPage";
import PublicListPage from "./pages/PublicListPage";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";

function App() {
  const { user, isLoading } = useUser();
  const [, setLocation] = useLocation();

  // Handle public list routes first
  if (window.location.pathname.startsWith('/lists/')) {
    return (
      <QueryClientProvider client={queryClient}>
        <Navigation />
        <PublicListPage params={{ id: window.location.pathname.split('/')[2] }} />
        <Toaster />
      </QueryClientProvider>
    );
  }

  // For all other routes
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // If user is logged in and tries to access the homepage, redirect to directory
  if (user && window.location.pathname === '/') {
    setLocation('/directory');
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-8">
        <Switch>
          <Route path="/" component={HomePage} />
          {user && (
            <>
              <Route path="/directory" component={DirectoryPage} />
              <Route path="/lists" component={ListsPage} />
              <Route path="/matchmaker" component={MatchmakerPage} />
            </>
          )}
          <Route>
            {() => (
              <div className="flex items-center justify-center min-h-[50vh]">
                <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
              </div>
            )}
          </Route>
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

export default App;