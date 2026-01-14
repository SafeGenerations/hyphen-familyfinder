export const downloadBlob = (content, filename, mimeType) => {
  try {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download file', error);
    alert('Download failed: ' + (error?.message || error));
  }
};

const escapeCsvValue = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  if (stringValue.includes('"') || stringValue.includes(',') || /[\r\n]/.test(stringValue)) {
    return '"' + stringValue.replace(/"/g, '""') + '"';
  }
  return stringValue;
};

export const downloadCSV = (filename, columns, rows) => {
  const resolvedColumns = columns.map((column) => {
    if (typeof column === 'string') {
      return { key: column, label: column };
    }
    return column;
  });

  const headerLine = resolvedColumns.map((column) => escapeCsvValue(column.label || column.key));
  const csvLines = [headerLine.join(',')];

  rows.forEach((row) => {
    const line = resolvedColumns.map((column) => {
      if (typeof column.accessor === 'function') {
        try {
          return escapeCsvValue(column.accessor(row, column));
        } catch (error) {
          console.error('CSV accessor failed', error);
          return '';
        }
      }
      return escapeCsvValue(row[column.key]);
    });
    csvLines.push(line.join(','));
  });

  const csvContent = csvLines.join('\r\n');
  downloadBlob(csvContent, filename, 'text/csv');
};

export const downloadJSON = (filename, data) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadBlob(jsonContent, filename, 'application/json');
};

export const copyTextToClipboard = async (text) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return true;
  } catch (error) {
    console.error('Failed to copy text', error);
    alert('Copy to clipboard failed: ' + (error?.message || error));
    return false;
  }
};
