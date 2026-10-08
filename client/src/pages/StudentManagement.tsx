import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Student, Department, Section } from '../types';
import { Users, UserPlus, Search, Edit3, Trash2, CheckCircle2, AlertCircle, Building2, Layers } from 'lucide-react';

export const StudentManagement: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtering states: Department -> Section
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedSecId, setSelectedSecId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Form Fields
  const [regNo, setRegNo] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [rollNo, setRollNo] = useState<string>('');
  const [formDeptId, setFormDeptId] = useState<string>('dept_cse');
  const [formSecId, setFormSecId] = useState<string>('sec_cse_a');
  const [batch, setBatch] = useState<string>('2020-2024');
  const [academicYear, setAcademicYear] = useState<string>('2020-2024');

  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  // 1. Initial Load: Departments & Sections
  useEffect(() => {
    Promise.all([
      fetchApi<{ departments: Department[] }>('/departments'),
      fetchApi<{ sections: Section[] }>('/sections')
    ]).then(([deptRes, secRes]) => {
      setDepartments(deptRes.departments);
      setSections(secRes.sections);
      if (deptRes.departments.length > 0) {
        setSelectedDeptId(deptRes.departments[0].id);
      }
      if (secRes.sections.length > 0) {
        setSelectedSecId(secRes.sections[0].id);
      }
    }).catch(console.error);
  }, []);

  // Update selected section when department changes
  useEffect(() => {
    if (selectedDeptId) {
      const deptSecs = sections.filter(s => s.department_id === selectedDeptId);
      if (deptSecs.length > 0) {
        if (!deptSecs.some(s => s.id === selectedSecId)) {
          setSelectedSecId(deptSecs[0].id);
        }
      }
    }
  }, [selectedDeptId, sections]);

  // 2. Fetch Students filtered by section
  const loadStudents = () => {
    setLoading(true);
    let url = '/students';
    const params = new URLSearchParams();
    if (selectedDeptId) params.append('department_id', selectedDeptId);
    if (selectedSecId) params.append('section_id', selectedSecId);
    if (params.toString()) url += `?${params.toString()}`;

    fetchApi<{ students: Student[] }>(url)
      .then(res => setStudents(res.students))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (selectedSecId) {
      loadStudents();
    }
  }, [selectedDeptId, selectedSecId]);

  const openAddModal = () => {
    setEditingStudent(null);
    setRegNo('');
    setName('');
    setRollNo('');
    setFormDeptId(selectedDeptId || (departments[0]?.id || 'dept_cse'));
    setFormSecId(selectedSecId || (sections[0]?.id || 'sec_cse_a'));
    setBatch('2020-2024');
    setAcademicYear('2020-2024');
    setErrorMsg('');
    setSuccessMsg('');
    setIsAddModalOpen(true);
  };

  const openEditModal = (std: Student) => {
    setEditingStudent(std);
    setRegNo(std.register_number);
    setName(std.name);
    setRollNo(std.roll_number);
    setFormDeptId(std.department_id || selectedDeptId || 'dept_cse');
    setFormSecId(std.section_id || selectedSecId || 'sec_cse_a');
    setBatch(std.batch);
    setAcademicYear(std.academic_year || '2020-2024');
    setErrorMsg('');
    setSuccessMsg('');
    setIsAddModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const selectedSec = sections.find(s => s.id === formSecId);
      const selectedDept = departments.find(d => d.id === formDeptId);

      const payload = {
        name,
        roll_number: rollNo,
        batch,
        department_id: formDeptId,
        department: selectedDept?.name,
        section_id: formSecId,
        section: selectedSec?.section_code,
        academic_year: academicYear
      };

      if (editingStudent) {
        await fetchApi(`/students/${editingStudent.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
        setSuccessMsg(`Student ${name} updated successfully`);
      } else {
        await fetchApi('/students', {
          method: 'POST',
          body: JSON.stringify({
            register_number: regNo,
            ...payload
          })
        });
        setSuccessMsg(`Student ${name} added successfully`);
      }
      setIsAddModalOpen(false);
      loadStudents();
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (std: Student) => {
    if (!window.confirm(`Are you sure you want to delete student ${std.name} (${std.register_number})?`)) {
      return;
    }
    try {
      await fetchApi(`/students/${std.id}`, { method: 'DELETE' });
      setSuccessMsg(`Student ${std.name} deleted successfully`);
      loadStudents();
    } catch (err: any) {
      alert('Delete failed: ' + err.message);
    }
  };

  // Local search filter
  const filteredStudents = students.filter(s => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return s.register_number.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.roll_number && s.roll_number.toLowerCase().includes(q));
  });

  const availableSections = sections.filter(s => !selectedDeptId || s.department_id === selectedDeptId);
  const activeSectionObj = sections.find(s => s.id === selectedSecId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" /> Section-Wise Student Directory
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage students with strict section separation. Selecting a section displays ONLY its enrolled students.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition duration-150 cursor-pointer"
        >
          <UserPlus className="w-4 h-4" /> Add Student
        </button>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {successMsg}
        </div>
      )}

      {/* Department & Section Selectors (Requirement 15: Select Department -> Section -> Show ONLY that section) */}
      <div className="glass-panel p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-400" /> 1. Select Department
          </label>
          <select
            value={selectedDeptId}
            onChange={(e) => setSelectedDeptId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-blue-500"
          >
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" /> 2. Select Section
          </label>
          <select
            value={selectedSecId}
            onChange={(e) => setSelectedSecId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 font-medium focus:outline-none focus:border-indigo-500"
          >
            {availableSections.map(s => (
              <option key={s.id} value={s.id}>{s.section_code} - {s.section_name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" /> Search Student
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search Reg No or Name in section..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Section Summary Badge */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <div>
          Currently viewing: <strong className="text-white">{activeSectionObj?.section_code || 'Selected Section'}</strong> ({filteredStudents.length} Students)
        </div>
        <div className="text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          Strict Section Isolation Active
        </div>
      </div>

      {/* Student List Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">S.No</th>
                <th className="py-3 px-4">Register Number</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Roll Number</th>
                <th className="py-3 px-4 text-center">Section</th>
                <th className="py-3 px-4">Batch</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    Loading section students...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                    No students found in this section. Click "Add Student" to enroll.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((std, idx) => (
                  <tr key={std.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-mono font-bold text-slate-100">{std.register_number}</td>
                    <td className="py-3 px-4 font-semibold text-white">{std.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-slate-400">{std.roll_number || '—'}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 font-bold text-xs border border-indigo-500/20">
                        {std.section_code || std.section || activeSectionObj?.section_code}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{std.batch}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {std.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => openEditModal(std)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(std)}
                        className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium transition cursor-pointer inline-flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              {editingStudent ? 'Edit Student Details' : 'Add New Student to Section'}
            </h3>

            {errorMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400" /> {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Register Number *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingStudent}
                    placeholder="e.g. 113020104001"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20CS001"
                    value={rollNo}
                    onChange={(e) => setRollNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                  Full Student Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AADITHIYAN B"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 uppercase"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Department *
                  </label>
                  <select
                    value={formDeptId}
                    onChange={(e) => setFormDeptId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Section Assignment *
                  </label>
                  <select
                    value={formSecId}
                    onChange={(e) => setFormSecId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    {sections.filter(s => !formDeptId || s.department_id === formDeptId).map(s => (
                      <option key={s.id} value={s.id}>{s.section_code} - {s.section_name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Batch
                  </label>
                  <input
                    type="text"
                    value={batch}
                    onChange={(e) => setBatch(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    Academic Year
                  </label>
                  <input
                    type="text"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-60"
                >
                  {submitting ? 'Saving...' : editingStudent ? 'Update Student' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
