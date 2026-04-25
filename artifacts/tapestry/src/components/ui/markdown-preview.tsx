import MDEditor from "@uiw/react-md-editor";
import { cn } from "@/lib/utils";

interface MarkdownPreviewProps {
  source?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function MarkdownPreview({ source, className, style }: MarkdownPreviewProps) {
  return (
    <div className={cn("markdown-preview", className)} style={style}>
      <MDEditor.Markdown source={source || ""} style={{ backgroundColor: 'transparent', ...style }} />
    </div>
  );
}