import { useState, useRef, useCallback, type ChangeEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

export interface ExtractedContact {
  name: string;
  title?: string;
  company?: string;
  location?: string;
  email?: string;
  linkedIn?: string;
  skills?: string[];
  experience?: string;
  confidence: number;
}

export interface PdfProcessingResult {
  success: boolean;
  contacts: ExtractedContact[];
  totalPages: number;
  errors?: string[];
  message?: string;
  fileName?: string;
}

export interface BatchProcessingResult {
  fileName: string;
  result: PdfProcessingResult;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{ contact: string; error: string }>;
  message?: string;
}

interface UseFileImportOptions {
  maxFileSizeMB?: number;
  acceptedTypes?: string[];
  onImportSuccess?: (result: ImportResult) => void;
}

export function useFileImport(options: UseFileImportOptions = {}) {
  const {
    maxFileSizeMB = 10,
    acceptedTypes = ['application/pdf'],
    onImportSuccess,
  } = options;

  const [batchResults, setBatchResults] = useState<BatchProcessingResult[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingFile, setCurrentProcessingFile] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const processPdfMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('pdf', file);
      
      const response = await fetch('/api/import/pdf/process', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      const result = await response.json() as PdfProcessingResult;
      return { ...result, fileName: file.name };
    },
  });

  const importContactsMutation = useMutation({
    mutationFn: async (contacts: ExtractedContact[]) => {
      const response = await fetch('/api/import/pdf/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contacts }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText);
      }
      
      return response.json() as Promise<ImportResult>;
    },
    onSuccess: (result) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/designers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/lists'] });
      toast({
        title: "Import completed",
        description: `Successfully imported ${result.imported} contacts`,
      });
      onImportSuccess?.(result);
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateFile = useCallback((file: File): boolean => {
    if (!acceptedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: `${file.name} is not a supported file type`,
        variant: "destructive",
      });
      return false;
    }
    if (file.size > maxFileSizeMB * 1024 * 1024) {
      toast({
        title: "File too large",
        description: `${file.name} is larger than ${maxFileSizeMB}MB`,
        variant: "destructive",
      });
      return false;
    }
    return true;
  }, [acceptedTypes, maxFileSizeMB, toast]);

  const processBatchFiles = useCallback(async (files: FileList) => {
    setIsProcessing(true);
    setProcessingProgress(0);
    setBatchResults([]);
    setImportResult(null);

    const results: BatchProcessingResult[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentProcessingFile(file.name);
      
      try {
        const result = await processPdfMutation.mutateAsync(file);
        results.push({ fileName: file.name, result });
        setBatchResults([...results]);
      } catch (error) {
        const errorResult: PdfProcessingResult = {
          success: false,
          contacts: [],
          totalPages: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
          fileName: file.name
        };
        results.push({ fileName: file.name, result: errorResult });
        setBatchResults([...results]);
      }
      
      setProcessingProgress(((i + 1) / files.length) * 100);
    }

    setIsProcessing(false);
    setCurrentProcessingFile("");
  }, [processPdfMutation]);

  const handleFileUpload = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setSelectedFiles(files);

    for (let i = 0; i < files.length; i++) {
      if (!validateFile(files[i])) return;
    }

    await processBatchFiles(files);
  }, [validateFile, processBatchFiles]);

  const handleImportContacts = useCallback(() => {
    const allContacts = batchResults.flatMap(result => result.result.contacts);
    if (allContacts.length === 0) return;
    importContactsMutation.mutate(allContacts);
  }, [batchResults, importContactsMutation]);

  const clearData = useCallback(() => {
    setBatchResults([]);
    setImportResult(null);
    setProcessingProgress(0);
    setCurrentProcessingFile("");
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const totalContacts = batchResults.reduce(
    (sum, result) => sum + result.result.contacts.length, 
    0
  );

  const canImport = batchResults.length > 0 && 
    batchResults.some(r => r.result.contacts.length > 0) && 
    !importContactsMutation.isPending;

  return {
    batchResults,
    importResult,
    isProcessing,
    processingProgress,
    currentProcessingFile,
    selectedFiles,
    fileInputRef,
    isImporting: importContactsMutation.isPending,
    handleFileUpload,
    handleImportContacts,
    clearData,
    totalContacts,
    canImport,
  };
}

export function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return "bg-green-500";
  if (confidence >= 0.6) return "bg-yellow-500";
  return "bg-red-500";
}

export function getConfidenceText(confidence: number): string {
  if (confidence >= 0.8) return "High";
  if (confidence >= 0.6) return "Medium";
  return "Low";
}
