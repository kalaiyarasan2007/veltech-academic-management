import React, { useState, useEffect } from 'react';
import { Calendar, Edit2, CheckCircle2, RefreshCw, Palette } from 'lucide-react';
import { Semester } from '../types';
import { fetchApi } from '../api';

export const SemesterManagement: React.FC = () => {
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingSem, setEditingSem] = useState<Semester | null>(null);
  const [examMonth, setExamMonth] = useState<string>('June');
  const [examYear, setExamYear] = useState<string>('2024');
  const [color, setColor] = useState<string>('#92D050');
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');

  const loadSemesters = async () => {
    setLoading(true);
    try {
      const data = await fetchApi<{ semesters: Semester[] }>('/academic/semesters');
      setSemesters(data.semesters);
    } catch (err: any) {
      console.error('Failed to load semesters:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSemesters();
  }, []);

  const openEdit = (s: Semester) => {
    setEditingSem(s);
    setExamMonth(s.exam_month);
    setExamYear(s.exam_year);
    setColor(s.color || '#92D050');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSem) return;
    setSaving(true);
    try {
      await fetchApi(`/academic/semesters/${editingSem.id}`, {
        method: 'PUT',
        body: JSON.stringify({ exam_month: examMonth, exam_year: examYear, color })
      });
      setMsg(`Semester ${editingSem.semester_number} configuration updated`);
      setEditingSem(null);
      loadSemesters();
    } catch (err: any) {
      alert('Error updating semester: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" /> Semester Master Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure examination schedules, exam months, years, and visual highlight colors matching the original faculty Excel.
          </p>
        </div>
        <button
          onClick={loadSemesters}
          className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {msg}
        </div>
      )}

      {/* Grid of 8 Semesters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {semesters.map(sem => (
          <div
            key={sem.id}
            className="glass-panel p-5 rounded-2xl border border-slate-800 hover:border-slate-700 transition flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Semester {sem.semester_number}
                </span>
                <div
                  className="w-5 h-5 rounded-md border border-slate-700 shadow-sm"
                  style={{ backgroundColor: sem.color || '#334155' }}
                  title={`Color: ${sem.color}`}
                />
              </div>

              <h3 className="text-lg font-bold text-white mb-1">
                Semester {sem.semester_number} Examination
              </h3>
              <p className="text-xs text-slate-400">
                Exam Session: <span className="font-semibold text-slate-200">{sem.exam_month} {sem.exam_year}</span>
              </p>
              <div className="mt-2 text-[11px] text-slate-400">
                Color Swatch: <code className="text-emerald-400 font-mono">{sem.color}</code>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => openEdit(sem)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" /> Edit Session
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingSem && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-400" />
              Configure Semester {editingSem.semester_number}
            </h3>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Exam Month
                </label>
                <select
                  value={examMonth}
                  onChange={(e) => setExamMonth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                >
                  {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Exam Year
                </label>
                <input
                  type="text"
                  required
                  value={examYear}
                  onChange={(e) => setExamYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Highlight Color (Hex)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="w-10 h-10 rounded-lg cursor-pointer bg-slate-950 border border-slate-700"
                  />
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingSem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
