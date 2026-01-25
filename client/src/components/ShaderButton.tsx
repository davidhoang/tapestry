import { useState } from "react";
import { PulsingBorder } from "@paper-design/shaders-react";
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isHovered && (
        <div className="absolute inset-[-4px] z-0 pointer-events-none">
          <PulsingBorder
            width="100%"
            height="100%"
            colors={["#0dc1fd", "#d915ef", "#ff3f2ecc"]}
            colorBack="#00000000"
            roundness={0.25}
            thickness={0.1}
            softness={0.75}
            aspectRatio="auto"
            intensity={0.2}
            bloom={0.25}
            spots={4}
            spotSize={0.5}
            pulse={0.25}
            smoke={0.3}
            smokeSize={0.6}
            speed={1}
            scale={0.6}
            marginLeft={0}
            marginRight={0}
            marginTop={0}
            marginBottom={0}
          />
        </div>
      )}
      <Button
        onClick={onClick}
        variant={variant}
        size={size}
        className={cn("relative z-10", className)}
        asChild={asChild}
      >
        {children}
      </Button>
    </div>
  );
}
