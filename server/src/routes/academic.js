import express from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { 
  GRADE_POINT_MAP, 
  SEMESTER_CREDITS, 
  SEMESTER_COLORS, 
  calculateSemesterTotalGrade, 
  calculateGPA, 
  calculateCGPA, 
  isArrearGrade 
} from '../formulas.js';
import { generateCollegeExcelWorkbook } from '../excelExport.js';

const router = express.Router();

// GET all semesters
router.get('/semesters', (req, res) => {
  try {
    const semesters = db.getTable('semesters');
    res.json({ semesters });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update semester configuration
router.put('/semesters/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { exam_month, exam_year, color } = req.body;
    const semesters = db.getTable('semesters');
    const idx = semesters.findIndex(s => s.id === id || String(s.semester_number) === id);

    if (idx === -1) return res.status(404).json({ error: 'Semester not found' });

    semesters[idx] = {
      ...semesters[idx],
      exam_month: exam_month !== undefined ? exam_month : semesters[idx].exam_month,
      exam_year: exam_year !== undefined ? exam_year : semesters[idx].exam_year,
      color: color !== undefined ? color : semesters[idx].color
    };

    db.setTable('semesters', semesters);
    res.json({ semester: semesters[idx], message: 'Semester configuration updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all subjects grouped by semester
router.get('/subjects', (req, res) => {
  try {
    const { department_id, section_id, semester_number } = req.query;
    let subjects = db.getTable('subjects');

    if (department_id) {
      subjects = subjects.filter(s => s.department_id === department_id);
    }
    if (semester_number) {
      subjects = subjects.filter(s => s.semester_number === parseInt(semester_number));
    }
    if (section_id) {
      const sectionSubjects = db.getTable('section_subjects');
      const assignedIds = new Set(sectionSubjects.filter(ss => ss.section_id === section_id).map(ss => ss.subject_id));
      if (assignedIds.size > 0) {
        subjects = subjects.filter(s => assignedIds.has(s.id));
      }
    }

    res.json({ subjects });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET grade entry structure for a specific student and semester
// Section A: Current semester regular subjects configured for student/section
// Section B: Pending previous semester arrears
router.get('/entry-view', (req, res) => {
  try {
    const { student_id, register_number, semester_number } = req.query;
    const semNum = parseInt(semester_number);

    if (!semNum || semNum < 1 || semNum > 8) {
      return res.status(400).json({ error: 'Valid semester_number (1-8) required' });
    }

    const students = db.getTable('students');
    const student = students.find(s => s.id === student_id || s.register_number === register_number);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const allSubjects = db.getTable('subjects');
    const allAttempts = db.getTable('grade_attempts');
    const allArrears = db.getTable('arrears');
    const sectionSubjects = db.getTable('section_subjects');

    // Determine subjects configured for this student's section or department
    let sectionSubIds = new Set();
    if (student.section_id) {
      sectionSubIds = new Set(sectionSubjects.filter(ss => ss.section_id === student.section_id).map(ss => ss.subject_id));
    }

    // Section A: Current Semester Regular Subjects
    const regularSubjects = allSubjects
      .filter(sub => {
        if (sub.semester_number !== semNum) return false;
        if (sub.status === 'INACTIVE') return false;
        // If section has explicit mapping, filter by it; otherwise allow department match
        if (sectionSubIds.size > 0) {
          return sectionSubIds.has(sub.id);
        }
        return !student.department_id || !sub.department_id || sub.department_id === student.department_id;
      })
      .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
      .map(sub => {
        const attempt = allAttempts.find(a => 
          (a.student_id === student.id || a.register_number === student.register_number) && 
          a.semester_number === semNum && 
          a.subject_code === sub.subject_code
        );
        return {
          subject_id: sub.id,
          subject_code: sub.subject_code,
          subject_name: sub.subject_name,
          credits: sub.credits,
          grade: attempt ? attempt.grade : '',
          grade_point: attempt ? attempt.grade_point : 0
        };
      });

    // Section B: Pending Arrears from PREVIOUS semesters (< semNum)
    const pendingArrears = allArrears
      .filter(arr => 
        (arr.student_id === student.id || arr.register_number === student.register_number) && 
        arr.original_semester < semNum && 
        arr.status === 'PENDING'
      )
      .map(arr => ({
        arrear_id: arr.id,
        subject_id: arr.subject_id,
        subject_code: arr.subject_code,
        subject_name: arr.subject_name,
        original_semester: arr.original_semester,
        original_grade: arr.original_grade,
        original_month: arr.original_month,
        original_year: arr.original_year,
        cleared_grade: arr.cleared_grade || '',
        cleared_grade_point: arr.cleared_grade ? (GRADE_POINT_MAP[arr.cleared_grade] ?? 0) : 0
      }));

    res.json({
      student,
      semester_number: semNum,
      regular_subjects: regularSubjects,
      pending_arrears: pendingArrears
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST save grades for a student in a semester
router.post('/save-grades', async (req, res) => {
  try {
    const { 
      student_id, 
      semester_number, 
      exam_month, 
      exam_year, 
      regular_grades, 
      arrear_clearances 
    } = req.body;
    const semNum = parseInt(semester_number);

    if (!student_id || !semNum) {
      return res.status(400).json({ error: 'student_id and semester_number are required' });
    }

    const students = db.getTable('students');
    const student = students.find(s => s.id === student_id || s.register_number === student_id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    let gradeAttempts = db.getTable('grade_attempts');
    let arrears = db.getTable('arrears');
    const allSubjects = db.getTable('subjects');

    const m = exam_month || 'June';
    const y = exam_year || '2024';

    const deptId = student.department_id || 'dept_cse';
    const secId = student.section_id || 'sec_cse_a';
    const semId = `sem_${semNum}`;

    // 1. Process Section A: Regular Subjects
    if (Array.isArray(regular_grades)) {
      for (const item of regular_grades) {
        if (!item.grade) continue;

        const subMeta = allSubjects.find(s => s.subject_code === item.subject_code) || {
          id: `sub_${item.subject_code}`,
          subject_name: item.subject_name,
          credits: item.credits || 3
        };

        const gp = GRADE_POINT_MAP[item.grade] ?? 0;
        const isArrear = isArrearGrade(item.grade);

        // Upsert grade attempt with section_id and department_id
        let attIndex = gradeAttempts.findIndex(a => 
          (a.student_id === student.id || a.register_number === student.register_number) && 
          a.semester_number === semNum && 
          a.subject_code === item.subject_code
        );

        if (attIndex !== -1) {
          gradeAttempts[attIndex] = {
            ...gradeAttempts[attIndex],
            department_id: deptId,
            section_id: secId,
            semester_id: semId,
            subject_id: subMeta.id || `sub_${item.subject_code}`,
            grade: item.grade,
            grade_point: gp,
            exam_month: m,
            exam_year: y,
            updated_at: new Date().toISOString()
          };
        } else {
          gradeAttempts.push({
            id: `att_${student.id}_s${semNum}_${item.subject_code}_${Date.now()}`,
            department_id: deptId,
            section_id: secId,
            student_id: student.id,
            register_number: student.register_number,
            semester_id: semId,
            semester_number: semNum,
            subject_id: subMeta.id || `sub_${item.subject_code}`,
            subject_code: item.subject_code,
            subject_name: subMeta.subject_name,
            credits: subMeta.credits,
            grade: item.grade,
            grade_point: gp,
            attempt_type: 'REGULAR',
            exam_month: m,
            exam_year: y,
            created_at: new Date().toISOString()
          });
        }

        // Handle Arrear creation if grade is RA/WH/AB/WD
        let arrearIndex = arrears.findIndex(a => 
          (a.student_id === student.id || a.register_number === student.register_number) && 
          a.subject_code === item.subject_code && 
          a.original_semester === semNum
        );

        if (isArrear) {
          if (arrearIndex !== -1) {
            arrears[arrearIndex].original_grade = item.grade;
            arrears[arrearIndex].status = 'PENDING';
            arrears[arrearIndex].department_id = deptId;
            arrears[arrearIndex].section_id = secId;
          } else {
            arrears.push({
              id: `arr_${student.id}_${item.subject_code}_s${semNum}`,
              department_id: deptId,
              section_id: secId,
              student_id: student.id,
              register_number: student.register_number,
              semester_id: semId,
              subject_id: subMeta.id || `sub_${item.subject_code}`,
              subject_code: item.subject_code,
              subject_name: subMeta.subject_name,
              original_semester: semNum,
              original_grade: item.grade,
              original_month: m,
              original_year: y,
              cleared_semester: null,
              cleared_grade: null,
              cleared_month: null,
              cleared_year: null,
              status: 'PENDING'
            });
          }
        }
      }
    }

    // 2. Process Section B: Pending Arrear Clearances
    if (Array.isArray(arrear_clearances)) {
      for (const clearItem of arrear_clearances) {
        if (!clearItem.cleared_grade) continue;

        const arrearIndex = arrears.findIndex(a => 
          a.id === clearItem.arrear_id || 
          ((a.student_id === student.id || a.register_number === student.register_number) && 
           a.subject_code === clearItem.subject_code && 
           a.status === 'PENDING')
        );

        if (arrearIndex !== -1) {
          const arrRec = arrears[arrearIndex];
          const isClearedPassing = !isArrearGrade(clearItem.cleared_grade);

          arrears[arrearIndex] = {
            ...arrRec,
            cleared_semester: semNum,
            cleared_grade: clearItem.cleared_grade,
            cleared_month: m,
            cleared_year: y,
            status: isClearedPassing ? 'CLEARED' : 'PENDING'
          };

          // Record clearance attempt in grade_attempts
          const gp = GRADE_POINT_MAP[clearItem.cleared_grade] ?? 0;
          gradeAttempts.push({
            id: `att_${student.id}_s${semNum}_clear_${clearItem.subject_code}_${Date.now()}`,
            department_id: deptId,
            section_id: secId,
            student_id: student.id,
            register_number: student.register_number,
            semester_id: semId,
            semester_number: semNum,
            subject_id: arrRec.subject_id || `sub_${clearItem.subject_code}`,
            subject_code: clearItem.subject_code,
            subject_name: arrRec.subject_name,
            credits: clearItem.credits || 3,
            grade: clearItem.cleared_grade,
            grade_point: gp,
            attempt_type: 'ARREAR_CLEARANCE',
            exam_month: m,
            exam_year: y,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    db.setTable('grade_attempts', gradeAttempts);
    db.setTable('arrears', arrears);

    // Automatically update the section-specific Excel workbook in the background
    try {
      await generateCollegeExcelWorkbook({ section_id: secId, department_id: deptId });
    } catch (excelErr) {
      console.warn('Background section Excel update warning:', excelErr.message);
    }

    res.json({ message: 'Grades and clearances saved successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET full 8-semester academic history for a student
router.get('/student-history/:id', (req, res) => {
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

    const studentAttempts = allAttempts.filter(a => a.student_id === student.id || a.register_number === student.register_number);
    const studentArrears = allArrears.filter(a => a.student_id === student.id || a.register_number === student.register_number);

    const semesterHistory = [];
    const semTotalGradesMap = {};

    for (let sem = 1; sem <= 8; sem++) {
      const subs = allSubjects
        .filter(s => s.semester_number === sem && s.status !== 'INACTIVE')
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));

      const subjectRecords = subs.map(sub => {
        const att = studentAttempts.find(a => a.semester_number === sem && a.subject_code === sub.subject_code);
        const arrearRec = studentArrears.find(a => a.subject_code === sub.subject_code && a.original_semester === sem);

        let finalGrade = att ? att.grade : '';
        let colorHex = SEMESTER_COLORS[sem];

        if (arrearRec && arrearRec.status === 'CLEARED' && arrearRec.cleared_semester) {
          finalGrade = arrearRec.cleared_grade || finalGrade;
          colorHex = SEMESTER_COLORS[arrearRec.cleared_semester] || colorHex;
        }

        const gp = GRADE_POINT_MAP[finalGrade] ?? 0;

        return {
          subject_code: sub.subject_code,
          subject_name: sub.subject_name,
          credits: sub.credits,
          grade: finalGrade,
          grade_point: gp,
          is_arrear: isArrearGrade(finalGrade),
          arrear_status: arrearRec ? arrearRec.status : null,
          cleared_semester: arrearRec ? arrearRec.cleared_semester : null,
          color: colorHex
        };
      });

      const totalGrade = calculateSemesterTotalGrade(subjectRecords);
      semTotalGradesMap[sem] = totalGrade;

      const gpa = calculateGPA(totalGrade, sem);
      const cgpa = calculateCGPA(semTotalGradesMap, sem);

      const pendingArrearsCount = subjectRecords.filter(s => s.is_arrear && s.arrear_status !== 'CLEARED').length;
      const clearedArrearsCount = subjectRecords.filter(s => s.arrear_status === 'CLEARED').length;

      semesterHistory.push({
        semester_number: sem,
        color: SEMESTER_COLORS[sem],
        total_credits: SEMESTER_CREDITS[sem],
        total_grade: totalGrade,
        gpa,
        cgpa,
        pending_arrears: pendingArrearsCount,
        cleared_arrears: clearedArrearsCount,
        subjects: subjectRecords
      });
    }

    res.json({
      student,
      semesters: semesterHistory,
      arrears_timeline: studentArrears
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
