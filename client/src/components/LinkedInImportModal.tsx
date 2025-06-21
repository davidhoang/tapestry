import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExtractedContact {
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

interface PdfProcessingResult {
  success: boolean;
  contacts: ExtractedContact[];
  totalPages: number;
  errors?: string[];
  message?: string;
  fileName?: string;
}

interface BatchProcessingResult {
  fileName: string;
  result: PdfProcessingResult;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{ contact: string; error: string }>;
  message?: string;
}

interface LinkedInImportModalProps {
  onClose: () => void;
}

export default function LinkedInImportModal({ onClose }: LinkedInImportModalProps) {
  const [batchResults, setBatchResults] = useState<BatchProcessingResult[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessingFile, setCurrentProcessingFile] = useState<string>("");
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
      toast({
        title: "Import completed",
        description: `Successfully imported ${result.imported} contacts`,
      });
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setSelectedFiles(files);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type !== 'application/pdf') {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a PDF file`,
          variant: "destructive",
        });
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        return;
      }
    }

    await processBatchFiles(files);
  };

  const processBatchFiles = async (files: FileList) => {
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
  };

  const handleImportContacts = () => {
    const allContacts = batchResults.flatMap(result => result.result.contacts);
    if (allContacts.length === 0) return;
    importContactsMutation.mutate(allContacts);
  };

  const clearData = () => {
    setBatchResults([]);
    setImportResult(null);
    setProcessingProgress(0);
    setCurrentProcessingFile("");
    setSelectedFiles(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return "bg-green-500";
    if (confidence >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getConfidenceText = (confidence: number) => {
    if (confidence >= 0.8) return "High";
    if (confidence >= 0.6) return "Medium";
    return "Low";
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Upload a PDF export from LinkedIn connections or search results. The system will automatically extract contact information including names, titles, companies, and LinkedIn profiles.
        </div>

        <div className="space-y-2">
          <Label htmlFor="pdf-file">Upload PDF File</Label>
          <div className="flex gap-4">
            <Input
              id="pdf-file"
              type="file"
              accept=".pdf"
              multiple
              onChange={handleFileUpload}
              ref={fileInputRef}
              disabled={isProcessing}
              className="flex-1 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
            {batchResults.length > 0 && (
              <Button variant="outline" onClick={clearData} disabled={isProcessing}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear
              </Button>
            )}
          </div>
          {selectedFiles && selectedFiles.length === 0 && (
            <p className="text-sm text-muted-foreground">No files chosen</p>
          )}
        </div>

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

      {batchResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Processing Results
          </h3>
          {batchResults.map((batchResult, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium flex items-center gap-2">
                    {batchResult.result.success ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                    {batchResult.fileName}
                  </h4>
                  <Badge variant={batchResult.result.success ? "default" : "destructive"}>
                    {batchResult.result.contacts.length} contacts
                  </Badge>
                </div>

                {batchResult.result.errors && batchResult.result.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertDescription>
                      {batchResult.result.errors.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}

                {batchResult.result.contacts.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-sm font-medium">Extracted Contacts:</h5>
                    <div className="grid gap-2 max-h-48 overflow-y-auto">
                      {batchResult.result.contacts.map((contact, contactIndex) => (
                        <div key={contactIndex} className="flex items-center justify-between p-2 bg-muted rounded text-sm">
                          <div>
                            <div className="font-medium">{contact.name}</div>
                            {contact.title && contact.company && (
                              <div className="text-muted-foreground">
                                {contact.title} at {contact.company}
                              </div>
                            )}
                            {contact.location && (
                              <div className="text-muted-foreground">{contact.location}</div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${getConfidenceColor(contact.confidence)}`} />
                            <span className="text-xs">{getConfidenceText(contact.confidence)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
              Total contacts found: {batchResults.reduce((sum, result) => sum + result.result.contacts.length, 0)}
            </div>
            <Button 
              onClick={handleImportContacts}
              disabled={batchResults.length === 0 || batchResults.every(r => r.result.contacts.length === 0) || importContactsMutation.isPending}
            >
              {importContactsMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Import All Contacts
            </Button>
          </div>
        </div>
      )}

      {importResult && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            {importResult.success ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <AlertCircle className="h-5 w-5 text-red-500" />
            )}
            Import Results
          </h3>
          <Alert variant={importResult.success ? "default" : "destructive"}>
            <AlertDescription>
                {importResult.success 
                  ? `Successfully imported ${importResult.imported} contacts.`
                  : `Import completed with errors. ${importResult.imported} contacts imported.`
                }
                {importResult.skipped > 0 && ` ${importResult.skipped} contacts were skipped.`}
            </AlertDescription>
          </Alert>

          {importResult.errors && importResult.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Errors:</h4>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {importResult.errors.map((error, index) => (
                  <Alert key={index} variant="destructive">
                    <AlertDescription>
                      {error.contact}: {error.error}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={onClose}>
              Close
            </Button>
            <Button variant="outline" onClick={clearData}>
              Import More
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}