export interface ExportColumn {
  key: string;
  label: string;
}

function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  let stringValue = String(value);
  
  if (Array.isArray(value)) {
    stringValue = value.join(', ');
  }
  
  const needsQuotes = stringValue.includes(',') || 
                      stringValue.includes('"') || 
                      stringValue.includes('\n') || 
                      stringValue.includes('\r');
  
  if (needsQuotes) {
    stringValue = stringValue.replace(/"/g, '""');
    return `"${stringValue}"`;
  }
  
  return stringValue;
}

function getNestedValue(obj: any, key: string): any {
  return key.split('.').reduce((acc, part) => acc?.[part], obj);
}

export function exportToCSV(
  data: any[],
  filename: string,
  columns: ExportColumn[]
): void {
  if (!data || data.length === 0) {
    return;
  }

  const headerRow = columns.map(col => escapeCSVValue(col.label)).join(',');
  
  const dataRows = data.map(item => {
    return columns.map(col => {
      const value = getNestedValue(item, col.key);
      return escapeCSVValue(value);
    }).join(',');
  });

  const csvContent = [headerRow, ...dataRows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

export const designerExportColumns: ExportColumn[] = [
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Title' },
  { key: 'email', label: 'Email' },
  { key: 'company', label: 'Company' },
  { key: 'location', label: 'Location' },
  { key: 'level', label: 'Level' },
  { key: 'skills', label: 'Skills' },
  { key: 'linkedIn', label: 'LinkedIn' },
];
