import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Download, Eye, RefreshCw, CheckCircle2, AlertCircle, Info, Database } from 'lucide-react';
import { fetchApi, BACKEND_URL } from '../api';
import { ExcelViewer } from '../components/ExcelViewer';

export const CommonExcelView: React.FC = () => {
  const [previewData, setPreviewData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState<boolean>(true);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');
  const [error, setError] = useState<string>('');

  const loadPreview = async () => {
    setLoadingPreview(true);
    setError('');
    try {
      const data = await fetchApi<any>('/excel/common/preview');
      setPreviewData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load Common Excel preview');
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    loadPreview();
  }, []);

  const handleDownload = async () => {
    setDownloading(true);
    setMsg('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${BACKEND_URL}/api/excel/common/export`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        throw new Error('Failed to generate Common Excel export');
      }

      const contentDisposition = res.headers.get('Content-Disposition') || '';
      let filename = 'Academic_Common_Data.xlsx';
      const match = contentDisposition.match(/filename="?([^"]+)"?/);
      if (match && match[1]) {
        filename = match[1];
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setMsg(`✓ ${filename} downloaded successfully. Verified genuine Microsoft Excel workbook.`);
    } catch (err: any) {
      setError(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-blue-400" /> Academic Common Data Configuration Workbook
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Global institution and curriculum configuration workbook containing Department, Section, Batch, Semester, and Subject Masters.
          </p>
        </div>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition duration-150 cursor-pointer disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {downloading ? 'Generating XLSX...' : 'Download Academic_Common_Data.xlsx'}
        </button>
      </div>

      {/* Requirement 4 & 29 Warning/Notice Badge */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-white">Data Separation Rule Enforced:</p>
          <p className="text-blue-300 leading-relaxed">
            The Common Excel workbook contains institutional master configurations only (Departments, Sections, Batches, Semesters, Subjects, Evaluation Scales). It does <strong>NOT</strong> mix individual students' marks or grades from different sections. Student academic marks/grades are maintained strictly within section-specific workbooks.
          </p>
        </div>
      </div>

      {msg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{msg}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Excel Viewer Preview */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Eye className="w-4 h-4 text-blue-400" />
            Live Preview: Academic_Common_Data.xlsx
          </h3>
          <button
            onClick={loadPreview}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {loadingPreview ? (
          <div className="py-20 text-center text-xs text-slate-400">
            Generating common workbook preview...
          </div>
        ) : previewData ? (
          <ExcelViewer data={previewData} />
        ) : (
          <div className="py-20 text-center text-xs text-slate-400">
            Unable to load preview.
          </div>
        )}
      </div>
    </div>
  );
};
