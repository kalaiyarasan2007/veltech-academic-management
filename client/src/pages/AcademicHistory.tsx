import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Student, SemesterHistory } from '../types';
import { History, GraduationCap, Award, BookOpen, CheckCircle, AlertCircle } from 'lucide-react';
import { SearchableStudentSelect } from '../components/SearchableStudentSelect';

export const AcademicHistory: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedRegNo, setSelectedRegNo] = useState<string>('');
  
  const [studentDetails, setStudentDetails] = useState<Student | null>(null);
  const [semesters, setSemesters] = useState<SemesterHistory[]>([]);
  const [arrearsTimeline, setArrearsTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    fetchApi<{ students: Student[] }>('/students')
      .then(res => {
        setStudents(res.students);
        if (res.students.length > 0) {
          setSelectedRegNo(res.students[0].register_number);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!selectedRegNo) return;
    setLoading(true);

    fetchApi<{
      student: Student;
      semesters: SemesterHistory[];
      arrears_timeline: any[];
    }>(`/academic/student-history/${selectedRegNo}`)
      .then(res => {
        setStudentDetails(res.student);
        setSemesters(res.semesters);
        setArrearsTimeline(res.arrears_timeline);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedRegNo]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-30">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" /> Student Academic History
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Complete 8-semester academic breakdown, GPA, CGPA progression, and arrear clearance timeline.
          </p>
        </div>

        {/* Student Search & Select Component */}
        <div className="flex items-center gap-3 w-full sm:w-80 md:w-96">
          <SearchableStudentSelect
            students={students}
            value={selectedRegNo}
            onChange={(reg) => setSelectedRegNo(reg)}
            placeholder="Type Name or Reg No (e.g. 113024... / KALAI)..."
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        studentDetails && (
          <div className="space-y-6">
            {/* Student Profile Overview Card */}
            <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-xl shadow-lg shadow-blue-500/20">
                  {studentDetails.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{studentDetails.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Register No: <span className="font-mono text-slate-200 font-semibold">{studentDetails.register_number}</span> • Roll: <span className="font-mono text-slate-200">{studentDetails.roll_number}</span>
                  </p>
                  <p className="text-xs text-blue-400 mt-1 font-medium">
                    {studentDetails.department} • Batch: {studentDetails.batch}
                  </p>
                </div>
              </div>

              <div className="flex gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-6 text-center">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Final CGPA</p>
                  <p className="text-2xl font-bold text-emerald-400 mt-1">
                    {semesters[7]?.cgpa || '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Pending Arrears</p>
                  <p className={`text-2xl font-bold mt-1 ${
                    semesters.reduce((sum, s) => sum + s.pending_arrears, 0) > 0 ? 'text-amber-400' : 'text-slate-400'
                  }`}>
                    {semesters.reduce((sum, s) => sum + s.pending_arrears, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Cleared Arrears</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">
                    {semesters.reduce((sum, s) => sum + s.cleared_arrears, 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* 8 Semester Grid / Cards */}
            <div className="space-y-6">
              {semesters.map(sem => (
                <div 
                  key={sem.semester_number}
                  className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4"
                >
                  {/* Semester Header with color indicator */}
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <div className="flex items-center gap-3">
                      <span 
                        className="w-4 h-4 rounded-full border border-white/20 shadow-md"
                        style={{ backgroundColor: sem.color }}
                      ></span>
                      <h4 className="font-bold text-lg text-white">Semester {sem.semester_number}</h4>
                      <span className="text-xs text-slate-400 font-mono">({sem.color})</span>
                    </div>

                    <div className="flex items-center gap-6 text-xs">
                      <div>
                        <span className="text-slate-400">Total Credits: </span>
                        <span className="font-bold text-slate-200">{sem.total_credits}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Total Grade: </span>
                        <span className="font-bold text-slate-200">{sem.total_grade}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">GPA: </span>
                        <span className="font-bold text-emerald-400 text-sm">{sem.gpa}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">CGPA: </span>
                        <span className="font-bold text-blue-400 text-sm">{sem.cgpa}</span>
                      </div>
                    </div>
                  </div>

                  {/* Subjects Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                          <th className="pb-2.5 font-semibold w-32">Subject Code</th>
                          <th className="pb-2.5 font-semibold">Subject Title</th>
                          <th className="pb-2.5 font-semibold text-center w-24">Credits</th>
                          <th className="pb-2.5 font-semibold text-center w-28">Grade</th>
                          <th className="pb-2.5 font-semibold text-center w-28">Grade Point</th>
                          <th className="pb-2.5 font-semibold text-right w-36">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40">
                        {sem.subjects.map(sub => (
                          <tr key={sub.subject_code} className="hover:bg-slate-800/20 transition">
                            <td className="py-2.5 font-mono font-bold text-blue-400">{sub.subject_code}</td>
                            <td className="py-2.5 font-medium text-slate-200">{sub.subject_name}</td>
                            <td className="py-2.5 text-center text-slate-300 font-semibold">{sub.credits}</td>
                            <td className="py-2.5 text-center">
                              <span 
                                className="inline-block px-2.5 py-0.5 rounded text-xs font-bold shadow-sm"
                                style={{
                                  backgroundColor: `${sub.color}30`,
                                  color: sub.color === '#FFFF00' ? '#EAB308' : sub.color,
                                  border: `1px solid ${sub.color}60`
                                }}
                              >
                                {sub.grade || '-'}
                              </span>
                            </td>
                            <td className="py-2.5 text-center font-bold text-slate-200">{sub.grade ? sub.grade_point : '-'}</td>
                            <td className="py-2.5 text-right">
                              {sub.arrear_status === 'CLEARED' ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-400">
                                  <CheckCircle className="w-3.5 h-3.5" /> Cleared (Sem {sub.cleared_semester})
                                </span>
                              ) : sub.is_arrear ? (
                                <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-400">
                                  <AlertCircle className="w-3.5 h-3.5" /> Pending Arrear
                                </span>
                              ) : (
                                <span className="text-xs text-slate-500 font-medium">Regular Pass</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
};
