import express from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all sections (optional filter by department_id)
router.get('/', (req, res) => {
  try {
    const { department_id } = req.query;
    let sections = db.getTable('sections');
    const departments = db.getTable('departments');
    const students = db.getTable('students');

    if (department_id) {
      sections = sections.filter(s => s.department_id === department_id);
    }

    // Attach department info & student count
    const deptMap = {};
    for (const d of departments) {
      deptMap[d.id] = d;
    }

    const studentCountMap = {};
    for (const std of students) {
      const sId = std.section_id || std.section;
      studentCountMap[sId] = (studentCountMap[sId] || 0) + 1;
      if (std.section_code) {
        studentCountMap[std.section_code] = (studentCountMap[std.section_code] || 0) + 1;
      }
    }

    const enriched = sections.map(s => {
      const dept = deptMap[s.department_id];
      const count = studentCountMap[s.id] || studentCountMap[s.section_code] || 0;
      return {
        ...s,
        department_name: dept ? dept.name : 'Unknown Department',
        department_code: dept ? dept.code : '',
        student_count: count
      };
    });

    res.json({ sections: enriched, total: enriched.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single section
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const sections = db.getTable('sections');
    const sec = sections.find(s => s.id === id || s.section_code === id);
    if (!sec) return res.status(404).json({ error: 'Section not found' });
    res.json({ section: sec });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new section
router.post('/', requireAdmin, (req, res) => {
  try {
    const { department_id, section_name, section_code } = req.body;
    if (!department_id || !section_name) {
      return res.status(400).json({ error: 'Department ID and Section Name are required' });
    }

    const departments = db.getTable('departments');
    const dept = departments.find(d => d.id === department_id || d.code === department_id);
    if (!dept) {
      return res.status(400).json({ error: 'Selected Department does not exist' });
    }

    const sections = db.getTable('sections');
    const cleanCode = (section_code || section_name).trim().toUpperCase();

    if (sections.some(s => s.department_id === dept.id && s.section_code === cleanCode)) {
      return res.status(400).json({ error: `Section '${cleanCode}' already exists in this department` });
    }

    const newSection = {
      id: `sec_${dept.code.toLowerCase()}_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      department_id: dept.id,
      section_name: section_name.trim(),
      section_code: cleanCode,
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    sections.push(newSection);
    db.setTable('sections', sections);

    // Also auto-map existing subjects of this department to new section in section_subjects
    const subjects = db.getTable('subjects');
    let sectionSubjects = db.getTable('section_subjects');
    const deptSubjects = subjects.filter(sub => sub.department_id === dept.id);
    for (const sub of deptSubjects) {
      sectionSubjects.push({
        id: `ss_${newSection.id}_${sub.id}`,
        section_id: newSection.id,
        subject_id: sub.id,
        created_at: new Date().toISOString()
      });
    }
    db.setTable('section_subjects', sectionSubjects);

    res.status(201).json({ section: newSection, message: 'Section created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update section
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { section_name, section_code, status, department_id } = req.body;

    const sections = db.getTable('sections');
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Section not found' });

    sections[idx] = {
      ...sections[idx],
      section_name: section_name !== undefined ? section_name.trim() : sections[idx].section_name,
      section_code: section_code !== undefined ? section_code.trim().toUpperCase() : sections[idx].section_code,
      status: status !== undefined ? status : sections[idx].status,
      department_id: department_id !== undefined ? department_id : sections[idx].department_id,
      updated_at: new Date().toISOString()
    };

    db.setTable('sections', sections);
    res.json({ section: sections[idx], message: 'Section updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle section status
router.patch('/:id/toggle-status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const sections = db.getTable('sections');
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Section not found' });

    sections[idx].status = sections[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    sections[idx].updated_at = new Date().toISOString();

    db.setTable('sections', sections);
    res.json({ section: sections[idx], message: `Section status changed to ${sections[idx].status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
