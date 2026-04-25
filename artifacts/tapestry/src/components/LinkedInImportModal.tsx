import { useFileImport } from "@/hooks/use-file-import";
import { FileUploadInput, ContactResultsList } from "@/components/common";

interface LinkedInImportModalProps {
  onClose: () => void;
}

export default function LinkedInImportModal({ onClose }: LinkedInImportModalProps) {
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
        hasResults={batchResults.length > 0}
        onFileChange={handleFileUpload}
        onClear={clearData}
      />

      <ContactResultsList
        batchResults={batchResults}
        importResult={importResult}
        totalContacts={totalContacts}
        canImport={canImport}
        isImporting={isImporting}
        onImport={handleImportContacts}
        onClose={onClose}
        onClear={clearData}
      />
    </div>
  );
}
