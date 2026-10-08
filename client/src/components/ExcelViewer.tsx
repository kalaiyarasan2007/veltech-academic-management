import React, { useState } from 'react';
import { Eye, FileSpreadsheet, Download, RefreshCw, Layers } from 'lucide-react';

interface ExcelPreviewCell {
  row: number;
  col: number;
  value: string;
  formula?: string;
  color?: string | null;
  isHeader?: boolean;
}

interface ExcelPreviewSheet {
  name: string;
  colLetters: string[];
  rows: Array<{
    rowNumber: number;
    cells: ExcelPreviewCell[];
  }>;
}

interface ExcelViewerProps {
  previewData?: { sheets: ExcelPreviewSheet[] } | null;
  data?: { sheets: ExcelPreviewSheet[] } | null;
  loading?: boolean;
  onRefresh?: () => void;
  onDownload?: () => void;
}

export const ExcelViewer: React.FC<ExcelViewerProps> = ({
  previewData: propPreviewData,
  data: propData,
  loading = false,
  onRefresh,
  onDownload
}) => {
  const previewData = propPreviewData || propData;
  const [activeSheetIndex, setActiveSheetIndex] = useState<number>(0);

  if (loading) {
    return (
      <div className="glass-panel p-12 rounded-2xl border border-slate-800 text-center space-y-3">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mx-auto"></div>
        <p className="text-sm font-semibold text-slate-300">Generating Interactive Excel Sheet Preview...</p>
        <p className="text-xs text-slate-500">Processing worksheets, formulas, and semester fill colors</p>
      </div>
    );
  }

  if (!previewData || !previewData.sheets || previewData.sheets.length === 0) {
    return null;
  }

  const currentSheet = previewData.sheets[activeSheetIndex] || previewData.sheets[0];

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 shadow-2xl">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Eye className="w-4 h-4" /> Live Interactive Spreadsheet Preview
          </div>
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> {currentSheet.name} Worksheet Preview
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing exact row/column values, formulas, and semester colors matching faculty Excel template.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Preview
          </button>
          <button
            onClick={onDownload}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition"
          >
            <Download className="w-3.5 h-3.5" /> Download (.xlsx)
          </button>
        </div>
      </div>

      {/* Sheet Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-2">
        <span className="text-xs text-slate-400 font-semibold flex items-center gap-1 mr-2">
          <Layers className="w-3.5 h-3.5" /> Worksheets:
        </span>
        {previewData.sheets.map((sheet, idx) => (
          <button
            key={sheet.name}
            onClick={() => setActiveSheetIndex(idx)}
            className={`px-3.5 py-1.5 rounded-t-lg text-xs font-bold transition whitespace-nowrap border-t border-x ${
              activeSheetIndex === idx
                ? 'bg-slate-800 text-emerald-400 border-emerald-500/40 border-b-2 border-b-emerald-400'
                : 'bg-slate-900/60 text-slate-400 border-slate-800 hover:bg-slate-800/40 hover:text-slate-200'
            }`}
          >
            {sheet.name}
          </button>
        ))}
      </div>

      {/* Excel Spreadsheet Grid Viewer */}
      <div className="overflow-auto max-h-[600px] border border-slate-800 rounded-xl bg-slate-950 font-mono text-xs">
        <table className="w-full text-left border-collapse min-w-max">
          <thead>
            <tr className="bg-slate-900 sticky top-0 z-20 border-b border-slate-800 text-slate-400">
              <th className="p-2 border-r border-slate-800 text-center w-12 bg-slate-900 sticky left-0 z-30 font-semibold text-slate-500">
                #
              </th>
              {currentSheet.colLetters.map(colLet => (
                <th key={colLet} className="px-3 py-1.5 border-r border-slate-800 text-center font-bold text-slate-300 min-w-[70px]">
                  {colLet}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {currentSheet.rows.map(row => (
              <tr key={row.rowNumber} className="hover:bg-slate-900/40 transition">
                {/* Row Number Column */}
                <td className="p-2 border-r border-slate-800 text-center font-bold text-slate-500 bg-slate-900 sticky left-0 z-10">
                  {row.rowNumber}
                </td>

                {/* Data Cells */}
                {row.cells.map(cell => {
                  const hasColor = !!cell.color;
                  return (
                    <td
                      key={`${cell.row}_${cell.col}`}
                      className={`px-2 py-1.5 border-r border-slate-800/80 text-xs truncate max-w-[200px] ${
                        cell.isHeader ? 'font-bold text-slate-200 bg-slate-900/80' : 'text-slate-300'
                      }`}
                      style={{
                        backgroundColor: hasColor ? `${cell.color}40` : undefined,
                        color: hasColor ? (cell.color === '#FFFF00' ? '#FEF08A' : cell.color || undefined) : undefined,
                        borderLeft: hasColor ? `3px solid ${cell.color}` : undefined
                      }}
                      title={cell.formula || cell.value}
                    >
                      {cell.value}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
        <span>Rows displayed: {currentSheet.rows.length}</span>
        <span>Hover over cells with calculated values to view underlying Excel formulas</span>
      </div>
    </div>
  );
};
