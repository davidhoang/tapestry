import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, AlertCircle, Trash2, Linkedin } from "lucide-react";
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

export default function PdfImport() {
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
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
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
      });
      
      if (!response.ok) {
        throw new Error(await response.text());
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

    // Validate all files
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
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
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
      setProcessingProgress((i / files.length) * 100);

      try {
        const result = await processPdfMutation.mutateAsync(file);
        results.push({ fileName: file.name, result });
        
        if (result.success) {
          toast({
            title: `${file.name} processed`,
            description: `Extracted ${result.contacts.length} contacts`,
          });
        } else {
          toast({
            title: `${file.name} processing issues`,
            description: result.message || "Some contacts could not be extracted",
            variant: "destructive",
          });
        }
      } catch (error: any) {
        toast({
          title: `${file.name} failed`,
          description: error.message,
          variant: "destructive",
        });
        results.push({
          fileName: file.name,
          result: {
            success: false,
            contacts: [],
            totalPages: 0,
            errors: [error.message],
            fileName: file.name
          }
        });
      }
    }

    setBatchResults(results);
    setIsProcessing(false);
    setProcessingProgress(100);
    setCurrentProcessingFile("");

    const totalContacts = results.reduce((sum, r) => sum + r.result.contacts.length, 0);
    const successfulFiles = results.filter(r => r.result.success).length;
    
    toast({
      title: "Batch processing completed",
      description: `Processed ${files.length} files, extracted ${totalContacts} contacts from ${successfulFiles} successful files`,
    });
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
      <Card>
        <CardHeader>
          <CardTitle>
            LinkedIn PDF Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Upload a PDF export from LinkedIn connections or search results. The system will automatically extract contact information including names, titles, companies, and LinkedIn profiles.
          </div>

          <div className="flex gap-4">
            <div>
              <Label htmlFor="pdf-file" className="block mb-2">Upload PDF File</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </Button>
                <Input
                  id="pdf-file"
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  disabled={isProcessing}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground self-center">
                  {selectedFiles 
                    ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
                    : "No files chosen"
                  }
                </span>
              </div>
            </div>
            <div className="flex gap-2 items-end">
              {(batchResults.length > 0 || importResult) && (
                <Button variant="outline" onClick={clearData}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          {isProcessing && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm">
                  {currentProcessingFile ? `Processing: ${currentProcessingFile}...` : "Processing PDFs..."}
                </span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {batchResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Batch Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {batchResults.length}
                </div>
                <div className="text-sm text-blue-700">Files Processed</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {batchResults.reduce((sum, r) => sum + r.result.contacts.length, 0)}
                </div>
                <div className="text-sm text-green-700">Total Contacts</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {batchResults.reduce((sum, r) => sum + r.result.contacts.filter(c => c.confidence >= 0.8).length, 0)}
                </div>
                <div className="text-sm text-purple-700">High Confidence</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {batchResults.filter(r => r.result.success).length}
                </div>
                <div className="text-sm text-orange-700">Successful Files</div>
              </div>
            </div>

            {batchResults.some(r => r.result.contacts.length > 0) && (
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">
                  All Extracted Contacts ({batchResults.reduce((sum, r) => sum + r.result.contacts.length, 0)})
                </h3>
                <Button 
                  onClick={handleImportContacts}
                  disabled={importContactsMutation.isPending}
                >
                  {importContactsMutation.isPending ? 'Importing...' : 'Import All Contacts'}
                </Button>
              </div>
            )}

            <div className="space-y-4">
              {batchResults.map((batchResult, fileIndex) => (
                <div key={fileIndex} className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{batchResult.fileName}</span>
                    <div className={`w-2 h-2 rounded-full ${batchResult.result.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-sm text-muted-foreground">
                      {batchResult.result.contacts.length} contacts
                    </span>
                  </div>
                  
                  {batchResult.result.contacts.length > 0 && (
                    <div className="grid gap-2 max-h-48 overflow-y-auto">
                      {batchResult.result.contacts.map((contact, contactIndex) => (
                        <div key={contactIndex} className="border rounded p-3 bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="font-medium text-sm">{contact.name}</div>
                              {contact.title && (
                                <div className="text-xs text-gray-600">{contact.title}</div>
                              )}
                              {contact.company && (
                                <div className="text-xs text-gray-600">at {contact.company}</div>
                              )}
                              {contact.skills && contact.skills.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {contact.skills.slice(0, 2).map((skill, skillIndex) => (
                                    <Badge key={skillIndex} variant="secondary" className="text-xs">
                                      {skill}
                                    </Badge>
                                  ))}
                                  {contact.skills.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{contact.skills.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`w-1.5 h-1.5 rounded-full ${getConfidenceColor(contact.confidence)}`}></div>
                              <span className="text-xs text-gray-500">
                                {getConfidenceText(contact.confidence)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {batchResult.result.errors && batchResult.result.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      <div className="font-medium">Errors:</div>
                      <ul className="list-disc list-inside">
                        {batchResult.result.errors.map((error, errorIndex) => (
                          <li key={errorIndex}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Import Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {importResult.imported}
                </div>
                <div className="text-sm text-green-700">Successfully Imported</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {importResult.skipped}
                </div>
                <div className="text-sm text-yellow-700">Skipped (Duplicates)</div>
              </div>
            </div>

            {importResult.errors && importResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>Import errors:</div>
                  <ul className="list-disc list-inside mt-1">
                    {importResult.errors.map((error, index) => (
                      <li key={index} className="text-sm">
                        {error.contact}: {error.error}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}