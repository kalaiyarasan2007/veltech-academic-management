import express from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all subjects with filters
router.get('/', (req, res) => {
  try {
    const { department_id, semester_number, curriculum_id, section_id, search, status } = req.query;
    let subjects = db.getTable('subjects');
    const departments = db.getTable('departments');

    if (department_id) {
      subjects = subjects.filter(s => s.department_id === department_id);
    }

    if (semester_number) {
      const sem = parseInt(semester_number);
      subjects = subjects.filter(s => s.semester_number === sem);
    }

    if (curriculum_id) {
      subjects = subjects.filter(s => s.curriculum_id === curriculum_id);
    }

    if (status) {
      subjects = subjects.filter(s => s.status === status);
    }

    // If filtered by section_id, check section_subjects mapping
    if (section_id) {
      const sectionSubjects = db.getTable('section_subjects');
      const assignedIds = new Set(sectionSubjects.filter(ss => ss.section_id === section_id).map(ss => ss.subject_id));
      if (assignedIds.size > 0) {
        subjects = subjects.filter(s => assignedIds.has(s.id));
      }
    }

    if (search) {
      const q = String(search).toLowerCase().trim();
      subjects = subjects.filter(s => 
        s.subject_code.toLowerCase().includes(q) ||
        s.subject_name.toLowerCase().includes(q) ||
        (s.subject_type && s.subject_type.toLowerCase().includes(q))
      );
    }

    const deptMap = {};
    for (const d of departments) {
      deptMap[d.id] = d;
    }

    const enriched = subjects.map(s => ({
      ...s,
      department_name: deptMap[s.department_id]?.name || 'Department of Computer Science and Engineering'
    })).sort((a, b) => {
      if (a.semester_number !== b.semester_number) return a.semester_number - b.semester_number;
      return (a.display_order || 0) - (b.display_order || 0);
    });

    res.json({ subjects: enriched, total: enriched.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single subject
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const subjects = db.getTable('subjects');
    const sub = subjects.find(s => s.id === id || s.subject_code === id);
    if (!sub) return res.status(404).json({ error: 'Subject not found' });
    res.json({ subject: sub });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new subject
router.post('/', requireAdmin, (req, res) => {
  try {
    const { 
      subject_code, 
      subject_name, 
      semester_number, 
      credits, 
      department_id, 
      batch, 
      curriculum_id, 
      subject_type 
    } = req.body;

    if (!subject_code || !subject_name || !semester_number || credits === undefined) {
      return res.status(400).json({ error: 'Subject Code, Name, Semester, and Credits are required' });
    }

    const subjects = db.getTable('subjects');
    const cleanCode = subject_code.trim().toUpperCase();
    const sem = parseInt(semester_number);
    const cr = parseInt(credits);

    const isDup = subjects.some(s => 
      s.subject_code === cleanCode && 
      s.semester_number === sem && 
      (!department_id || s.department_id === department_id)
    );
    if (isDup) {
      return res.status(400).json({ error: `Subject ${cleanCode} already exists in Semester ${sem}` });
    }

    const newSub = {
      id: `sub_${cleanCode.replace(/[^a-zA-Z0-9]/g, '_')}_s${sem}`,
      subject_code: cleanCode,
      subject_name: subject_name.trim(),
      semester_number: sem,
      credits: cr,
      department_id: department_id || 'dept_cse',
      batch: batch || '2020-2024',
      curriculum_id: curriculum_id || 'curr_cse_2020_2024',
      subject_type: subject_type || 'Theory',
      display_order: subjects.filter(s => s.semester_number === sem).length + 1,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    subjects.push(newSub);
    db.setTable('subjects', subjects);

    // Also auto-map to existing sections in this department
    const sections = db.getTable('sections').filter(sec => sec.department_id === newSub.department_id);
    let sectionSubjects = db.getTable('section_subjects');
    for (const sec of sections) {
      if (!sectionSubjects.some(ss => ss.section_id === sec.id && ss.subject_id === newSub.id)) {
        sectionSubjects.push({
          id: `ss_${sec.id}_${newSub.id}`,
          section_id: sec.id,
          subject_id: newSub.id,
          created_at: new Date().toISOString()
        });
      }
    }
    db.setTable('section_subjects', sectionSubjects);

    res.status(201).json({ subject: newSub, message: 'Subject added successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update subject
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { 
      subject_code, 
      subject_name, 
      semester_number, 
      credits, 
      department_id, 
      batch, 
      curriculum_id, 
      subject_type,
      status 
    } = req.body;

    const subjects = db.getTable('subjects');
    const idx = subjects.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Subject not found' });

    subjects[idx] = {
      ...subjects[idx],
      subject_code: subject_code !== undefined ? subject_code.trim().toUpperCase() : subjects[idx].subject_code,
      subject_name: subject_name !== undefined ? subject_name.trim() : subjects[idx].subject_name,
      semester_number: semester_number !== undefined ? parseInt(semester_number) : subjects[idx].semester_number,
      credits: credits !== undefined ? parseInt(credits) : subjects[idx].credits,
      department_id: department_id !== undefined ? department_id : subjects[idx].department_id,
      batch: batch !== undefined ? batch : subjects[idx].batch,
      curriculum_id: curriculum_id !== undefined ? curriculum_id : subjects[idx].curriculum_id,
      subject_type: subject_type !== undefined ? subject_type : subjects[idx].subject_type,
      status: status !== undefined ? status : subjects[idx].status,
      updated_at: new Date().toISOString()
    };

    db.setTable('subjects', subjects);
    res.json({ subject: subjects[idx], message: 'Subject updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle subject status
router.patch('/:id/toggle-status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const subjects = db.getTable('subjects');
    const idx = subjects.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Subject not found' });

    subjects[idx].status = subjects[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    subjects[idx].updated_at = new Date().toISOString();

    db.setTable('subjects', subjects);
    res.json({ subject: subjects[idx], message: `Subject status updated to ${subjects[idx].status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Section-specific subject configuration endpoints
router.get('/section/:section_id', (req, res) => {
  try {
    const { section_id } = req.params;
    const sectionSubjects = db.getTable('section_subjects').filter(ss => ss.section_id === section_id);
    const assignedIds = new Set(sectionSubjects.map(ss => ss.subject_id));
    const allSubjects = db.getTable('subjects');

    const result = allSubjects.map(sub => ({
      ...sub,
      is_assigned: assignedIds.has(sub.id)
    }));

    res.json({ subjects: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/section/:section_id/assign', requireAdmin, (req, res) => {
  try {
    const { section_id } = req.params;
    const { subject_ids } = req.body; // Array of subject IDs to assign

    if (!Array.isArray(subject_ids)) {
      return res.status(400).json({ error: 'subject_ids array required' });
    }

    let sectionSubjects = db.getTable('section_subjects').filter(ss => ss.section_id !== section_id);
    for (const subId of subject_ids) {
      sectionSubjects.push({
        id: `ss_${section_id}_${subId}`,
        section_id,
        subject_id: subId,
        created_at: new Date().toISOString()
      });
    }

    db.setTable('section_subjects', sectionSubjects);
    res.json({ message: 'Section subjects configured successfully', count: subject_ids.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
