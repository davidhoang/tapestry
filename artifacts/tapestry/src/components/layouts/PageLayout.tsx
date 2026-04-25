import { cn } from "@/lib/utils";

interface PageLayoutProps {
  children: React.ReactNode;
  className?: string;
  container?: boolean;
}

export default function PageLayout({ children, className, container = false }: PageLayoutProps) {
  return (
    <div className={cn("pt-24", className)}>
      {container ? (
        <div className="container mx-auto px-4">
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}
