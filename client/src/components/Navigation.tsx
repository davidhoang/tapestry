import { Link, useLocation } from "wouter";
import { useUser } from "../hooks/use-user";
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
import { UserCircle, Menu, X, Settings, User } from "lucide-react";
import { useState } from "react";
import AuthPage from "../pages/AuthPage";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const getUserInitials = () => {
    if (!user) return 'U';
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    if (user.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <nav className="border-b border-gray-200 bg-nav-cream fixed top-0 left-0 right-0 z-50">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 mx-auto">
        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="text-xl font-extrabold text-gray-900 font-serif">Tapestry</span>
          </Link>
          {user && (
            <div className="hidden md:flex items-center space-x-6 text-sm font-semibold">
              <Link
                href="/matchmaker"
                className={location === "/matchmaker" || location === "/" ? "text-gray-900 font-bold" : "text-gray-600 hover:text-gray-900 transition-colors"}
              >
                Matchmaker
              </Link>
              <Link
                href="/directory"
                className={location === "/directory" ? "text-gray-900 font-bold" : "text-gray-600 hover:text-gray-900 transition-colors"}
              >
                Directory
              </Link>
              <Link
                href="/lists"
                className={location === "/lists" ? "text-gray-900 font-bold" : "text-gray-600 hover:text-gray-900 transition-colors"}
              >
                Lists
              </Link>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4 ml-auto">
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
                      {user.username && (
                        <p className="font-medium">{user.username}</p>
                      )}
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  <div className="border-t"></div>
                  <DropdownMenuItem asChild>
                    <Link href="/profile" className="flex items-center w-full">
                      <User className="mr-2 h-4 w-4" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/components" className="flex items-center w-full">
                        <Settings className="mr-2 h-4 w-4" />
                        Components
                      </Link>
                    </DropdownMenuItem>
                  )}
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center w-full">
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
                      <Link
                        href="/matchmaker"
                        className={`text-lg py-2 px-4 rounded transition-colors ${
                          location === "/matchmaker" || location === "/" 
                            ? "text-gray-900 bg-gray-100 font-bold" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-semibold"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Matchmaker
                      </Link>
                      <Link
                        href="/directory"
                        className={`text-lg py-2 px-4 rounded transition-colors ${
                          location === "/directory" 
                            ? "text-gray-900 bg-gray-100 font-bold" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-semibold"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Directory
                      </Link>
                      <Link
                        href="/lists"
                        className={`text-lg py-2 px-4 rounded transition-colors ${
                          location === "/lists" 
                            ? "text-gray-900 bg-gray-100 font-bold" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-semibold"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Lists
                      </Link>
                      <Link
                        href="/profile"
                        className={`text-lg py-2 px-4 rounded transition-colors ${
                          location === "/profile" 
                            ? "text-gray-900 bg-gray-100 font-bold" 
                            : "text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-semibold"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Profile Settings
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href="/components"
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 text-lg py-2 px-4 rounded transition-colors"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          Components
                        </Link>
                      )}
                      {user.isAdmin && (
                        <Link
                          href="/admin"
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

      {/* Auth Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-sm p-0">
          <DialogHeader>
            <VisuallyHidden>
              <DialogTitle>Authentication</DialogTitle>
              <DialogDescription>Sign in or create an account to access the application</DialogDescription>
            </VisuallyHidden>
          </DialogHeader>
          <AuthPage />
        </DialogContent>
      </Dialog>
    </nav>
  );
}