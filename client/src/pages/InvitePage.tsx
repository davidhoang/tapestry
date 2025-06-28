import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Mail, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/hooks/use-user";

interface InvitationData {
  id: number;
  email: string;
  role: string;
  workspace: {
    id: number;
    name: string;
    description: string;
  };
  invitedBy: string;
  expiresAt: string;
}

export default function InvitePage() {
  const [, params] = useRoute("/invite/:token");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading: userLoading } = useUser();
  const [needsAuth, setNeedsAuth] = useState(false);

  const token = params?.token;

  // Fetch invitation details
  const { data: invitation, error: invitationError, isLoading: invitationLoading } = useQuery({
    queryKey: ["/api/invitations", token],
    queryFn: async () => {
      if (!token) throw new Error("No invitation token provided");
      const response = await fetch(`/api/invitations/${token}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load invitation");
      }
      return response.json() as Promise<InvitationData>;
    },
    enabled: !!token,
  });

  // Accept invitation mutation
  const acceptInvitation = useMutation({
    mutationFn: async () => {
      if (!token) throw new Error("No invitation token");
      const response = await fetch(`/api/invitations/${token}/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invitation");
      }
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Invitation accepted!",
        description: `You've successfully joined ${data.workspace.name}`,
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Failed to accept invitation",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Check if user needs to authenticate
  useEffect(() => {
    if (!userLoading && !user && invitation) {
      setNeedsAuth(true);
    }
  }, [user, userLoading, invitation]);

  // Handle authentication redirect
  const handleAuthRedirect = () => {
    // Store invitation token for after registration
    localStorage.setItem('pendingInvitation', token || '');
    setLocation(`/register?email=${encodeURIComponent(invitation?.email || '')}`);
  };

  // Check for pending invitation after login
  useEffect(() => {
    const pendingToken = localStorage.getItem('pendingInvitation');
    if (user && pendingToken && pendingToken === token) {
      localStorage.removeItem('pendingInvitation');
      // Auto-accept if user just registered/logged in
      if (invitation && user.email === invitation.email) {
        acceptInvitation.mutate();
      }
    }
  }, [user, token, invitation]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid or incomplete.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (invitationLoading || userLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading invitation...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (invitationError || !invitation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle>Invitation Not Found</CardTitle>
            <CardDescription>
              {invitationError?.message || "This invitation may have expired or already been accepted."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button onClick={() => setLocation("/")} variant="outline">
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if invitation is for current user
  const isWrongUser = user && user.email !== invitation.email;

  if (needsAuth || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle>Join {invitation.workspace.name}</CardTitle>
            <CardDescription>
              You've been invited to join this workspace as a {invitation.role}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h3 className="font-medium text-sm mb-2">Workspace Details</h3>
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Name:</strong> {invitation.workspace.name}
              </p>
              {invitation.workspace.description && (
                <p className="text-sm text-muted-foreground mb-1">
                  <strong>Description:</strong> {invitation.workspace.description}
                </p>
              )}
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Invited by:</strong> {invitation.invitedBy}
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>Your role:</strong> {invitation.role}
              </p>
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You need to create an account or sign in to accept this invitation.
                The invitation is for: <strong>{invitation.email}</strong>
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Button onClick={handleAuthRedirect} className="w-full">
                Create Account / Sign In
              </Button>
              <Button onClick={() => setLocation("/")} variant="outline" className="w-full">
                Not interested
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isWrongUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <CardTitle>Wrong Account</CardTitle>
            <CardDescription>
              This invitation is for {invitation.email}, but you're signed in as {user.email}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-sm text-muted-foreground">
              Please sign in with the correct account to accept this invitation.
            </p>
            <div className="space-y-2">
              <Button onClick={() => setLocation("/auth")} className="w-full">
                Sign in with different account
              </Button>
              <Button onClick={() => setLocation("/")} variant="outline" className="w-full">
                Go to homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Users className="h-12 w-12 text-primary mx-auto mb-4" />
          <CardTitle>Accept Invitation</CardTitle>
          <CardDescription>
            You've been invited to join {invitation.workspace.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg">
            <h3 className="font-medium text-sm mb-2">Workspace Details</h3>
            <p className="text-sm text-muted-foreground mb-1">
              <strong>Name:</strong> {invitation.workspace.name}
            </p>
            {invitation.workspace.description && (
              <p className="text-sm text-muted-foreground mb-1">
                <strong>Description:</strong> {invitation.workspace.description}
              </p>
            )}
            <p className="text-sm text-muted-foreground mb-1">
              <strong>Invited by:</strong> {invitation.invitedBy}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>Your role:</strong> {invitation.role}
            </p>
          </div>

          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              You're signed in as <strong>{user.email}</strong>. Ready to join this workspace!
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Button 
              onClick={() => acceptInvitation.mutate()} 
              className="w-full"
              disabled={acceptInvitation.isPending}
            >
              {acceptInvitation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting invitation...
                </>
              ) : (
                "Accept Invitation"
              )}
            </Button>
            <Button onClick={() => setLocation("/")} variant="outline" className="w-full">
              Decline
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Expires on {new Date(invitation.expiresAt).toLocaleDateString()}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}