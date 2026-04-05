import { AlertTriangle, Github, BookOpen, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { useUser } from "@/hooks/use-user";
import { Badge } from "@/components/ui/badge";

export default function Footer() {
  const { user } = useUser();

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Branding / About */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Tapestry</span>
              <Badge
                variant="outline"
                className="text-xs text-amber-600 dark:text-amber-400 border-amber-400/50 bg-amber-50 dark:bg-amber-950/30 flex items-center gap-1 px-1.5 py-0.5"
              >
                <AlertTriangle className="h-3 w-3" />
                Alpha
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Data may be wiped during development. Thank you for testing early.
            </p>
            <a
              href="https://www.proofofconcept.pub"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 w-fit"
            >
              A Proof of Concept experiment
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          {/* Product links — only shown when logged in */}
          {user && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-foreground">Product</h3>
              <ul className="flex flex-col gap-2">
                <li>
                  <Link
                    href="/docs/mcp"
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    Docs
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Resources */}
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-foreground">Resources</h3>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href="https://github.com/davidhoang/tapestry/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Github className="h-3.5 w-3.5" />
                  Send Feedback
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <span>&copy; {new Date().getFullYear()} Tapestry. All rights reserved.</span>
          <span>Built with care by Proof of Concept.</span>
        </div>
      </div>
    </footer>
  );
}
