import { Link, useLocation } from "wouter";
import { useUser } from "../hooks/use-user";
import { useQuery } from "@tanstack/react-query";
import { useWorkspacePermissions } from "../hooks/use-permissions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserCircle, Menu, X, Settings, User, Users, Building2, Check } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import AuthPage from "../pages/AuthPage";
import WorkspaceSwitcher from "./WorkspaceSwitcher";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Handle workspace switching with visual feedback
  const handleWorkspaceSwitch = (workspace: any) => {
    const workspaceName = workspace.owner?.email === user?.email ? 'My Workspace' : workspace.name;
    
    // Clear all queries to force fresh data for new workspace
    queryClient.clear();
    
    toast({
      title: "Workspace switched",
      description: `Now viewing ${workspaceName}`,
      duration: 3000,
    });
  };

  // Listen for successful login to close modal
  useEffect(() => {
    const handleCloseAuthModal = () => {
      setShowAuthDialog(false);
    };

    window.addEventListener('closeAuthModal', handleCloseAuthModal);
    return () => window.removeEventListener('closeAuthModal', handleCloseAuthModal);
  }, []);

  // Auto-close modal when user becomes authenticated
  useEffect(() => {
    if (user && showAuthDialog) {
      setShowAuthDialog(false);
    }
  }, [user, showAuthDialog]);

  // Get user's workspace
  const { data: workspaces } = useQuery({
    queryKey: ["/api/workspaces"],
    queryFn: async () => {
      const response = await fetch("/api/workspaces");
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user,
  });

  // Get current workspace from URL path
  const currentWorkspaceSlug = location.split('/')[1] || "david-hoang";
  const userWorkspace = workspaces?.find(w => w.slug === currentWorkspaceSlug) || workspaces?.[0];
  const workspaceSlug = userWorkspace?.slug || "david-hoang";

  // Update permissions to use current workspace context
  const permissions = useWorkspacePermissions(workspaceSlug);

  const getUserInitials = () => {
    if (!user) return 'U';
    if (userWorkspace?.name) {
      return userWorkspace.name.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="border-b border-gray-200 bg-nav-cream fixed top-0 left-0 right-0 z-50">
      <div className="container flex h-16 max-w-screen-2xl items-center px-4 mx-auto">
        {/* Left: Logo + Navigation Links */}
        <div className="flex items-center">
          <Link to={user ? `/${workspaceSlug}/directory` : "/"} className="mr-6 flex items-center space-x-2">
            <span className="text-xl font-extrabold text-gray-900 font-serif">Tapestry</span>
          </Link>
          {user && (
            <div className="hidden md:flex items-center space-x-6 text-sm font-semibold">
              <Link
                to={`/${workspaceSlug}/matchmaker`}
                className={location === `/${workspaceSlug}/matchmaker` || location === "/" ? "text-gray-900 font-bold" : "text-gray-600 hover:text-gray-900 transition-colors"}
              >
                Matchmaker
              </Link>
              <Link
                to={`/${workspaceSlug}/directory`}
                className={location === `/${workspaceSlug}/directory` || location === `/${workspaceSlug}` ? "text-gray-900 font-bold" : "text-gray-600 hover:text-gray-900 transition-colors"}
              >
                Directory
              </Link>
              
              <Link
                to={`/${workspaceSlug}/lists`}
                className={location === `/${workspaceSlug}/lists` ? "text-gray-900 font-bold" : "text-gray-600 hover:text-gray-900 transition-colors"}
              >
                Lists
              </Link>
              {permissions.canAccessHiring && (
                <Link
                  to={`/${workspaceSlug}/hiring`}
                  className={location === `/${workspaceSlug}/hiring` ? "text-gray-900 font-bold" : "text-gray-600 hover:text-gray-900 transition-colors"}
                >
                  Hiring
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Center: Workspace Switcher */}
        <div className="flex-1 flex items-center justify-center">
          {user && <WorkspaceSwitcher />}
        </div>
        
        {/* Right: User Menu */}
        <div className="flex items-center space-x-4">
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={user.profilePhotoUrl || undefined} alt="Profile photo" />
                      <AvatarFallback className="text-xs">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="border-t"></div>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  {permissions?.canViewMembersList && (
                    <DropdownMenuItem asChild>
                      <Link to="/workspaces/members" className="flex items-center w-full">
                        <Users className="mr-2 h-4 w-4" />
                        Workspace Members
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/components" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Components
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Database Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <div className="border-t"></div>
                  <DropdownMenuItem onSelect={() => logout()}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" onClick={() => setShowAuthDialog(true)} className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                Sign in
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-gray-700 hover:bg-gray-100">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-nav-cream border-gray-200">
                <SheetHeader>
                  <VisuallyHidden>
                    <SheetTitle>Navigation Menu</SheetTitle>
                  </VisuallyHidden>
                </SheetHeader>
                <div className="flex flex-col space-y-4 mt-6">
                  {user ? (
                    <>
                      {/* Mobile Workspace Switcher */}
                      <div className="px-4 pb-2 border-b border-gray-200">
                        <WorkspaceSwitcher className="w-full" />
                      </div>
                      
                      <Link
                        to={`/${workspaceSlug}/matchmaker`}
                        className={`text-lg py-2 px-4 rounded transition-colors ${
                          location === `/${workspaceSlug}/matchmaker` || location === "/"
                            ? "text-gray-900 bg-gray-100 font-bold" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-semibold"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Matchmaker
                      </Link>
                      <Link
                        to={`/${workspaceSlug}/directory`}
                        className={`text-lg py-2 px-4 rounded transition-colors ${
                          location === `/${workspaceSlug}/directory` || location === `/${workspaceSlug}`
                            ? "text-gray-900 bg-gray-100 font-bold" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-semibold"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Directory
                      </Link>
                      {permissions.canViewLists && (
                        <Link
                          to={`/${workspaceSlug}/lists`}
                          className={`text-lg py-2 px-4 rounded transition-colors ${
                            location === `/${workspaceSlug}/lists`
                              ? "text-gray-900 bg-gray-100 font-bold" 
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-semibold"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Lists
                        </Link>
                      )}
                      {permissions.canAccessHiring && (
                        <Link
                          to={`/${workspaceSlug}/hiring`}
                          className={`text-lg py-2 px-4 rounded transition-colors ${
                            location === `/${workspaceSlug}/hiring`
                              ? "text-gray-900 bg-gray-100 font-bold" 
                              : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-semibold"
                          }`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Hiring
                        </Link>
                      )}
                      <Link
                        to="/profile"
                        className={`text-lg py-2 px-4 rounded transition-colors ${
                          location === "/profile" 
                            ? "text-gray-900 bg-gray-100 font-bold" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-semibold"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      {user.isAdmin && (
                        <Link
                          to="/components"
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-lg py-2 px-4 rounded transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Components
                        </Link>
                      )}
                      {user.isAdmin && (
                        <Link
                          to="/admin"
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-lg py-2 px-4 rounded transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Database Admin
                        </Link>
                      )}
                      <Button 
                        variant="ghost" 
                        onClick={() => {
                          logout();
                          setMobileMenuOpen(false);
                        }}
                        className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-lg py-2 px-4 rounded transition-colors justify-start"
                      >
                        Logout
                      </Button>
                    </>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowAuthDialog(true);
                        setMobileMenuOpen(false);
                      }} 
                      className="bg-primary text-primary-foreground hover:bg-primary/90 border-none text-lg py-2 px-4 rounded justify-start transition-colors"
                    >
                      Sign in
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>

      {/* 
        Auth Modal - WORKING IMPLEMENTATION 
        DO NOT MODIFY: This custom modal solution works reliably across all devices
        Uses inline styles in AuthPage to prevent CSS conflicts
        See replit.md for implementation details and maintenance guidelines
      */}
      {showAuthDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="relative p-6">
              <button
                onClick={() => setShowAuthDialog(false)}
                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
              <AuthPage />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}