import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useFileImport } from "@/hooks/use-file-import";
import { FileUploadInput, ContactResultsList } from "@/components/common";

export default function PdfImport() {
  const {
    batchResults,
    importResult,
    isProcessing,
    processingProgress,
    currentProcessingFile,
    selectedFiles,
    fileInputRef,
    isImporting,
    handleFileUpload,
    handleImportContacts,
    clearData,
    totalContacts,
    canImport,
  } = useFileImport();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>LinkedIn PDF import</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Upload a PDF export from LinkedIn connections or search results. The system will automatically extract contact information including names, titles, companies, and LinkedIn profiles.
          </p>

          <FileUploadInput
            id="pdf-file"
            label="Upload PDF File"
            accept=".pdf"
            multiple
            fileInputRef={fileInputRef}
            selectedFiles={selectedFiles}
            isProcessing={isProcessing}
            processingProgress={processingProgress}
            currentProcessingFile={currentProcessingFile}
            hasResults={batchResults.length > 0 || !!importResult}
            onFileChange={handleFileUpload}
            onClear={clearData}
          />
        </CardContent>
      </Card>

      {(batchResults.length > 0 || importResult) && (
        <Card>
          <CardContent className="pt-6">
            <ContactResultsList
              batchResults={batchResults}
              importResult={importResult}
              totalContacts={totalContacts}
              canImport={canImport}
              isImporting={isImporting}
              onImport={handleImportContacts}
              onClear={clearData}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
