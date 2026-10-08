import React, { useState, useEffect } from 'react';
import { Layers, Plus, Edit2, CheckCircle2, XCircle, Search, RefreshCw, AlertCircle, Building2, Users } from 'lucide-react';
import { Section, Department } from '../types';
import { fetchApi } from '../api';

export const SectionManagement: React.FC = () => {
  const [sections, setSections] = useState<Section[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSection, setEditingSection] = useState<Section | null>(null);

  // Form states
  const [deptId, setDeptId] = useState<string>('');
  const [sectionName, setSectionName] = useState<string>('');
  const [sectionCode, setSectionCode] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');
  const [error, setError] = useState<string>('');

  const loadData = async () => {
    setLoading(true);
    try {
      const [deptRes, secRes] = await Promise.all([
        fetchApi<{ departments: Department[] }>('/departments'),
        fetchApi<{ sections: Section[] }>('/sections')
      ]);
      setDepartments(deptRes.departments);
      setSections(secRes.sections);
      if (deptRes.departments.length > 0 && !selectedDeptId) {
        setSelectedDeptId(''); // Default to 'All'
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sections data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingSection(null);
    setDeptId(selectedDeptId || (departments[0]?.id || 'dept_cse'));
    setSectionName('');
    setSectionCode('');
    setError('');
    setMsg('');
    setShowModal(true);
  };

  const openEditModal = (s: Section) => {
    setEditingSection(s);
    setDeptId(s.department_id);
    setSectionName(s.section_name);
    setSectionCode(s.section_code);
    setError('');
    setMsg('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptId || !sectionName.trim()) {
      setError('Department and Section Name are required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const code = sectionCode.trim().toUpperCase() || sectionName.trim().toUpperCase();
      if (editingSection) {
        await fetchApi(`/sections/${editingSection.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            department_id: deptId,
            section_name: sectionName.trim(),
            section_code: code
          })
        });
        setMsg(`Section ${code} updated successfully`);
      } else {
        await fetchApi('/sections', {
          method: 'POST',
          body: JSON.stringify({
            department_id: deptId,
            section_name: sectionName.trim(),
            section_code: code
          })
        });
        setMsg(`Section ${code} created successfully`);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error saving section');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (s: Section) => {
    try {
      await fetchApi(`/sections/${s.id}/toggle-status`, { method: 'PATCH' });
      loadData();
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const filtered = sections.filter(s => {
    if (selectedDeptId && s.department_id !== selectedDeptId) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.section_name.toLowerCase().includes(q) ||
        s.section_code.toLowerCase().includes(q) ||
        (s.department_name && s.department_name.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" /> Section Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure section cohorts per department (e.g. CSE-A, CSE-B, CSE-C, ECE-A). Academic data is strictly isolated per section.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition duration-150 cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm shadow-lg shadow-indigo-600/30 transition duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Section
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {msg}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5" /> Department:
          </label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.code})
              </option>
            ))}
          </select>
        </div>

        <div className="relative flex-1 max-w-md w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
          <input
            type="text"
            placeholder="Search sections by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">S.No</th>
                <th className="py-3 px-4">Section Code</th>
                <th className="py-3 px-4">Section Name</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4 text-center">Enrolled Students</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    Loading sections...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                    No sections found.
                  </td>
                </tr>
              ) : (
                filtered.map((s, index) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-400">{index + 1}</td>
                    <td className="py-3.5 px-4 font-bold text-indigo-400 tracking-wider">{s.section_code}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-100">{s.section_name}</td>
                    <td className="py-3.5 px-4 text-xs text-slate-300">
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 font-medium">
                        {s.department_code || s.department_name}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-200 text-xs font-semibold">
                        <Users className="w-3 h-3 text-slate-400" />
                        {s.student_count ?? 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {s.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3.5 h-3.5 text-indigo-400" /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                          s.status === 'ACTIVE'
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20'
                            : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20'
                        }`}
                      >
                        {s.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" />
              {editingSection ? 'Edit Section' : 'Add New Section'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" /> {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Department *
                </label>
                <select
                  required
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Section Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE-A, CSE-B, ECE-A"
                  value={sectionCode}
                  onChange={(e) => setSectionCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Section Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. CSE Section A"
                  value={sectionName}
                  onChange={(e) => setSectionName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingSection ? 'Update Section' : 'Create Section'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
