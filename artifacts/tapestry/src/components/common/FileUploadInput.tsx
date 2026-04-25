import { RefObject, type ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Trash2 } from "lucide-react";

interface FileUploadInputProps {
  id: string;
  label: string;
  accept: string;
  multiple?: boolean;
  disabled?: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  selectedFiles: FileList | null;
  isProcessing: boolean;
  processingProgress: number;
  currentProcessingFile: string;
  hasResults: boolean;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export default function FileUploadInput({
  id,
  label,
  accept,
  multiple = true,
  disabled = false,
  fileInputRef,
  selectedFiles,
  isProcessing,
  processingProgress,
  currentProcessingFile,
  hasResults,
  onFileChange,
  onClear,
}: FileUploadInputProps) {
  return (
    <div className="space-y-3">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <Input
            id={id}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={onFileChange}
            ref={fileInputRef}
            disabled={disabled || isProcessing}
            className="w-full border-0 bg-transparent p-0 shadow-none ring-0 focus:ring-0 focus-visible:ring-0 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border file:border-input file:bg-background file:text-sm file:font-medium hover:file:bg-accent"
          />
        </div>
        {hasResults && (
          <Button variant="outline" size="sm" onClick={onClear} disabled={isProcessing}>
            <Trash2 className="h-4 w-4 mr-1" />
            Clear
          </Button>
        )}
      </div>
      {selectedFiles && selectedFiles.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {selectedFiles.length} file{selectedFiles.length > 1 ? 's' : ''} selected
        </p>
      )}
      {isProcessing && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Processing: {currentProcessingFile}</span>
            <span>{Math.round(processingProgress)}%</span>
          </div>
          <Progress value={processingProgress} />
        </div>
      )}
    </div>
  );
}
