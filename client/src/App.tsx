import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import Navigation from "./components/Navigation";
import HomePage from "./pages/HomePage";
import DirectoryPage from "./pages/DirectoryPage";
import ListsPage from "./pages/ListsPage";
import MatchmakerPage from "./pages/MatchmakerPage";
import PublicListPage from "./pages/PublicListPage";
import AuthPage from "./pages/AuthPage";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";

function App() {
  const { user, isLoading } = useUser();

  return (
    <div className="min-h-screen bg-background">
      {user && <Navigation />}
      <main className={`${user ? 'container mx-auto px-4 py-8' : ''}`}>
        <Switch>
          {!user ? (
            <>
              <Route path="/lists/:id" component={PublicListPage} />
              <Route component={AuthPage} />
            </>
          ) : (
            <>
              <Route path="/" component={HomePage} />
              <Route path="/directory" component={DirectoryPage} />
              <Route path="/lists" component={ListsPage} />
              <Route path="/lists/:id" component={PublicListPage} />
              <Route path="/matchmaker" component={MatchmakerPage} />
              <Route>
                {() => (
                  <div className="flex items-center justify-center min-h-[50vh]">
                    <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
                  </div>
                )}
              </Route>
            </>
          )}
        </Switch>
      </main>
      <Toaster />
    </div>
  );
}

export default App;