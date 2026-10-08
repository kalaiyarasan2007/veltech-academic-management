import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  generateCollegeExcelWorkbook, 
  generateCommonExcelWorkbook,
  getCollegeExcelPreviewData,
  getCommonExcelPreviewData,
  resolveSectionAndDept,
  getSectionExcelFilename
} from '../excelExport.js';
import { parseAndImportCollegeExcel } from '../excelImport.js';
import { db } from '../db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ORIGINAL_MASTER_PATH = path.join(__dirname, '../../../CN-PRJECT  DETSILS.xlsx');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// GET download original untouched faculty master Excel
router.get('/original', (req, res) => {
  try {
    if (!fs.existsSync(ORIGINAL_MASTER_PATH)) {
      return res.status(404).json({ error: 'Original master Excel template not found at ' + ORIGINAL_MASTER_PATH });
    }
    const filename = 'CN-PRJECT  DETSILS.xlsx';
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const fileStream = fs.createReadStream(ORIGINAL_MASTER_PATH);
    fileStream.pipe(res);
  } catch (err) {
    console.error('Download Original Excel Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET Section-wise Excel preview JSON (Department + Section)
router.get('/section/preview', async (req, res) => {
  try {
    const { section_id, section_code, department_id } = req.query;
    const previewData = await getCollegeExcelPreviewData({ section_id, section_code, department_id });
    res.json(previewData);
  } catch (err) {
    console.error('Section Excel Preview Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET Section-wise Excel export download (.xlsx)
router.get('/section/export', async (req, res) => {
  try {
    const { section_id, section_code, department_id } = req.query;
    const result = await generateCollegeExcelWorkbook({ section_id, section_code, department_id });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.buffer.length);

    res.status(200).send(Buffer.from(result.buffer));
  } catch (err) {
    console.error('Section Excel Export Error:', err);
    res.status(500).json({ error: 'Failed to generate Section Excel download: ' + err.message });
  }
});

// GET Common Excel preview JSON (Master configurations)
router.get('/common/preview', async (req, res) => {
  try {
    const previewData = await getCommonExcelPreviewData();
    res.json(previewData);
  } catch (err) {
    console.error('Common Excel Preview Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET Common Excel export download (.xlsx)
router.get('/common/export', async (req, res) => {
  try {
    const result = await generateCommonExcelWorkbook();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.buffer.length);

    res.status(200).send(Buffer.from(result.buffer));
  } catch (err) {
    console.error('Common Excel Export Error:', err);
    res.status(500).json({ error: 'Failed to generate Common Excel download: ' + err.message });
  }
});

// Backward-compatible fallback endpoints
router.get('/preview', async (req, res) => {
  try {
    const { section_id, section_code, department_id } = req.query;
    const previewData = await getCollegeExcelPreviewData({ section_id, section_code, department_id });
    res.json(previewData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/export', async (req, res) => {
  try {
    const { section_id, section_code, department_id } = req.query;
    const result = await generateCollegeExcelWorkbook({ section_id, section_code, department_id });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
    res.setHeader('Content-Length', result.buffer.length);

    res.status(200).send(Buffer.from(result.buffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST import Excel workbook
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Excel file (.xlsx) is required' });
    }

    const result = await parseAndImportCollegeExcel(req.file.buffer);
    res.json({
      message: 'Excel file imported successfully!',
      ...result
    });
  } catch (err) {
    console.error('Excel Import Error:', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
