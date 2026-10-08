import React, { useState, useEffect } from 'react';
import { BookOpen, Plus, Edit2, CheckCircle2, XCircle, Search, RefreshCw, AlertCircle, Building2, Sliders, CheckSquare, Square } from 'lucide-react';
import { Subject, Department, Section } from '../types';
import { fetchApi } from '../api';

export const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filters
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  // Add / Edit Modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingSub, setEditingSub] = useState<Subject | null>(null);
  const [subjectCode, setSubjectCode] = useState<string>('');
  const [subjectName, setSubjectName] = useState<string>('');
  const [semesterNumber, setSemesterNumber] = useState<number>(1);
  const [credits, setCredits] = useState<number>(3);
  const [deptId, setDeptId] = useState<string>('dept_cse');
  const [batch, setBatch] = useState<string>('2020-2024');
  const [subjectType, setSubjectType] = useState<'Theory' | 'Laboratory' | 'Project' | 'Elective'>('Theory');
  const [saving, setSaving] = useState<boolean>(false);
  const [msg, setMsg] = useState<string>('');
  const [error, setError] = useState<string>('');

  // Section Config Modal
  const [showSectionModal, setShowSectionModal] = useState<boolean>(false);
  const [targetSectionId, setTargetSectionId] = useState<string>('');
  const [sectionSubjectsList, setSectionSubjectsList] = useState<Array<Subject & { is_assigned?: boolean }>>([]);
  const [loadingSectionSubs, setLoadingSectionSubs] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [subRes, deptRes, secRes] = await Promise.all([
        fetchApi<{ subjects: Subject[] }>('/subjects'),
        fetchApi<{ departments: Department[] }>('/departments'),
        fetchApi<{ sections: Section[] }>('/sections')
      ]);
      setSubjects(subRes.subjects);
      setDepartments(deptRes.departments);
      setSections(secRes.sections);
    } catch (err: any) {
      setError(err.message || 'Failed to load subjects data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openAddModal = () => {
    setEditingSub(null);
    setSubjectCode('');
    setSubjectName('');
    setSemesterNumber(1);
    setCredits(3);
    setDeptId(selectedDeptId || (departments[0]?.id || 'dept_cse'));
    setBatch('2020-2024');
    setSubjectType('Theory');
    setError('');
    setShowModal(true);
  };

  const openEditModal = (s: Subject) => {
    setEditingSub(s);
    setSubjectCode(s.subject_code);
    setSubjectName(s.subject_name);
    setSemesterNumber(s.semester_number);
    setCredits(s.credits);
    setDeptId(s.department_id || 'dept_cse');
    setBatch(s.batch || '2020-2024');
    setSubjectType(s.subject_type || 'Theory');
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectCode.trim() || !subjectName.trim()) {
      setError('Subject Code and Subject Name are required');
      return;
    }

    setSaving(true);
    setError('');
    try {
      const payload = {
        subject_code: subjectCode.trim().toUpperCase(),
        subject_name: subjectName.trim(),
        semester_number: semesterNumber,
        credits,
        department_id: deptId,
        batch,
        subject_type: subjectType
      };

      if (editingSub) {
        await fetchApi(`/subjects/${editingSub.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setMsg(`Subject ${payload.subject_code} updated successfully`);
      } else {
        await fetchApi('/subjects', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
        setMsg(`Subject ${payload.subject_code} added successfully`);
      }
      setShowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.message || 'Error saving subject');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (s: Subject) => {
    try {
      await fetchApi(`/subjects/${s.id}/toggle-status`, { method: 'PATCH' });
      loadData();
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  // Section Subject Assignment Flow
  const openSectionConfig = async (secId: string) => {
    setTargetSectionId(secId);
    setShowSectionModal(true);
    setLoadingSectionSubs(true);
    try {
      const data = await fetchApi<{ subjects: Array<Subject & { is_assigned?: boolean }> }>(`/subjects/section/${secId}`);
      setSectionSubjectsList(data.subjects);
    } catch (err: any) {
      alert('Failed to load section subjects: ' + err.message);
    } finally {
      setLoadingSectionSubs(false);
    }
  };

  const toggleSectionSubject = (subId: string) => {
    setSectionSubjectsList(prev => 
      prev.map(s => s.id === subId ? { ...s, is_assigned: !s.is_assigned } : s)
    );
  };

  const saveSectionSubjects = async () => {
    try {
      const assignedIds = sectionSubjectsList.filter(s => s.is_assigned).map(s => s.id);
      await fetchApi(`/subjects/section/${targetSectionId}/assign`, {
        method: 'POST',
        body: JSON.stringify({ subject_ids: assignedIds })
      });
      setShowSectionModal(false);
      setMsg('Section-specific curriculum updated successfully');
    } catch (err: any) {
      alert('Error saving section subjects: ' + err.message);
    }
  };

  const filtered = subjects.filter(s => {
    if (selectedDeptId && s.department_id !== selectedDeptId) return false;
    if (selectedSemester && s.semester_number !== parseInt(selectedSemester)) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        s.subject_code.toLowerCase().includes(q) ||
        s.subject_name.toLowerCase().includes(q) ||
        (s.subject_type && s.subject_type.toLowerCase().includes(q))
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
            <BookOpen className="w-5 h-5 text-purple-400" /> Subject Management & Curriculum Configuration
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure dynamic semester-wise subjects, credits, syllabus types, and section-specific curriculum assignments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {sections.length > 0 && (
            <button
              onClick={() => openSectionConfig(sections[0].id)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition duration-150 cursor-pointer"
            >
              <Sliders className="w-4 h-4 text-indigo-400" /> Section Curriculum
            </button>
          )}
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-sm shadow-lg shadow-purple-600/30 transition duration-150 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Subject
          </button>
        </div>
      </div>

      {msg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {msg}
        </div>
      )}

      {/* Filter / Search Bar */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Department
          </label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-purple-500"
          >
            <option value="">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Semester
          </label>
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-medium focus:outline-none focus:border-purple-500"
          >
            <option value="">All Semesters (1-8)</option>
            {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
              <option key={s} value={s}>Semester {s}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Search
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by code, title, or type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Subject Name</th>
                <th className="py-3 px-4 text-center">Semester</th>
                <th className="py-3 px-4 text-center">Credits</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Curriculum / Batch</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    Loading subjects...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 text-xs">
                    No subjects found matching current filter.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-purple-400">{s.subject_code}</td>
                    <td className="py-3 px-4 font-semibold text-slate-100">{s.subject_name}</td>
                    <td className="py-3 px-4 text-center font-bold text-blue-400">Sem {s.semester_number}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-slate-800 text-amber-300 font-bold text-xs">
                        {s.credits} cr
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs">
                      <span className={`px-2 py-0.5 rounded-md font-medium text-[11px] ${
                        s.subject_type === 'Laboratory'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : s.subject_type === 'Project'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : s.subject_type === 'Elective'
                          ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {s.subject_type || 'Theory'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{s.batch || '2020-2024'}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {s.status === 'ACTIVE' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                        {s.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(s)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3 text-purple-400" /> Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(s)}
                        className={`px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
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

      {/* Add / Edit Subject Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              {editingSub ? 'Edit Subject' : 'Add New Subject'}
            </h3>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" /> {error}
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Subject Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. CS8591"
                    value={subjectCode}
                    onChange={(e) => setSubjectCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500 uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Semester (1-8) *
                  </label>
                  <select
                    value={semesterNumber}
                    onChange={(e) => setSemesterNumber(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                      <option key={s} value={s}>Semester {s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Subject Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Computer Networks"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Credits *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="15"
                    required
                    value={credits}
                    onChange={(e) => setCredits(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Subject Type
                  </label>
                  <select
                    value={subjectType}
                    onChange={(e: any) => setSubjectType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="Theory">Theory</option>
                    <option value="Laboratory">Laboratory</option>
                    <option value="Project">Project</option>
                    <option value="Elective">Elective</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Batch
                  </label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Department
                </label>
                <select
                  value={deptId}
                  onChange={(e) => setDeptId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
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
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-60"
                >
                  {saving ? 'Saving...' : editingSub ? 'Update Subject' : 'Create Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Section-Specific Curriculum Assignment Modal */}
      {showSectionModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-indigo-400" />
                Assign Subjects to Section
              </h3>
              <select
                value={targetSectionId}
                onChange={(e) => openSectionConfig(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white"
              >
                {sections.map(s => (
                  <option key={s.id} value={s.id}>{s.section_code} - {s.section_name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 overflow-y-auto my-4 space-y-2 pr-1">
              {loadingSectionSubs ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading section subjects...</div>
              ) : (
                sectionSubjectsList.map(sub => (
                  <div
                    key={sub.id}
                    onClick={() => toggleSectionSubject(sub.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border transition cursor-pointer select-none ${
                      sub.is_assigned
                        ? 'bg-indigo-600/10 border-indigo-500/40 text-white'
                        : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {sub.is_assigned ? (
                        <CheckSquare className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-600 flex-shrink-0" />
                      )}
                      <div>
                        <div className="font-semibold text-xs flex items-center gap-2">
                          <span className="font-mono text-indigo-400">{sub.subject_code}</span>
                          <span>{sub.subject_name}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Sem {sub.semester_number} • {sub.credits} Credits • {sub.subject_type || 'Theory'}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-md bg-slate-800">
                      Sem {sub.semester_number}
                    </span>
                  </div>
                ))
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <span className="text-xs text-slate-400">
                Assigned: <strong className="text-white">{sectionSubjectsList.filter(s => s.is_assigned).length}</strong> / {sectionSubjectsList.length} subjects
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSectionModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={saveSectionSubjects}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 cursor-pointer"
                >
                  Save Section Curriculum
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
