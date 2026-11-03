import { BACKEND_URL } from '../api';

const EXCEL_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Universal, cross-browser, cross-device binary Excel file downloader.
 * Engineered specifically to work reliably on:
 * - Android (Chrome, Samsung Internet, Firefox)
 * - iOS / iPadOS (Safari, Chrome iOS)
 * - Desktop (Google Chrome, Microsoft Edge, Mozilla Firefox, Apple Safari)
 */
export async function downloadExcelFile(
  endpointUrl: string,
  defaultFilename: string,
  onSuccess?: (filename: string) => void,
  onError?: (err: string) => void
): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    const fullUrl = endpointUrl.startsWith('http') 
      ? endpointUrl 
      : `${BACKEND_URL}${endpointUrl.startsWith('/') ? '' : '/'}${endpointUrl}`;

    const res = await fetch(fullUrl, {
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      }
    });

    if (!res.ok) {
      let errMsg = `Server returned status ${res.status}`;
      try {
        const json = await res.json();
        if (json.error) errMsg = json.error;
      } catch (_) {
        // Response was not JSON
      }
      throw new Error(errMsg);
    }

    // 1. Parse true filename from Content-Disposition header if available
    const disposition = res.headers.get('Content-Disposition') || '';
    let resolvedFilename = defaultFilename;

    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const stdMatch = disposition.match(/filename="?([^";]+)"?/i);

    if (utf8Match && utf8Match[1]) {
      try { resolvedFilename = decodeURIComponent(utf8Match[1].trim()); } catch (_) {}
    } else if (stdMatch && stdMatch[1]) {
      resolvedFilename = stdMatch[1].trim().replace(/^["']|["']$/g, '');
    }

    // 2. Wrap into typed Blob with explicit XLSX MIME type for iOS Safari & Android
    const rawBlob = await res.blob();
    const excelBlob = new Blob([rawBlob], { type: EXCEL_MIME_TYPE });

    // 3. Create blob URL
    const blobUrl = window.URL.createObjectURL(excelBlob);

    // 4. Create and trigger download anchor with proper DOM attachment (Firefox & Safari)
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = blobUrl;
    link.setAttribute('download', resolvedFilename);
    link.target = '_self';
    document.body.appendChild(link);

    // Dispatch native click
    link.click();

    // 5. CRITICAL FIX FOR MOBILE (iOS & Android):
    // Do NOT revoke immediately (0ms or 500ms). Mobile OS download managers fetch
    // the blob URL asynchronously in a background thread. Revoking too soon cancels
    // the download on mobile phones. Keep blob active for 60 seconds before cleanup.
    setTimeout(() => {
      try {
        if (link.parentNode) link.parentNode.removeChild(link);
        window.URL.revokeObjectURL(blobUrl);
      } catch (_) {}
    }, 60000);

    if (onSuccess) onSuccess(resolvedFilename);
  } catch (err: any) {
    console.error('Excel Download Error:', err);
    const message = err.message || 'Download failed';
    if (onError) {
      onError(message);
    } else {
      alert('Failed to download Excel file: ' + message);
    }
  }
}

/**
 * Triggers Section-wise Excel XLSX file download
 */
export async function triggerSectionExcelDownload(
  sectionId: string,
  departmentId?: string,
  onSuccess?: (filename: string) => void,
  onError?: (err: string) => void
) {
  let url = `/api/excel/section/export?section_id=${encodeURIComponent(sectionId)}`;
  if (departmentId) {
    url += `&department_id=${encodeURIComponent(departmentId)}`;
  }
  return downloadExcelFile(url, 'Section_Academic_Records.xlsx', onSuccess, onError);
}

/**
 * Triggers Common Excel XLSX file download (institution masters only)
 */
export async function triggerCommonExcelDownload(
  onSuccess?: (filename: string) => void,
  onError?: (err: string) => void
) {
  return downloadExcelFile('/api/excel/common/export', 'Academic_Common_Data.xlsx', onSuccess, onError);
}

/**
 * Triggers full updated master Excel XLSX file download
 */
export async function triggerExcelDownload(
  onSuccess?: (filename: string) => void,
  onError?: (err: string) => void
) {
  return downloadExcelFile('/api/excel/export', 'CN_PROJECT_UPDATED.xlsx', onSuccess, onError);
}

/**
 * Triggers download of the untouched original faculty master Excel
 */
export async function triggerOriginalExcelDownload(
  onSuccess?: (filename: string) => void,
  onError?: (err: string) => void
) {
  return downloadExcelFile('/api/excel/original', 'CN-PRJECT  DETSILS.xlsx', onSuccess, onError);
}
