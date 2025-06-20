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
import { UserCircle, Menu, X } from "lucide-react";
import { useState } from "react";
import AuthPage from "../pages/AuthPage";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-white/20 bg-black fixed top-0 left-0 right-0 z-50">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 mx-auto">
        <div className="flex items-center">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-white">Design Talent Match</span>
          </Link>
          {user && (
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/matchmaker"
                className={location === "/matchmaker" || location === "/" ? "text-white" : "text-white/60 hover:text-white/80 transition-colors"}
              >
                Matchmaker
              </Link>
              <Link
                href="/directory"
                className={location === "/directory" ? "text-white" : "text-white/60 hover:text-white/80 transition-colors"}
              >
                Directory
              </Link>
              <Link
                href="/lists"
                className={location === "/lists" ? "text-white" : "text-white/60 hover:text-white/80 transition-colors"}
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
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                    <UserCircle className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/components" className="flex items-center w-full">
                      Components
                    </Link>
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin" className="flex items-center w-full">
                        Database Admin
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onSelect={() => logout()}>
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button variant="default" onClick={() => setShowAuthDialog(true)} className="bg-white text-black hover:bg-gray-100 border-none transition-colors">
                Sign in
              </Button>
            )}
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-black border-white/20">
                <div className="flex flex-col space-y-4 mt-6">
                  {user ? (
                    <>
                      <Link
                        href="/matchmaker"
                        className={`text-lg py-2 px-4 rounded transition-colors ${
                          location === "/matchmaker" || location === "/" 
                            ? "text-white bg-white/10" 
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Matchmaker
                      </Link>
                      <Link
                        href="/directory"
                        className={`text-lg py-2 px-4 rounded transition-colors ${
                          location === "/directory" 
                            ? "text-white bg-white/10" 
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Directory
                      </Link>
                      <Link
                        href="/lists"
                        className={`text-lg py-2 px-4 rounded transition-colors ${
                          location === "/lists" 
                            ? "text-white bg-white/10" 
                            : "text-white/60 hover:text-white hover:bg-white/5"
                        }`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Lists
                      </Link>
                      <Link
                        href="/components"
                        className="text-white/60 hover:text-white hover:bg-white/5 text-lg py-2 px-4 rounded transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Components
                      </Link>
                      {user.isAdmin && (
                        <Link
                          href="/admin"
                          className="text-white/60 hover:text-white hover:bg-white/5 text-lg py-2 px-4 rounded transition-colors"
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
                        className="text-white/60 hover:text-white hover:bg-white/5 text-lg py-2 px-4 rounded transition-colors justify-start"
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
                      className="bg-white text-black hover:bg-gray-100 border-none text-lg py-2 px-4 rounded justify-start transition-colors"
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
          <AuthPage />
        </DialogContent>
      </Dialog>
    </nav>
  );
}