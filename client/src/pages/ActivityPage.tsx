import Navigation from "@/components/Navigation";
import ActivityFeed from "@/components/ActivityFeed";
import { useLocation } from "wouter";

export default function ActivityPage() {
  const [location] = useLocation();
  const pathParts = location.split("/");
  const workspaceSlug = pathParts[1];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container max-w-3xl mx-auto px-4 pt-24 pb-12">
        <ActivityFeed workspaceSlug={workspaceSlug} />
      </main>
    </div>
  );
}
