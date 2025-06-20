import { forwardRef } from "react";
import MDEditor from "@uiw/react-md-editor";
import { cn } from "@/lib/utils";

interface MarkdownEditorProps {
  value?: string;
  onChange?: (value?: string) => void;
  className?: string;
  preview?: "edit" | "preview" | "live";
  height?: number;
  hideToolbar?: boolean;
  visibleDragBar?: boolean;
}

const MarkdownEditor = forwardRef<HTMLDivElement, MarkdownEditorProps>(
  ({ className, hideToolbar = false, height = 200, visibleDragBar = false, ...props }, ref) => {
    const cleanProps = { ...props };
    // Remove any non-standard props that might cause warnings
    delete (cleanProps as any).toolbarHeight;
    
    return (
      <div ref={ref} className={cn("markdown-editor", className)}>
        <MDEditor
          {...cleanProps}
          height={height}
          hideToolbar={hideToolbar}
          visibleDragBar={visibleDragBar}
          data-color-mode="light"
        />
      </div>
    );
  }
);

MarkdownEditor.displayName = "MarkdownEditor";

export { MarkdownEditor };