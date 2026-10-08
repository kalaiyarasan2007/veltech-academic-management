import express from 'express';
import { db } from '../db.js';
import { calculateSemesterTotalGrade, calculateGPA, calculateCGPA } from '../formulas.js';

const router = express.Router();

router.get('/stats', (req, res) => {
  try {
    const departments = db.getTable('departments');
    const sections = db.getTable('sections');
    const students = db.getTable('students');
    const arrears = db.getTable('arrears');
    const gradeAttempts = db.getTable('grade_attempts');
    const subjects = db.getTable('subjects');
    const semesters = db.getTable('semesters');

    const totalDepartments = departments.length;
    const totalSections = sections.length;
    const totalStudents = students.length;
    const totalSubjects = subjects.length;
    const totalSemesters = semesters.length;

    // Arrear counts
    const pendingArrearsCount = arrears.filter(a => a.status === 'PENDING').length;
    const clearedArrearsCount = arrears.filter(a => a.status === 'CLEARED').length;

    // Student arrear status categorization
    const studentsWithPending = new Set();
    const studentsWithCleared = new Set();

    for (const arr of arrears) {
      if (arr.status === 'PENDING') {
        studentsWithPending.add(arr.student_id);
      } else if (arr.status === 'CLEARED') {
        studentsWithCleared.add(arr.student_id);
      }
    }

    const countPending = studentsWithPending.size;
    const countClearedOnly = Array.from(studentsWithCleared).filter(id => !studentsWithPending.has(id)).length;
    const countNoArrears = totalStudents - countPending - countClearedOnly;

    // Calculate Average GPA & CGPA across all students
    let totalCgpaSum = 0;
    let studentCgpaCount = 0;

    for (const std of students) {
      const stdAttempts = gradeAttempts.filter(a => a.student_id === std.id || a.register_number === std.register_number);
      const semTotalGradesMap = {};

      for (let sem = 1; sem <= 8; sem++) {
        const subs = subjects.filter(s => s.semester_number === sem && s.status !== 'INACTIVE');
        const subRecords = subs.map(sub => {
          const att = stdAttempts.find(a => a.semester_number === sem && a.subject_code === sub.subject_code);
          return { credits: sub.credits, grade: att ? att.grade : '' };
        });
        semTotalGradesMap[sem] = calculateSemesterTotalGrade(subRecords);
      }

      const finalCgpa = calculateCGPA(semTotalGradesMap, 8);
      if (finalCgpa > 0) {
        totalCgpaSum += finalCgpa;
        studentCgpaCount++;
      }
    }

    const avgCgpa = studentCgpaCount > 0 ? Number((totalCgpaSum / studentCgpaCount).toFixed(2)) : 0;

    // Semester-wise statistics
    const semesterStats = [];
    for (let sem = 1; sem <= 8; sem++) {
      const semArrears = arrears.filter(a => a.original_semester === sem);
      const pendingCount = semArrears.filter(a => a.status === 'PENDING').length;
      const clearedCount = semArrears.filter(a => a.status === 'CLEARED').length;
      const totalArrearsCount = semArrears.length;

      semesterStats.push({
        semester_number: sem,
        total_students: totalStudents,
        pending_arrears: pendingCount,
        cleared_arrears: clearedCount,
        total_arrears: totalArrearsCount,
        pass_rate: totalStudents > 0 ? Number((((totalStudents - pendingCount) / totalStudents) * 100).toFixed(1)) : 100
      });
    }

    res.json({
      // Core Admin Dashboard metrics
      total_departments: totalDepartments,
      total_sections: totalSections,
      total_students: totalStudents,
      total_subjects: totalSubjects,
      total_semesters: totalSemesters,
      pending_arrears: pendingArrearsCount,
      cleared_arrears: clearedArrearsCount,
      // Detailed metrics
      students_with_pending_arrears: countPending,
      students_with_cleared_arrears: countClearedOnly,
      students_without_arrears: countNoArrears,
      average_cgpa: avgCgpa,
      semester_stats: semesterStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
