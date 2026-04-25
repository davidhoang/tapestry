import { cn } from "@/lib/utils";
import DOMPurify from "dompurify";

interface RichTextPreviewProps {
  source?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function RichTextPreview({ source, className, style }: RichTextPreviewProps) {
  const sanitizedHTML = DOMPurify.sanitize(source || "", {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'u', 's', 'code', 'pre',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote',
      'hr',
      'a',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
  });

  return (
    <div
      className={cn("rich-text-preview prose prose-sm max-w-none", className)}
      style={style}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}
