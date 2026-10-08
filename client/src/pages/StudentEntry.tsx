import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Student, Department, Section } from '../types';
import { BookOpen, CheckCircle2, AlertTriangle, Save, Building2, Layers, User, Award, Calculator, Calendar } from 'lucide-react';
import { SearchableStudentSelect } from '../components/SearchableStudentSelect';

export const StudentEntry: React.FC = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Selection Hierarchy: Department -> Section -> Student -> Semester
  const [selectedDeptId, setSelectedDeptId] = useState<string>('');
  const [selectedSecId, setSelectedSecId] = useState<string>('');
  const [selectedRegNo, setSelectedRegNo] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<number>(1);
  const [examMonth, setExamMonth] = useState<string>('June');
  const [examYear, setExamYear] = useState<string>('2024');

  // Selected Student Details
  const [studentDetails, setStudentDetails] = useState<Student | null>(null);

  // Section A: Current Semester Regular Subjects
  const [regularSubjects, setRegularSubjects] = useState<Array<{
    subject_id?: string;
    subject_code: string;
    subject_name: string;
    credits: number;
    grade: string;
    grade_point: number;
  }>>([]);

  // Section B: Pending Previous Semester Arrears
  const [pendingArrears, setPendingArrears] = useState<Array<{
    arrear_id: string;
    subject_id?: string;
    subject_code: string;
    subject_name: string;
    original_semester: number;
    original_grade: string;
    original_month: string;
    original_year: string;
    cleared_grade: string;
    cleared_grade_point?: number;
  }>>([]);

  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const gradeOptions = ['O', 'A+', 'A', 'B+', 'B', 'C', 'RA', 'WH', 'AB', 'WD'];

  const getGradePoint = (grade: string): number => {
    switch (grade) {
      case 'O': return 10;
      case 'A+': return 9;
      case 'A': return 8;
      case 'B+': return 7;
      case 'B': return 6;
      case 'C': return 5;
      default: return 0; // RA, WH, AB, WD
    }
  };

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

  // Update sections when department changes
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

  // 2. Fetch Students for the selected section ONLY (strict section separation)
  useEffect(() => {
    if (!selectedSecId) return;
    fetchApi<{ students: Student[] }>(`/students?section_id=${selectedSecId}`)
      .then(res => {
        setStudents(res.students);
        if (res.students.length > 0) {
          setSelectedRegNo(res.students[0].register_number);
        } else {
          setSelectedRegNo('');
          setStudentDetails(null);
          setRegularSubjects([]);
          setPendingArrears([]);
        }
      })
      .catch(console.error);
  }, [selectedSecId]);

  // 3. Fetch Entry View whenever student or semester changes
  useEffect(() => {
    if (!selectedRegNo || !selectedSemester) return;
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    fetchApi<{
      student: Student;
      semester_number: number;
      regular_subjects: any[];
      pending_arrears: any[];
    }>(`/academic/entry-view?register_number=${selectedRegNo}&semester_number=${selectedSemester}`)
      .then(res => {
        setStudentDetails(res.student);
        setRegularSubjects(res.regular_subjects);
        setPendingArrears(res.pending_arrears);
      })
      .catch(err => setErrorMsg(err.message))
      .finally(() => setLoading(false));
  }, [selectedRegNo, selectedSemester]);

  const handleRegularGradeChange = (index: number, newGrade: string) => {
    const updated = [...regularSubjects];
    updated[index].grade = newGrade;
    updated[index].grade_point = getGradePoint(newGrade);
    setRegularSubjects(updated);
  };

  const handleArrearGradeChange = (index: number, newGrade: string) => {
    const updated = [...pendingArrears];
    updated[index].cleared_grade = newGrade;
    updated[index].cleared_grade_point = getGradePoint(newGrade);
    setPendingArrears(updated);
  };

  // Live Calculations (GPA Preview)
  const totalRegularGrade = regularSubjects.reduce((sum, s) => sum + (s.credits * s.grade_point), 0);
  const totalRegularCredits = regularSubjects.reduce((sum, s) => sum + s.credits, 0);
  const gpaPreview = totalRegularCredits > 0 ? (totalRegularGrade / totalRegularCredits).toFixed(2) : '0.00';

  const pendingArrearsCount = regularSubjects.filter(s => ['RA', 'WH', 'AB', 'WD'].includes(s.grade)).length;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRegNo || !selectedSemester) return;
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      await fetchApi('/academic/save-grades', {
        method: 'POST',
        body: JSON.stringify({
          student_id: selectedRegNo,
          semester_number: selectedSemester,
          exam_month: examMonth,
          exam_year: examYear,
          regular_grades: regularSubjects,
          arrear_clearances: pendingArrears
        })
      });

      const secObj = sections.find(s => s.id === selectedSecId);
      const secLabel = secObj ? secObj.section_code : 'Section';
      setSuccessMsg(
        `Academic records saved successfully! Live GPA: ${gpaPreview}. Section Excel (${secLabel}_Academic_Records.xlsx) updated automatically.`
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save grades');
    } finally {
      setSaving(false);
    }
  };

  const availableSections = sections.filter(s => !selectedDeptId || s.department_id === selectedDeptId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-blue-400" /> Student Academic Marks & Grade Entry
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Select Department → Section → Student → Semester to record examination grades, calculate GPA, register arrears, and update the section-specific Excel workbook.
        </p>
      </div>

      {/* Hierarchy Selector: Department -> Section -> Student -> Semester */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> 1. Department
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {departments.map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" /> 2. Section
            </label>
            <select
              value={selectedSecId}
              onChange={(e) => setSelectedSecId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              {availableSections.map(s => (
                <option key={s.id} value={s.id}>{s.section_code} - {s.section_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-400" /> 3. Student ({students.length} in section)
            </label>
            <SearchableStudentSelect
              students={students}
              value={selectedRegNo}
              onChange={(reg) => setSelectedRegNo(reg)}
              placeholder="Search Reg No / Name..."
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" /> 4. Semester
            </label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(Number(e.target.value))}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-100 focus:outline-none focus:border-blue-500"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8].map(s => (
                <option key={s} value={s}>Semester {s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Exam Period & Student Detail Pill */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <div>
              Student: <strong className="text-white">{studentDetails?.name || '—'}</strong>
            </div>
            <div>
              Reg No: <strong className="text-blue-400 font-mono">{studentDetails?.register_number || '—'}</strong>
            </div>
            <div>
              Section: <strong className="text-indigo-400">{studentDetails?.section_code || studentDetails?.section || '—'}</strong>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-400">Exam Session:</span>
            <select
              value={examMonth}
              onChange={(e) => setExamMonth(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100"
            >
              {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <input
              type="text"
              value={examYear}
              onChange={(e) => setExamYear(e.target.value)}
              className="w-16 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-mono"
            />
          </div>
        </div>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Entry Grid: Regular Subjects & Pending Arrears */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section A: Regular Subjects for Selected Semester */}
        <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 bg-slate-900/60 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-400" />
                Regular Semester {selectedSemester} Subjects
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Configured curriculum subjects for {studentDetails?.section_code || 'selected section'}.
              </p>
            </div>

            {/* Live Calculation Widget */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">Live GPA:</span>
                <span className="text-sm font-bold text-emerald-400 font-mono">{gpaPreview}</span>
              </div>
              {pendingArrearsCount > 0 && (
                <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  {pendingArrearsCount} Arrear(s) Detected
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Subject Code</th>
                  <th className="py-3 px-4">Subject Title</th>
                  <th className="py-3 px-4 text-center">Credits</th>
                  <th className="py-3 px-4 text-center w-36">Grade</th>
                  <th className="py-3 px-4 text-center">Grade Point</th>
                  <th className="py-3 px-4 text-center">Credit × GP</th>
                  <th className="py-3 px-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      Loading subjects...
                    </td>
                  </tr>
                ) : regularSubjects.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                      No subjects configured for Semester {selectedSemester}.
                    </td>
                  </tr>
                ) : (
                  regularSubjects.map((sub, idx) => {
                    const isArrear = ['RA', 'WH', 'AB', 'WD'].includes(sub.grade);
                    const prod = sub.credits * sub.grade_point;
                    return (
                      <tr key={sub.subject_code} className="hover:bg-slate-800/30 transition">
                        <td className="py-3 px-4 font-mono font-bold text-blue-400">{sub.subject_code}</td>
                        <td className="py-3 px-4 font-medium text-slate-200">{sub.subject_name}</td>
                        <td className="py-3 px-4 text-center font-bold text-amber-300">{sub.credits}</td>
                        <td className="py-3 px-4 text-center">
                          <select
                            value={sub.grade}
                            onChange={(e) => handleRegularGradeChange(idx, e.target.value)}
                            className={`w-full text-center py-1.5 rounded-lg border text-xs font-bold transition focus:outline-none ${
                              isArrear
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                : sub.grade
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                : 'bg-slate-950 text-slate-400 border-slate-700'
                            }`}
                          >
                            <option value="">— Select —</option>
                            {gradeOptions.map(g => (
                              <option key={g} value={g}>{g}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-3 px-4 text-center font-bold text-white font-mono">
                          {sub.grade_point}
                        </td>
                        <td className="py-3 px-4 text-center font-mono text-xs text-slate-300">
                          {prod}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {sub.grade ? (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isArrear
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            }`}>
                              {isArrear ? 'ARREAR' : 'PASS'}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500">Pending</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section B: Pending Previous Semester Arrears (if any) */}
        {pendingArrears.length > 0 && (
          <div className="glass-panel rounded-2xl border border-amber-500/30 overflow-hidden shadow-xl">
            <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  Section B: Pending Previous Semester Arrears ({pendingArrears.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Record clearance grades for previous semester arrears in this exam session.
                </p>
              </div>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/90 text-xs uppercase text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4 text-center">Original Sem</th>
                  <th className="py-3 px-4 text-center">Original Grade</th>
                  <th className="py-3 px-4 text-center">Original Period</th>
                  <th className="py-3 px-4 text-center w-36">Clearing Grade</th>
                  <th className="py-3 px-4 text-center">Clearing Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {pendingArrears.map((arr, idx) => (
                  <tr key={arr.arrear_id} className="hover:bg-slate-800/30">
                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {arr.subject_code} - {arr.subject_name}
                    </td>
                    <td className="py-3 px-4 text-center text-xs font-bold text-blue-400">
                      Sem {arr.original_semester}
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-rose-400 font-mono">
                      {arr.original_grade}
                    </td>
                    <td className="py-3 px-4 text-center text-xs text-slate-400">
                      {arr.original_month} {arr.original_year}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <select
                        value={arr.cleared_grade || ''}
                        onChange={(e) => handleArrearGradeChange(idx, e.target.value)}
                        className="w-full text-center py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-xs font-bold text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="">— Unchanged —</option>
                        {gradeOptions.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {arr.cleared_grade && !['RA', 'WH', 'AB', 'WD'].includes(arr.cleared_grade) ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          CLEARED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          PENDING
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Submit Bar */}
        <div className="flex items-center justify-end gap-4 p-4 glass-panel rounded-2xl border border-slate-800">
          <div className="text-xs text-slate-400">
            Target Workbook: <strong className="text-indigo-400">{studentDetails?.section_code || 'Section'}_Academic_Records.xlsx</strong>
          </div>
          <button
            type="submit"
            disabled={saving || !selectedRegNo}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm shadow-lg shadow-blue-600/30 transition duration-150 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving & Updating Section Excel...' : 'Save Academic Records'}
          </button>
        </div>
      </form>
    </div>
  );
};
