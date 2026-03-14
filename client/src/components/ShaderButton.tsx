import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShaderButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
  asChild?: boolean;
}

export function ShaderButton({
  children,
  onClick,
  className,
  variant = "default",
  size = "default",
  asChild,
}: ShaderButtonProps) {
  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      className={cn(
        "transition-all duration-200 ring-0 ring-[#C8944B]/0 hover:ring-1 hover:ring-[#C8944B]",
        className
      )}
      asChild={asChild}
    >
      {children}
    </Button>
  );
}
