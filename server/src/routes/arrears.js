import express from 'express';
import { db } from '../db.js';
import { GRADE_POINT_MAP } from '../formulas.js';

const router = express.Router();

// GET list of arrears with filters
router.get('/', (req, res) => {
  try {
    const { status, student_id, search, semester_number } = req.query;
    let arrears = db.getTable('arrears');
    const students = db.getTable('students');

    if (status) {
      arrears = arrears.filter(a => a.status === status.toUpperCase());
    }

    if (student_id) {
      arrears = arrears.filter(a => a.student_id === student_id || a.register_number === student_id);
    }

    if (semester_number) {
      const semNum = parseInt(semester_number);
      arrears = arrears.filter(a => a.original_semester === semNum || a.cleared_semester === semNum);
    }

    // Attach student name details
    const studentMap = {};
    for (const s of students) {
      studentMap[s.id] = s;
      studentMap[s.register_number] = s;
    }

    let result = arrears.map(a => {
      const std = studentMap[a.student_id] || studentMap[a.register_number];
      return {
        ...a,
        student_name: std ? std.name : `Student ${a.register_number}`,
        roll_number: std ? std.roll_number : ''
      };
    });

    if (search) {
      const query = String(search).toLowerCase().trim();
      result = result.filter(r => 
        r.register_number.toLowerCase().includes(query) ||
        r.student_name.toLowerCase().includes(query) ||
        r.subject_code.toLowerCase().includes(query) ||
        r.subject_name.toLowerCase().includes(query) ||
        (r.original_grade && r.original_grade.toLowerCase().includes(query)) ||
        (r.cleared_grade && r.cleared_grade.toLowerCase().includes(query)) ||
        (r.status && r.status.toLowerCase().includes(query)) ||
        String(r.original_semester) === query ||
        (r.cleared_semester && String(r.cleared_semester) === query)
      );
    }

    res.json({ arrears: result, total: result.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST clear an arrear manually
router.post('/clear', (req, res) => {
  try {
    const { arrear_id, cleared_semester, cleared_grade, cleared_month, cleared_year } = req.body;
    if (!arrear_id || !cleared_semester || !cleared_grade) {
      return res.status(400).json({ error: 'arrear_id, cleared_semester, and cleared_grade are required' });
    }

    let arrears = db.getTable('arrears');
    let gradeAttempts = db.getTable('grade_attempts');

    const index = arrears.findIndex(a => a.id === arrear_id);
    if (index === -1) {
      return res.status(404).json({ error: 'Arrear record not found' });
    }

    const target = arrears[index];
    const semNum = parseInt(cleared_semester);
    const m = cleared_month || 'June';
    const y = cleared_year || '2024';

    arrears[index] = {
      ...target,
      cleared_semester: semNum,
      cleared_grade,
      cleared_month: m,
      cleared_year: y,
      status: 'CLEARED'
    };

    const gp = GRADE_POINT_MAP[cleared_grade] ?? 0;
    gradeAttempts.push({
      id: `att_${target.student_id}_s${semNum}_clear_${target.subject_code}_${Date.now()}`,
      student_id: target.student_id,
      register_number: target.register_number,
      semester_number: semNum,
      subject_code: target.subject_code,
      subject_name: target.subject_name,
      credits: 3,
      grade: cleared_grade,
      grade_point: gp,
      attempt_type: 'ARREAR_CLEARANCE',
      exam_month: m,
      exam_year: y,
      created_at: new Date().toISOString()
    });

    db.setTable('arrears', arrears);
    db.setTable('grade_attempts', gradeAttempts);

    res.json({ arrear: arrears[index], message: 'Arrear cleared successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
