import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Arrear } from '../types';
import { AlertTriangle, CheckCircle, Search, Filter, Check, X } from 'lucide-react';

export const ArrearManagement: React.FC = () => {
  const [arrears, setArrears] = useState<Arrear[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [semesterFilter, setSemesterFilter] = useState<string>('ALL');

  // Modal state for manual clearance
  const [selectedArrear, setSelectedArrear] = useState<Arrear | null>(null);
  const [clearSemester, setClearSemester] = useState<number>(2);
  const [clearGrade, setClearGrade] = useState<string>('B+');
  const [clearMonth, setClearMonth] = useState<string>('June');
  const [clearYear, setClearYear] = useState<string>('2024');
  const [clearing, setClearing] = useState<boolean>(false);

  const loadArrears = () => {
    setLoading(true);
    let url = '/arrears?';
    if (statusFilter !== 'ALL') url += `status=${statusFilter}&`;
    if (semesterFilter !== 'ALL') url += `semester_number=${semesterFilter}&`;

    fetchApi<{ arrears: Arrear[] }>(url)
      .then(res => setArrears(res.arrears))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadArrears();
  }, [statusFilter, semesterFilter]);

  const filteredArrears = arrears.filter(a => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      a.register_number.toLowerCase().includes(q) ||
      (a.student_name && a.student_name.toLowerCase().includes(q)) ||
      a.subject_code.toLowerCase().includes(q) ||
      a.subject_name.toLowerCase().includes(q) ||
      (a.original_grade && a.original_grade.toLowerCase().includes(q)) ||
      (a.cleared_grade && a.cleared_grade.toLowerCase().includes(q)) ||
      (a.status && a.status.toLowerCase().includes(q)) ||
      `sem ${a.original_semester}`.includes(q) ||
      `semester ${a.original_semester}`.includes(q) ||
      String(a.original_semester) === q ||
      (a.cleared_semester && (String(a.cleared_semester) === q || `sem ${a.cleared_semester}`.includes(q))) ||
      (q.includes('pending') && a.status === 'PENDING') ||
      (q.includes('clear') && a.status === 'CLEARED')
    );
  });

  const handleClearSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedArrear) return;
    setClearing(true);

    try {
      await fetchApi('/arrears/clear', {
        method: 'POST',
        body: JSON.stringify({
          arrear_id: selectedArrear.id,
          cleared_semester: clearSemester,
          cleared_grade: clearGrade,
          cleared_month: clearMonth,
          cleared_year: clearYear
        })
      });

      setSelectedArrear(null);
      loadArrears();
    } catch (err) {
      alert('Error clearing arrear: ' + err);
    } finally {
      setClearing(false);
    }
  };

  const gradeOptions = ['O', 'A+', 'A', 'B+', 'B', 'C'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" /> Arrear Management & Tracking
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete database of student arrears, original attempt records, and clearance history.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full sm:w-48">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter Reg No, Name, Subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING">Pending Only</option>
            <option value="CLEARED">Cleared Only</option>
          </select>

          <select
            value={semesterFilter}
            onChange={(e) => setSemesterFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-semibold focus:outline-none focus:border-blue-500"
          >
            <option value="ALL">All Semesters</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Arrear Table */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
            Showing {filteredArrears.length} Arrear Records
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="pb-3 font-semibold">Register No</th>
                  <th className="pb-3 font-semibold">Student Name</th>
                  <th className="pb-3 font-semibold">Subject</th>
                  <th className="pb-3 font-semibold text-center">Original Sem</th>
                  <th className="pb-3 font-semibold text-center">Orig Grade</th>
                  <th className="pb-3 font-semibold text-center">Cleared Sem</th>
                  <th className="pb-3 font-semibold text-center">Cleared Grade</th>
                  <th className="pb-3 font-semibold text-center">Status</th>
                  <th className="pb-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredArrears.map(arr => (
                  <tr key={arr.id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-mono text-xs font-bold text-slate-200">{arr.register_number}</td>
                    <td className="py-3 font-medium text-slate-200">{arr.student_name || 'Student'}</td>
                    <td className="py-3">
                      <p className="font-mono font-bold text-blue-400 text-xs">{arr.subject_code}</p>
                      <p className="text-xs text-slate-400">{arr.subject_name}</p>
                    </td>
                    <td className="py-3 text-center text-xs font-semibold text-slate-300">
                      Semester {arr.original_semester}
                    </td>
                    <td className="py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                        {arr.original_grade}
                      </span>
                    </td>
                    <td className="py-3 text-center text-xs font-semibold text-slate-300">
                      {arr.cleared_semester ? `Semester ${arr.cleared_semester}` : '-'}
                    </td>
                    <td className="py-3 text-center">
                      {arr.cleared_grade ? (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {arr.cleared_grade}
                        </span>
                      ) : '-'}
                    </td>
                    <td className="py-3 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        arr.status === 'CLEARED'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {arr.status === 'CLEARED' ? <CheckCircle className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                        {arr.status}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      {arr.status === 'PENDING' ? (
                        <button
                          onClick={() => {
                            setSelectedArrear(arr);
                            setClearSemester(arr.original_semester + 1);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition"
                        >
                          Clear Arrear
                        </button>
                      ) : (
                        <span className="text-xs text-slate-500">Cleared</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Arrear Clearance Modal */}
      {selectedArrear && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-lg text-white">Record Arrear Clearance</h3>
              <button onClick={() => setSelectedArrear(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
              <p><span className="text-slate-400">Student:</span> <strong className="text-slate-200">{selectedArrear.student_name}</strong> ({selectedArrear.register_number})</p>
              <p><span className="text-slate-400">Subject:</span> <strong className="text-blue-400">{selectedArrear.subject_code}</strong> - {selectedArrear.subject_name}</p>
              <p><span className="text-slate-400">Original Attempt:</span> Semester {selectedArrear.original_semester} ({selectedArrear.original_grade})</p>
            </div>

            <form onSubmit={handleClearSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">Cleared in Semester</label>
                <select
                  value={clearSemester}
                  onChange={(e) => setClearSemester(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-semibold focus:outline-none"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                    <option key={s} value={s}>Semester {s}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">Clearance Grade</label>
                <select
                  value={clearGrade}
                  onChange={(e) => setClearGrade(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-bold text-emerald-400 focus:outline-none"
                >
                  {gradeOptions.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">Clearance Month</label>
                  <select
                    value={clearMonth}
                    onChange={(e) => setClearMonth(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 uppercase tracking-wider mb-1">Clearance Year</label>
                  <select
                    value={clearYear}
                    onChange={(e) => setClearYear(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 focus:outline-none"
                  >
                    {['2021', '2022', '2023', '2024', '2025', '2026'].map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedArrear(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={clearing}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-600/30"
                >
                  {clearing ? 'Saving...' : 'Confirm Clearance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
