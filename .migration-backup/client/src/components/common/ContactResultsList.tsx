import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { 
  BatchProcessingResult, 
  ImportResult,
  getConfidenceColor, 
  getConfidenceText 
} from "@/hooks/use-file-import";

interface ContactResultsListProps {
  batchResults: BatchProcessingResult[];
  importResult: ImportResult | null;
  totalContacts: number;
  canImport: boolean;
  isImporting: boolean;
  onImport: () => void;
  onClose?: () => void;
  onClear: () => void;
}

export default function ContactResultsList({
  batchResults,
  importResult,
  totalContacts,
  canImport,
  isImporting,
  onImport,
  onClose,
  onClear,
}: ContactResultsListProps) {
  if (importResult) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          {importResult.success ? (
            <CheckCircle className="h-5 w-5 text-green-500" />
          ) : (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          Import Results
        </h3>
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="text-sm">
            {importResult.success 
              ? `Successfully imported ${importResult.imported} contacts.`
              : `Import completed with errors. ${importResult.imported} contacts imported.`
            }
            {importResult.skipped > 0 && ` ${importResult.skipped} contacts were skipped.`}
          </div>
        </div>

        {importResult.errors && importResult.errors.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Errors:</h4>
            <div className="space-y-1 max-h-48 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
              {importResult.errors.map((error, index) => (
                <div key={index} className="bg-muted/30 rounded-lg p-3">
                  <div className="text-sm text-red-600">
                    {error.contact}: {error.error}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {onClose && (
            <Button onClick={onClose}>
              Close
            </Button>
          )}
          <Button variant="outline" onClick={onClear}>
            Add more
          </Button>
        </div>
      </div>
    );
  }

  if (batchResults.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="h-5 w-5" />
        Processing Results
      </h3>
      
      {batchResults.map((batchResult, index) => (
        <div key={index} className="bg-muted/30 rounded-lg p-4 space-y-3">
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
              <div className="grid gap-2 max-h-48 overflow-y-auto" style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}>
                {batchResult.result.contacts.map((contact, contactIndex) => (
                  <div 
                    key={contactIndex} 
                    className="flex items-center justify-between py-2 px-3 bg-background rounded-md text-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{contact.name}</div>
                      {contact.title && contact.company && (
                        <div className="text-muted-foreground text-xs truncate">
                          {contact.title} at {contact.company}
                        </div>
                      )}
                      {contact.location && (
                        <div className="text-muted-foreground text-xs truncate">
                          {contact.location}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3">
                      <div className={`w-2 h-2 rounded-full ${getConfidenceColor(contact.confidence)}`} />
                      <span className="text-xs whitespace-nowrap">
                        {getConfidenceText(contact.confidence)}
                      </span>
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
          Total contacts found: {totalContacts}
        </div>
        <Button 
          onClick={onImport}
          disabled={!canImport}
        >
          {isImporting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Import contacts
        </Button>
      </div>
    </div>
  );
}
