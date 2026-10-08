import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Testing generateCollegeExcelWorkbook import...');
const { generateCollegeExcelWorkbook } = await import('./src/excelExport.js');
const wb = await generateCollegeExcelWorkbook();
console.log('Workbook created successfully!');
console.log('Worksheets:', wb.worksheets.map(w => w.name));

const buffer = await wb.xlsx.writeBuffer();
console.log('Buffer generated, length:', buffer.length);
fs.writeFileSync('../CN_PROJECT_UPDATED.xlsx', buffer);
console.log('Saved CN_PROJECT_UPDATED.xlsx');
