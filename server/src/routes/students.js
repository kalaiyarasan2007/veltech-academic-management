import express from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all students with section & department filters
router.get('/', (req, res) => {
  try {
    const { search, batch, department_id, section_id, section } = req.query;
    let students = db.getTable('students');
    const departments = db.getTable('departments');
    const sections = db.getTable('sections');

    const deptMap = {};
    for (const d of departments) {
      deptMap[d.id] = d;
      deptMap[d.code] = d;
    }

    const secMap = {};
    for (const s of sections) {
      secMap[s.id] = s;
      secMap[s.section_code] = s;
    }

    // Filter by department
    if (department_id) {
      students = students.filter(s => 
        s.department_id === department_id || 
        s.department === department_id ||
        deptMap[s.department_id]?.code === department_id
      );
    }

    // Filter by section (CRITICAL REQUIREMENT: Strict section separation)
    if (section_id) {
      students = students.filter(s => 
        s.section_id === section_id || 
        s.section === section_id ||
        secMap[s.section_id]?.section_code === section_id
      );
    } else if (section) {
      students = students.filter(s => 
        s.section === section || 
        s.section_id === section ||
        secMap[s.section_id]?.section_code === section
      );
    }

    if (batch) {
      students = students.filter(s => s.batch === batch);
    }

    if (search) {
      const query = String(search).toLowerCase().trim();
      students = students.filter(s => 
        s.register_number.toLowerCase().includes(query) || 
        s.name.toLowerCase().includes(query) ||
        (s.roll_number && s.roll_number.toLowerCase().includes(query)) ||
        (s.section && s.section.toLowerCase().includes(query))
      );
    }

    const enriched = students.map((s, idx) => {
      const dept = deptMap[s.department_id];
      const sec = secMap[s.section_id];
      return {
        ...s,
        sno: s.sno || String(idx + 1),
        department_name: dept ? dept.name : (s.department || 'Department of Computer Science and Engineering'),
        department_code: dept ? dept.code : 'CSE',
        section_name: sec ? sec.section_name : (s.section || 'CSE-A'),
        section_code: sec ? sec.section_code : (s.section || 'CSE-A')
      };
    });

    res.json({ students: enriched, total: enriched.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single student by ID or Register Number
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const students = db.getTable('students');
    const student = students.find(s => s.id === id || s.register_number === id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const departments = db.getTable('departments');
    const sections = db.getTable('sections');
    const dept = departments.find(d => d.id === student.department_id);
    const sec = sections.find(s => s.id === student.section_id || s.section_code === student.section);

    res.json({ 
      student: {
        ...student,
        department_name: dept ? dept.name : student.department,
        section_name: sec ? sec.section_name : student.section
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new student
router.post('/', requireAdmin, (req, res) => {
  try {
    const { 
      register_number, 
      name, 
      roll_number, 
      batch, 
      department_id, 
      department, 
      section_id, 
      section, 
      academic_year 
    } = req.body;

    if (!register_number || !name) {
      return res.status(400).json({ error: 'Register number and Name are required' });
    }

    const cleanReg = String(register_number).trim();
    const students = db.getTable('students');
    const departments = db.getTable('departments');
    const sections = db.getTable('sections');

    // Find dept & section
    const deptObj = departments.find(d => d.id === department_id || d.name === department || d.code === department_id);
    const resolvedDeptId = deptObj ? deptObj.id : (department_id || 'dept_cse');
    const resolvedDeptName = deptObj ? deptObj.name : (department || 'Department of Computer Science and Engineering');

    const secObj = sections.find(s => s.id === section_id || s.section_code === section || s.section_name === section);
    const resolvedSecId = secObj ? secObj.id : (section_id || 'sec_cse_a');
    const resolvedSecCode = secObj ? secObj.section_code : (section || 'CSE-A');

    // Check if student with register number exists; if so, update (upsert)
    const existingIndex = students.findIndex(s => s.register_number === cleanReg);
    if (existingIndex !== -1) {
      students[existingIndex] = {
        ...students[existingIndex],
        name: String(name).trim(),
        roll_number: roll_number ? String(roll_number).trim() : students[existingIndex].roll_number,
        batch: batch || students[existingIndex].batch,
        department_id: resolvedDeptId,
        department: resolvedDeptName,
        section_id: resolvedSecId,
        section: resolvedSecCode,
        academic_year: academic_year || students[existingIndex].academic_year || '2020-2024',
        updated_at: new Date().toISOString()
      };
      db.setTable('students', students);
      return res.status(200).json({ student: students[existingIndex], message: 'Student updated successfully' });
    }

    const newStudent = {
      id: `std_${cleanReg}`,
      register_number: cleanReg,
      name: String(name).trim(),
      roll_number: roll_number ? String(roll_number).trim() : `20CS${String(students.length + 1).padStart(3, '0')}`,
      batch: batch || '2020-2024',
      department_id: resolvedDeptId,
      department: resolvedDeptName,
      section_id: resolvedSecId,
      section: resolvedSecCode,
      academic_year: academic_year || '2020-2024',
      status: 'ACTIVE',
      sno: String(students.length + 1),
      created_at: new Date().toISOString()
    };

    students.push(newStudent);
    db.setTable('students', students);

    res.status(201).json({ student: newStudent, message: 'Student added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update student
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      roll_number, 
      batch, 
      department_id, 
      department, 
      section_id, 
      section, 
      academic_year,
      status 
    } = req.body;

    const students = db.getTable('students');
    const index = students.findIndex(s => s.id === id || s.register_number === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const departments = db.getTable('departments');
    const sections = db.getTable('sections');

    const cur = students[index];
    let resolvedDeptId = cur.department_id;
    let resolvedDeptName = cur.department;
    if (department_id || department) {
      const d = departments.find(dep => dep.id === department_id || dep.name === department);
      if (d) {
        resolvedDeptId = d.id;
        resolvedDeptName = d.name;
      }
    }

    let resolvedSecId = cur.section_id;
    let resolvedSecCode = cur.section;
    if (section_id || section) {
      const s = sections.find(sec => sec.id === section_id || sec.section_code === section);
      if (s) {
        resolvedSecId = s.id;
        resolvedSecCode = s.section_code;
      }
    }

    students[index] = {
      ...cur,
      name: name !== undefined ? String(name).trim() : cur.name,
      roll_number: roll_number !== undefined ? String(roll_number).trim() : cur.roll_number,
      batch: batch !== undefined ? batch : cur.batch,
      department_id: resolvedDeptId,
      department: resolvedDeptName,
      section_id: resolvedSecId,
      section: resolvedSecCode,
      academic_year: academic_year !== undefined ? academic_year : cur.academic_year,
      status: status !== undefined ? status : cur.status,
      updated_at: new Date().toISOString()
    };

    db.setTable('students', students);
    res.json({ student: students[index], message: 'Student updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE student
router.delete('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    let students = db.getTable('students');
    let gradeAttempts = db.getTable('grade_attempts');
    let arrears = db.getTable('arrears');

    const target = students.find(s => s.id === id || s.register_number === id);
    if (!target) {
      return res.status(404).json({ error: 'Student not found' });
    }

    students = students.filter(s => s.id !== target.id);
    gradeAttempts = gradeAttempts.filter(g => g.student_id !== target.id && g.register_number !== target.register_number);
    arrears = arrears.filter(a => a.student_id !== target.id && a.register_number !== target.register_number);

    db.setTable('students', students);
    db.setTable('grade_attempts', gradeAttempts);
    db.setTable('arrears', arrears);

    res.json({ message: 'Student deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
