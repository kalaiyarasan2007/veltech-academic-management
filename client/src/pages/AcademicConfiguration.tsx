import React from 'react';
import { Sliders, Award, Calculator, Info } from 'lucide-react';

export const AcademicConfiguration: React.FC = () => {
  const gradeScale = [
    { grade: 'O', point: 10, meaning: 'Outstanding', passing: true, type: 'PASS' },
    { grade: 'A+', point: 9, meaning: 'Excellent', passing: true, type: 'PASS' },
    { grade: 'A', point: 8, meaning: 'Very Good', passing: true, type: 'PASS' },
    { grade: 'B+', point: 7, meaning: 'Good', passing: true, type: 'PASS' },
    { grade: 'B', point: 6, meaning: 'Average', passing: true, type: 'PASS' },
    { grade: 'C', point: 5, meaning: 'Satisfactory', passing: true, type: 'PASS' },
    { grade: 'RA', point: 0, meaning: 'Re-appearance Required (Arrear)', passing: false, type: 'REAPPEAR' },
    { grade: 'WH', point: 0, meaning: 'Withheld', passing: false, type: 'WITHHELD' },
    { grade: 'AB', point: 0, meaning: 'Absent', passing: false, type: 'ABSENT' },
    { grade: 'WD', point: 0, meaning: 'Withdrawal', passing: false, type: 'WITHDRAWAL' }
  ];

  return (
    <div className="space-y-6">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-amber-400" /> Academic & Evaluation Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Standard Anna University / College Regulation 10-Point Grading System & GPA Calculation Matrix.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Grading Scale Table */}
        <div className="lg:col-span-2 glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" /> Letter Grade Scale & Grade Points
            </h3>
            <span className="text-xs text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              10-Point Scale Active
            </span>
          </div>

          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Letter Grade</th>
                <th className="py-3 px-4 text-center">Grade Point</th>
                <th className="py-3 px-4">Performance Standard</th>
                <th className="py-3 px-4 text-center">Result Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {gradeScale.map(gs => (
                <tr key={gs.grade} className="hover:bg-slate-800/30 transition">
                  <td className="py-3 px-4 font-mono font-bold text-amber-400">{gs.grade}</td>
                  <td className="py-3 px-4 text-center font-bold text-white">{gs.point}</td>
                  <td className="py-3 px-4 text-xs text-slate-300">{gs.meaning}</td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      gs.passing
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {gs.type}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Calculation Logic Card */}
        <div className="space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-blue-400" /> GPA Calculation Formula
            </h3>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-blue-300">
              GPA = ∑(Credit × Grade Point) / ∑(Credits)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Grade Point Average is calculated as the credit-weighted sum of grade points divided by the total regular credits for that semester.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calculator className="w-4 h-4 text-purple-400" /> CGPA Calculation Formula
            </h3>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-purple-300">
              CGPA = Cumulative ∑(Credit × GP) / Cumulative ∑(Credits)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cumulative Grade Point Average is calculated progressively across all completed semesters up to that point. It is NOT a simple average of semester GPAs.
            </p>
          </div>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" /> Arrear Tracking Protocol
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Any grade of <code className="text-rose-400 font-mono">RA</code>, <code className="text-rose-400 font-mono">WH</code>, <code className="text-rose-400 font-mono">AB</code>, or <code className="text-rose-400 font-mono">WD</code> automatically registers an arrear entry linked with the student and their section. Upon clearance, the original record history is retained and the GPA/CGPA recalculates automatically.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
