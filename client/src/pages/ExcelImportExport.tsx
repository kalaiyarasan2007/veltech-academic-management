import React, { useState } from 'react';
import { FileUp, Download, Eye, CheckCircle, AlertTriangle, FileSpreadsheet, FileText } from 'lucide-react';
import { fetchApi } from '../api';
import { ExcelViewer } from '../components/ExcelViewer';
import { triggerExcelDownload, triggerOriginalExcelDownload } from '../utils/download';

export const ExcelImportExport: React.FC = () => {
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadMsg, setUploadMsg] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Preview & Download States
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(false);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [downloadMsg, setDownloadMsg] = useState<string>('');
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadingOriginal, setDownloadingOriginal] = useState<boolean>(false);

  const loadPreview = async () => {
    setLoadingPreview(true);
    try {
      const data = await fetchApi<any>('/excel/preview');
      setPreviewData(data);
      setShowPreview(true);
    } catch (err: any) {
      console.error('Failed to load Excel preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadMsg('');
      setUploadError('');
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    setUploadMsg('');
    setUploadError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/excel/import', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import failed');

      setUploadMsg(`Successfully imported Excel data! New: ${data.importedCount}, Updated: ${data.updatedCount}, Total: ${data.totalStudents} students.`);
      setSelectedFile(null);
      
      // Reload preview if currently open
      if (showPreview) {
        loadPreview();
      }
    } catch (err: any) {
      setUploadError(err.message || 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadOriginal = () => {
    setDownloadingOriginal(true);
    setDownloadMsg('');
    triggerOriginalExcelDownload(
      (filename) => {
        setDownloadingOriginal(false);
        setDownloadMsg(`✓ ${filename} (Original Master Template) opened/downloaded successfully.`);
      },
      (err) => {
        setDownloadingOriginal(false);
        alert('Failed to download original Excel file: ' + err);
      }
    );
  };

  const handleDownload = () => {
    setDownloading(true);
    setDownloadMsg('');
    triggerExcelDownload(
      (filename) => {
        setDownloading(false);
        setDownloadMsg(`✓ ${filename} downloaded successfully.`);
      },
      (err) => {
        setDownloading(false);
        alert('Failed to download Excel file: ' + err);
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Quick Actions */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> Excel Synchronization & Faculty Master Hub
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access faculty's untouched original workbook, inspect live updated previews, or download synchronized .xlsx files.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleDownloadOriginal}
            disabled={downloadingOriginal}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-1.5 shadow-sm"
            title="Download the untouched original faculty workbook (CN-PRJECT  DETSILS.xlsx)"
          >
            <FileText className="w-4 h-4 text-amber-400" />
            {downloadingOriginal ? 'Opening...' : 'Open Original Excel'}
          </button>

          <button
            onClick={loadPreview}
            disabled={loadingPreview}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center gap-1.5"
            title="Preview updated spreadsheet with colors and formulas"
          >
            <Eye className="w-4 h-4" />
            {loadingPreview ? 'Generating...' : 'Preview Updated Excel'}
          </button>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center gap-1.5 disabled:opacity-50"
            title="Download CN_PROJECT_UPDATED.xlsx"
          >
            <Download className="w-4 h-4" />
            {downloading ? 'Downloading...' : 'Download Updated Excel'}
          </button>
        </div>
      </div>

      {/* Download Banner Notification */}
      {downloadMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-bold text-sm flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" /> {downloadMsg}
          </div>
          <span className="text-xs font-mono text-emerald-300">Preserving Original Faculty Layout & Formulas</span>
        </div>
      )}

      {/* Main 4-Action Workflow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* CARD 1: OPEN ORIGINAL EXCEL */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-xl text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Original Master Excel</h3>
                <p className="text-[11px] text-slate-400">Untouched faculty template</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
              Open the faculty's original master file (<code className="text-amber-300 font-mono text-[10px]">CN-PRJECT  DETSILS.xlsx</code>) directly without any modifications.
            </p>
          </div>

          <button
            onClick={handleDownloadOriginal}
            disabled={downloadingOriginal}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <FileText className="w-4 h-4" />
            {downloadingOriginal ? 'Opening Master...' : 'Open Original Excel'}
          </button>
        </div>

        {/* CARD 2: PREVIEW UPDATED EXCEL */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 rounded-xl text-indigo-400">
                <Eye className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Preview Updated Excel</h3>
                <p className="text-[11px] text-slate-400">Inspect sheets, rows & colors</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 bg-slate-900/60 p-3 rounded-xl border border-slate-800 leading-relaxed">
              Visually inspect 4 worksheets (<code className="text-indigo-300 font-mono text-[10px]">20-24</code>, <code className="text-indigo-300 font-mono text-[10px]">I-III API</code>) with formulas and semester colors.
            </p>
          </div>

          <button
            onClick={loadPreview}
            disabled={loadingPreview}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4" />
            {loadingPreview ? 'Generating Sheet...' : 'Preview Updated Excel'}
          </button>
        </div>

        {/* CARD 3: DOWNLOAD UPDATED EXCEL */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl text-emerald-400">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Download Updated Excel</h3>
                <p className="text-[11px] text-slate-400">Export updated .xlsx file</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-800 space-y-1">
              <p><strong className="text-white">Export:</strong> CN_PROJECT_UPDATED.xlsx</p>
              <p><strong className="text-white">Design:</strong> Exact Faculty Master Structure</p>
            </div>
          </div>

          <button
            onClick={handleDownload}
            disabled={downloading}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> {downloading ? 'Downloading...' : 'Download Updated Excel'}
          </button>
        </div>

        {/* CARD 4: IMPORT EXCEL */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-400">
                <FileUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-white">Import Excel</h3>
                <p className="text-[11px] text-slate-400">Upload faculty workbook</p>
              </div>
            </div>

            {uploadMsg && (
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-semibold flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" /> {uploadMsg}
              </div>
            )}

            {uploadError && (
              <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /> {uploadError}
              </div>
            )}

            <form onSubmit={handleUpload} className="space-y-2">
              <div className="border border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-3 text-center transition cursor-pointer bg-slate-900/40">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="excel-file-input"
                />
                <label htmlFor="excel-file-input" className="cursor-pointer block space-y-1">
                  <FileSpreadsheet className="w-6 h-6 text-slate-400 mx-auto" />
                  <p className="text-[11px] font-semibold text-slate-200 truncate">
                    {selectedFile ? selectedFile.name : 'Choose .xlsx file'}
                  </p>
                </label>
              </div>

              <button
                type="submit"
                disabled={!selectedFile || uploading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition disabled:opacity-50"
              >
                {uploading ? 'Importing...' : 'Upload & Sync'}
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Interactive Excel Preview Component Area */}
      {showPreview && (
        <ExcelViewer
          previewData={previewData}
          loading={loadingPreview}
          onRefresh={loadPreview}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};
