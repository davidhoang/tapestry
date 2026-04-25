import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { getAvatarColors } from "@/utils/avatarColors";

interface DesignerAvatarProps {
  imageUrl?: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function DesignerAvatar({ imageUrl, name, size = "md", className = "" }: DesignerAvatarProps) {
  const sizeClasses = {
    sm: "h-12 w-12",
    md: "h-16 w-16", 
    lg: "h-32 w-32"
  };

  const fallbackSizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-4xl"
  };

  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
  const { bg, text } = getAvatarColors(name);

  return (
    <Avatar className={`${sizeClasses[size]} overflow-hidden rounded-lg ${className}`}>
      {imageUrl ? (
        <AvatarImage 
          src={imageUrl} 
          alt={name}
          className="object-cover"
        />
      ) : (
        <AvatarFallback
          className={`${fallbackSizeClasses[size]} font-bold rounded-lg`}
          style={{ backgroundColor: bg, color: text }}
        >
          {initials}
        </AvatarFallback>
      )}
    </Avatar>
  );
}
