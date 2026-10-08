import express from 'express';
import { db } from '../db.js';
import { GRADE_POINT_MAP, SEMESTER_CREDITS, SEMESTER_COLORS, calculateSemesterTotalGrade, calculateGPA, calculateCGPA } from '../formulas.js';

const router = express.Router();

router.get('/student/:id', (req, res) => {
  try {
    const { id } = req.params;
    const students = db.getTable('students');
    const student = students.find(s => s.id === id || s.register_number === id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const allSubjects = db.getTable('subjects');
    const allAttempts = db.getTable('grade_attempts');
    const allArrears = db.getTable('arrears');

    const studentAttempts = allAttempts.filter(a => a.student_id === student.id);
    const studentArrears = allArrears.filter(a => a.student_id === student.id);

    const semHistory = [];
    const semTotalsMap = {};

    for (let sem = 1; sem <= 8; sem++) {
      const subs = allSubjects
        .filter(s => s.semester_number === sem)
        .sort((a, b) => a.display_order - b.display_order);

      const subjectRecords = subs.map(sub => {
        const att = studentAttempts.find(a => a.semester_number === sem && a.subject_code === sub.subject_code);
        const arrearRec = studentArrears.find(a => a.subject_code === sub.subject_code && a.original_semester === sem);

        let finalGrade = att ? att.grade : '';
        if (arrearRec && arrearRec.status === 'CLEARED') {
          finalGrade = arrearRec.cleared_grade || finalGrade;
        }

        const gp = GRADE_POINT_MAP[finalGrade] ?? 0;

        return {
          subject_code: sub.subject_code,
          subject_name: sub.subject_name,
          credits: sub.credits,
          grade: finalGrade,
          grade_point: gp
        };
      });

      const totalGrade = calculateSemesterTotalGrade(subjectRecords);
      semTotalsMap[sem] = totalGrade;

      const gpa = calculateGPA(totalGrade, sem);
      const cgpa = calculateCGPA(semTotalsMap, sem);

      semHistory.push({
        semester_number: sem,
        total_credits: SEMESTER_CREDITS[sem],
        total_grade: totalGrade,
        gpa,
        cgpa,
        subjects: subjectRecords
      });
    }

    const finalCgpa = semHistory[7].cgpa;

    res.json({
      college: 'Vel Tech High Tech Dr.Rangarajan Dr.Sakunthala Engineering College',
      department: 'Department of Computer Science and Engineering',
      batch: student.batch || '2020-2024',
      student,
      semesters: semHistory,
      arrears_history: studentArrears,
      final_cgpa: finalCgpa
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
