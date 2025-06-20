import { useUser } from "@/hooks/use-user";
import { Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

interface AdminRouteProps {
  children: React.ReactNode;
}

export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Authentication Required</h1>
          <p className="text-muted-foreground">Please sign in to access this page.</p>
        </div>
        <Button asChild>
          <Link href="/auth">Sign In</Link>
        </Button>
      </div>
    );
  }

  if (!user.isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-6">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-muted-foreground">
            You don't have permission to access this page. This area is restricted to administrators only.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/">Go Home</Link>
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}