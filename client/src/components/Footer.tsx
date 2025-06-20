import { AlertTriangle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-background border-t border-border">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Warning Alert */}
          <div className="flex items-center justify-center sm:justify-start gap-2 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">
              Alpha Version: Data may be wiped during development
            </span>
          </div>
          
          {/* Attribution */}
          <div className="text-sm text-muted-foreground text-center sm:text-right">
            <a 
              href="https://www.proofofconcept.pub" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors underline"
            >
              A Proof of Concept experiment
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}