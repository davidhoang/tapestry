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
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: Array<{ contact: string; error: string }>;
  message?: string;
}

export default function PdfImport() {
  const [processingResult, setProcessingResult] = useState<PdfProcessingResult | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedFileName, setSelectedFileName] = useState<string>("");
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
      
      return response.json() as Promise<PdfProcessingResult>;
    },
    onSuccess: (result) => {
      setProcessingResult(result);
      setIsProcessing(false);
      if (result.success) {
        toast({
          title: "PDF processed successfully",
          description: `Extracted ${result.contacts.length} contacts from ${result.totalPages} pages`,
        });
      } else {
        toast({
          title: "Processing completed with issues",
          description: result.message || "Some contacts could not be extracted",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      setIsProcessing(false);
      toast({
        title: "Processing failed",
        description: error.message,
        variant: "destructive",
      });
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
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);

    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid file type",
        description: "Please select a PDF file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: "File too large",
        description: "Please select a PDF file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setProcessingProgress(0);
    setProcessingResult(null);
    setImportResult(null);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setProcessingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 1000);

    processPdfMutation.mutate(file);
  };

  const handleImportContacts = () => {
    if (!processingResult?.contacts) return;
    importContactsMutation.mutate(processingResult.contacts);
  };

  const clearData = () => {
    setProcessingResult(null);
    setImportResult(null);
    setProcessingProgress(0);
    setSelectedFileName("");
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
                  onChange={handleFileUpload}
                  ref={fileInputRef}
                  disabled={isProcessing}
                  className="hidden"
                />
                <span className="text-sm text-muted-foreground self-center">
                  {selectedFileName || "No file chosen"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 items-end">
              {(processingResult || importResult) && (
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
                <span className="text-sm">Processing PDF...</span>
              </div>
              <Progress value={processingProgress} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {processingResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {processingResult.success ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-red-500" />
              )}
              Processing Results
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {processingResult.contacts.length}
                </div>
                <div className="text-sm text-blue-700">Contacts Extracted</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {processingResult.totalPages}
                </div>
                <div className="text-sm text-green-700">Pages Processed</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {processingResult.contacts.filter(c => c.confidence >= 0.8).length}
                </div>
                <div className="text-sm text-purple-700">High Confidence</div>
              </div>
            </div>

            {processingResult.contacts.length > 0 && (
              <>
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Extracted Contacts</h3>
                  <Button 
                    onClick={handleImportContacts}
                    disabled={importContactsMutation.isPending}
                  >
                    {importContactsMutation.isPending ? 'Importing...' : 'Import All Contacts'}
                  </Button>
                </div>

                <div className="max-h-96 overflow-y-auto space-y-2">
                  {processingResult.contacts.map((contact, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="font-semibold">{contact.name}</div>
                          {contact.title && (
                            <div className="text-sm text-gray-600">{contact.title}</div>
                          )}
                          {contact.company && (
                            <div className="text-sm text-gray-600">at {contact.company}</div>
                          )}
                          {contact.location && (
                            <div className="text-sm text-gray-500">{contact.location}</div>
                          )}
                          {contact.skills && contact.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {contact.skills.slice(0, 3).map((skill, skillIndex) => (
                                <Badge key={skillIndex} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {contact.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{contact.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${getConfidenceColor(contact.confidence)}`}></div>
                          <span className="text-xs text-gray-500">
                            {getConfidenceText(contact.confidence)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {processingResult.errors && processingResult.errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>Processing errors:</div>
                  <ul className="list-disc list-inside mt-1">
                    {processingResult.errors.map((error, index) => (
                      <li key={index} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
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