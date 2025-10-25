import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface DesignerAvatarProps {
  imageUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function DesignerAvatar({ imageUrl, name, size = "md", className = "" }: DesignerAvatarProps) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16", 
    lg: "h-32 w-32",
    xl: "h-40 w-40"
  };

  const fallbackSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-4xl",
    xl: "text-6xl"
  };

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <Avatar className={`${sizeClasses[size]} overflow-hidden rounded-3xl ${className}`}>
      {imageUrl ? (
        <AvatarImage 
          src={imageUrl} 
          alt={name}
          className="object-cover"
        />
      ) : (
        <AvatarFallback className={`${fallbackSizeClasses[size]} font-bold text-muted-foreground bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl`}>
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}