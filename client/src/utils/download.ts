import { BACKEND_URL } from '../api';

/**
 * Triggers Excel XLSX file download from API as a real binary Blob
 */
export async function triggerExcelDownload(onSuccess?: (filename: string) => void, onError?: (err: string) => void) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_URL}/api/excel/export`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    if (!res.ok) {
      let errMsg = `Server returned status ${res.status}`;
      try { const json = await res.json(); if (json.error) errMsg = json.error; } catch (_) {}
      throw new Error(errMsg);
    }
    const blob = await res.blob();
    const filename = 'CN_PROJECT_UPDATED.xlsx';
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { link.remove(); window.URL.revokeObjectURL(blobUrl); }, 500);
    if (onSuccess) onSuccess(filename);
  } catch (err: any) {
    console.error('Excel Download Error:', err);
    if (onError) onError(err.message || 'Download failed');
    else alert('Failed to download Excel file: ' + err.message);
  }
}

/**
 * Triggers download of the untouched original faculty master Excel
 */
export async function triggerOriginalExcelDownload(onSuccess?: (filename: string) => void, onError?: (err: string) => void) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BACKEND_URL}/api/excel/original`, {
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }
    });
    if (!res.ok) {
      let errMsg = `Server returned status ${res.status}`;
      try { const json = await res.json(); if (json.error) errMsg = json.error; } catch (_) {}
      throw new Error(errMsg);
    }
    const blob = await res.blob();
    const filename = 'CN-PRJECT  DETSILS.xlsx';
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => { link.remove(); window.URL.revokeObjectURL(blobUrl); }, 500);
    if (onSuccess) onSuccess(filename);
  } catch (err: any) {
    console.error('Original Excel Download Error:', err);
    if (onError) onError(err.message || 'Download failed');
    else alert('Failed to download original Excel file: ' + err.message);
  }
}
