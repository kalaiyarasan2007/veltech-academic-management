import React, { useState, useEffect } from 'react';
import { fetchApi } from '../api';
import { Student } from '../types';
import { Printer, Download, Search, GraduationCap } from 'lucide-react';
import { SearchableStudentSelect } from '../components/SearchableStudentSelect';

export const PrintableReport: React.FC = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedRegNo, setSelectedRegNo] = useState<string>('');
  const [reportData, setReportData] = useState<any>(null);
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

    fetchApi(`/reports/student/${selectedRegNo}`)
      .then(res => setReportData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedRegNo]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar (Hidden during print) */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print relative z-30">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-400" /> Student Academic Transcript & Report
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Official printable academic report sheet with complete 8-semester breakdown and arrear timeline.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-80 md:w-96">
            <SearchableStudentSelect
              students={students}
              value={selectedRegNo}
              onChange={(reg) => setSelectedRegNo(reg)}
              placeholder="Search student Name or Reg No..."
            />
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-blue-600/30 transition cursor-pointer flex-shrink-0"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        reportData && (
          <div className="bg-white text-slate-900 p-8 rounded-2xl shadow-xl space-y-6 border border-slate-200">
            {/* College Official Header */}
            <div className="border-b-2 border-slate-800 pb-4 text-center space-y-1">
              <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-900">
                {reportData.college}
              </h1>
              <h2 className="text-sm font-bold uppercase tracking-wider text-blue-900">
                {reportData.department}
              </h2>
              <p className="text-xs font-semibold text-slate-600 uppercase tracking-widest pt-1">
                Official Student Academic Performance & Grade Report (Batch: {reportData.batch})
              </p>
            </div>

            {/* Student Meta Details Table */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
              <div>
                <span className="text-slate-500 block uppercase font-semibold">Student Name:</span>
                <strong className="text-slate-900 text-sm">{reportData.student.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold">Register Number:</span>
                <strong className="text-slate-900 font-mono text-sm">{reportData.student.register_number}</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold">Roll Number:</span>
                <strong className="text-slate-900 font-mono text-sm">{reportData.student.roll_number}</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-semibold">Overall Final CGPA:</span>
                <strong className="text-emerald-700 text-base font-extrabold">{reportData.final_cgpa}</strong>
              </div>
            </div>

            {/* 8 Semesters Summary Table */}
            <div className="space-y-6">
              {reportData.semesters.map((sem: any) => (
                <div key={sem.semester_number} className="border border-slate-300 rounded-xl overflow-hidden">
                  <div className="bg-slate-800 text-white px-4 py-2 flex items-center justify-between text-xs font-bold uppercase tracking-wider">
                    <span>Semester {sem.semester_number}</span>
                    <div className="flex gap-4">
                      <span>Total Grade: {sem.total_grade}</span>
                      <span>GPA: {sem.gpa}</span>
                      <span>CGPA: {sem.cgpa}</span>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                        <th className="p-2 border-r border-slate-300 w-28">Subject Code</th>
                        <th className="p-2 border-r border-slate-300">Subject Title</th>
                        <th className="p-2 border-r border-slate-300 text-center w-16">Credit</th>
                        <th className="p-2 border-r border-slate-300 text-center w-20">Grade</th>
                        <th className="p-2 text-center w-24">Grade Point</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium">
                      {sem.subjects.map((sub: any) => (
                        <tr key={sub.subject_code}>
                          <td className="p-2 border-r border-slate-200 font-mono font-bold text-slate-800">{sub.subject_code}</td>
                          <td className="p-2 border-r border-slate-200">{sub.subject_name}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">{sub.credits}</td>
                          <td className="p-2 border-r border-slate-200 text-center font-bold">{sub.grade}</td>
                          <td className="p-2 text-center font-bold">{sub.grade_point}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Arrear History Section */}
            {reportData.arrears_history.length > 0 && (
              <div className="border border-slate-300 rounded-xl overflow-hidden space-y-0">
                <div className="bg-amber-700 text-white px-4 py-2 font-bold text-xs uppercase tracking-wider">
                  Arrear History & Clearance Record
                </div>
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-bold uppercase">
                      <th className="p-2">Subject</th>
                      <th className="p-2 text-center">Original Sem</th>
                      <th className="p-2 text-center">Original Grade</th>
                      <th className="p-2 text-center">Cleared Sem</th>
                      <th className="p-2 text-center">Cleared Grade</th>
                      <th className="p-2 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-medium">
                    {reportData.arrears_history.map((arr: any) => (
                      <tr key={arr.id}>
                        <td className="p-2 font-mono"><strong>{arr.subject_code}</strong> - {arr.subject_name}</td>
                        <td className="p-2 text-center">Sem {arr.original_semester}</td>
                        <td className="p-2 text-center font-bold text-rose-600">{arr.original_grade}</td>
                        <td className="p-2 text-center">{arr.cleared_semester ? `Sem ${arr.cleared_semester}` : '-'}</td>
                        <td className="p-2 text-center font-bold text-emerald-600">{arr.cleared_grade || '-'}</td>
                        <td className="p-2 text-right font-bold">{arr.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Signatures */}
            <div className="pt-12 flex items-center justify-between text-xs font-bold text-slate-700">
              <div className="text-center">
                <div className="w-40 border-b border-slate-400 mb-1"></div>
                <span>Class Advisor / Faculty</span>
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-slate-400 mb-1"></div>
                <span>Head of Department (CSE)</span>
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-slate-400 mb-1"></div>
                <span>Principal / Controller</span>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
};
