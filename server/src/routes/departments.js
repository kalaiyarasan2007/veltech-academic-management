import express from 'express';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all departments
router.get('/', (req, res) => {
  try {
    const departments = db.getTable('departments');
    res.json({ departments, total: departments.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single department
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const departments = db.getTable('departments');
    const dept = departments.find(d => d.id === id || d.code === id);
    if (!dept) return res.status(404).json({ error: 'Department not found' });
    res.json({ department: dept });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST add new department
router.post('/', requireAdmin, (req, res) => {
  try {
    const { name, code, description } = req.body;
    if (!name || !code) {
      return res.status(400).json({ error: 'Department Name and Code are required' });
    }

    const departments = db.getTable('departments');
    const cleanCode = code.trim().toUpperCase();
    if (departments.some(d => d.code === cleanCode)) {
      return res.status(400).json({ error: `Department code '${cleanCode}' already exists` });
    }

    const newDept = {
      id: `dept_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
      name: name.trim(),
      code: cleanCode,
      description: description ? description.trim() : name.trim(),
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    };

    departments.push(newDept);
    db.setTable('departments', departments);

    res.status(201).json({ department: newDept, message: 'Department created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update department
router.put('/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, status } = req.body;

    const departments = db.getTable('departments');
    const idx = departments.findIndex(d => d.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Department not found' });

    departments[idx] = {
      ...departments[idx],
      name: name !== undefined ? name.trim() : departments[idx].name,
      code: code !== undefined ? code.trim().toUpperCase() : departments[idx].code,
      description: description !== undefined ? description.trim() : departments[idx].description,
      status: status !== undefined ? status : departments[idx].status,
      updated_at: new Date().toISOString()
    };

    db.setTable('departments', departments);
    res.json({ department: departments[idx], message: 'Department updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle status (Activate / Deactivate)
router.patch('/:id/toggle-status', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const departments = db.getTable('departments');
    const idx = departments.findIndex(d => d.id === id);
    if (idx === -1) return res.status(404).json({ error: 'Department not found' });

    departments[idx].status = departments[idx].status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    departments[idx].updated_at = new Date().toISOString();

    db.setTable('departments', departments);
    res.json({ department: departments[idx], message: `Department status changed to ${departments[idx].status}` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
