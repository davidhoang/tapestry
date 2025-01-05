import { Link, useLocation } from "wouter";
import { useUser } from "../hooks/use-user";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { UserCircle } from "lucide-react";
import { useState } from "react";
import AuthPage from "../pages/AuthPage";

export default function Navigation() {
  const [location] = useLocation();
  const { user, logout } = useUser();
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center px-4">
        <div className="mr-4 flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold">Design Matchmaker</span>
          </Link>
          {user && (
            <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
              <Link
                href="/directory"
                className={location === "/directory" ? "text-primary" : "text-foreground/60 hover:text-foreground/80 transition-colors"}
              >
                Directory
              </Link>
              <Link
                href="/lists"
                className={location === "/lists" ? "text-primary" : "text-foreground/60 hover:text-foreground/80 transition-colors"}
              >
                Lists
              </Link>
              <Link
                href="/matchmaker"
                className={location === "/matchmaker" ? "text-primary" : "text-foreground/60 hover:text-foreground/80 transition-colors"}
              >
                AI Matchmaker
              </Link>
            </div>
          )}
        </div>
        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <UserCircle className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => logout()}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setShowAuthDialog(true)}>
                Sign in
              </Button>
              <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
                <DialogContent className="max-w-sm p-0">
                  <AuthPage />
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}