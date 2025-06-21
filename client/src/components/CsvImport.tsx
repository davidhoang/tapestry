import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Download, AlertCircle, CheckCircle, FileText, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CsvPreviewRow {
  [key: string]: string;
}

interface FieldMapping {
  csvColumn: string;
  dbField: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  errors: Array<{ row: number; error: string }>;
  message?: string;
}

const DB_FIELDS = [
  { value: "name", label: "Name (Required)", required: true },
  { value: "title", label: "Title (Required)", required: true },
  { value: "email", label: "Email (Required)", required: true },
  { value: "level", label: "Level (Required)", required: true },
  { value: "location", label: "Location", required: false },
  { value: "company", label: "Company", required: false },
  { value: "website", label: "Website", required: false },
  { value: "linkedIn", label: "LinkedIn", required: false },
  { value: "skills", label: "Skills (comma-separated)", required: false },
  { value: "available", label: "Available (true/false)", required: false },
  { value: "notes", label: "Notes", required: false },
];

export default function CsvImport() {
  const [csvData, setCsvData] = useState<CsvPreviewRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const parseCsv = (text: string): { headers: string[]; data: CsvPreviewRow[] } => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return { headers: [], data: [] };

    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const data = lines.slice(1).map((line, index) => {
      const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
      const row: CsvPreviewRow = {};
      headers.forEach((header, i) => {
        row[header] = values[i] || '';
      });
      return row;
    });

    return { headers, data };
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, data } = parseCsv(text);
      
      setCsvHeaders(headers);
      setCsvData(data.slice(0, 10)); // Show first 10 rows for preview
      
      // Auto-map fields based on exact column names or common patterns
      const autoMappings: FieldMapping[] = headers.map(header => {
        const lowerHeader = header.toLowerCase().trim();
        let dbField = '';
        
        // First try exact matches
        const exactMatches = {
          'name': 'name',
          'title': 'title', 
          'email': 'email',
          'level': 'level',
          'location': 'location',
          'company': 'company',
          'website': 'website',
          'linkedin': 'linkedIn',
          'skills': 'skills',
          'available': 'available',
          'notes': 'notes'
        };
        
        if (exactMatches[lowerHeader as keyof typeof exactMatches]) {
          dbField = exactMatches[lowerHeader as keyof typeof exactMatches];
        } else {
          // Then try pattern matching for flexibility
          if (lowerHeader.includes('name')) dbField = 'name';
          else if (lowerHeader.includes('title') || lowerHeader.includes('position')) dbField = 'title';
          else if (lowerHeader.includes('email')) dbField = 'email';
          else if (lowerHeader.includes('level') || lowerHeader.includes('seniority')) dbField = 'level';
          else if (lowerHeader.includes('location') || lowerHeader.includes('city')) dbField = 'location';
          else if (lowerHeader.includes('company') || lowerHeader.includes('organization')) dbField = 'company';
          else if (lowerHeader.includes('website') || lowerHeader.includes('url')) dbField = 'website';
          else if (lowerHeader.includes('linkedin')) dbField = 'linkedIn';
          else if (lowerHeader.includes('skill')) dbField = 'skills';
          else if (lowerHeader.includes('available')) dbField = 'available';
          else if (lowerHeader.includes('note')) dbField = 'notes';
        }
        
        return { csvColumn: header, dbField };
      });
      
      setFieldMappings(autoMappings);
      setImportResult(null);
    };
    
    reader.readAsText(file);
  };

  const updateFieldMapping = (csvColumn: string, dbField: string) => {
    setFieldMappings(prev => 
      prev.map(mapping => 
        mapping.csvColumn === csvColumn 
          ? { ...mapping, dbField }
          : mapping
      )
    );
  };

  const importCsv = useMutation({
    mutationFn: async () => {
      if (!fileInputRef.current?.files?.[0]) {
        throw new Error("No file selected");
      }

      const formData = new FormData();
      formData.append('csv', fileInputRef.current.files[0]);
      formData.append('mappings', JSON.stringify(fieldMappings));

      const response = await fetch('/api/admin/import-designers', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      return response.json();
    },
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      queryClient.invalidateQueries({ queryKey: ['/api/designers'] });
      
      if (result.success) {
        toast({
          title: "Import successful",
          description: `Successfully imported ${result.imported} designers.`,
        });
      } else {
        toast({
          title: "Import completed with errors",
          description: result.message || "Some records failed to import.",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const clearData = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMappings([]);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const downloadTemplate = () => {
    const requiredFields = DB_FIELDS.filter(field => field.required).map(field => field.value);
    const optionalFields = DB_FIELDS.filter(field => !field.required).map(field => field.value);
    const headers = [...requiredFields, ...optionalFields];
    
    const csv = [
      headers.join(','),
      'John Doe,Senior Product Designer,john@example.com,Senior,San Francisco,Acme Corp,https://johndoe.com,https://linkedin.com/in/johndoe,"UI Design,UX Research,Prototyping",true,Available for full-time roles'
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'designers_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getRequiredMappings = () => {
    const requiredFields = DB_FIELDS.filter(field => field.required).map(field => field.value);
    return fieldMappings.filter(mapping => requiredFields.includes(mapping.dbField));
  };

  const canImport = () => {
    if (csvData.length === 0) return false;
    const requiredFields = DB_FIELDS.filter(field => field.required).map(field => field.value);
    const mappedFields = fieldMappings.filter(mapping => mapping.dbField).map(mapping => mapping.dbField);
    return requiredFields.every(field => mappedFields.includes(field));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            CSV import for designers
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <Label htmlFor="csv-file">Upload CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                ref={fileInputRef}
              />
            </div>
            <div className="flex gap-2 items-end">
              <Button variant="outline" onClick={downloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </Button>
              {csvData.length > 0 && (
                <Button variant="outline" onClick={clearData}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear
                </Button>
              )}
            </div>
          </div>

          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Upload a CSV file with designer information. Required fields: Name, Title, Email, Level. 
              The system will attempt to auto-map columns based on common naming patterns.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {csvHeaders.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Field Mapping</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {csvHeaders.map((header) => {
                const mapping = fieldMappings.find(m => m.csvColumn === header);
                const dbField = DB_FIELDS.find(f => f.value === mapping?.dbField);
                
                return (
                  <div key={header} className="flex items-center gap-4">
                    <div className="flex-1">
                      <Label className="text-sm font-medium">{header}</Label>
                    </div>
                    <div className="flex-1">
                      <Select
                        value={mapping?.dbField || "__SKIP__"}
                        onValueChange={(value) => updateFieldMapping(header, value === "__SKIP__" ? "" : value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select database field" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__SKIP__">Don't import</SelectItem>
                          {DB_FIELDS.map((field) => (
                            <SelectItem key={field.value} value={field.value}>
                              {field.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {dbField?.required && (
                      <Badge variant="destructive" className="text-xs">
                        Required
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-between items-center pt-4">
              <div className="text-sm text-muted-foreground">
                {getRequiredMappings().length} of {DB_FIELDS.filter(f => f.required).length} required fields mapped
              </div>
              <Button 
                onClick={() => importCsv.mutate()}
                disabled={!canImport() || importCsv.isPending}
              >
                {importCsv.isPending ? "Importing..." : "Import Designers"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {csvData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview (First 10 rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {csvHeaders.map((header) => (
                      <TableHead key={header}>{header}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.map((row, index) => (
                    <TableRow key={index}>
                      {csvHeaders.map((header) => (
                        <TableCell key={header} className="max-w-[200px] truncate">
                          {row[header]}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
          <CardContent className="space-y-4">
            <Alert variant={importResult.success ? "default" : "destructive"}>
              <AlertDescription>
                {importResult.success 
                  ? `Successfully imported ${importResult.imported} designers.`
                  : `Import completed with errors. ${importResult.imported} designers imported.`
                }
              </AlertDescription>
            </Alert>

            {importResult.errors && importResult.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Errors:</h4>
                <div className="space-y-1">
                  {importResult.errors.map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertDescription>
                        Row {error.row}: {error.error}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}