import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const templatePath = path.join(__dirname, '../../CN-PRJECT  DETSILS.xlsx');

async function test() {
  console.log("Loading ExcelJS workbook from:", templatePath);
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(templatePath);

  console.log("Sheets in master template:", workbook.worksheets.map(w => w.name));
  const wsMain = workbook.getWorksheet('20-24');
  console.log("Main sheet row count:", wsMain.rowCount, "column count:", wsMain.columnCount);

  const row4 = wsMain.getRow(4);
  console.log("Col 5 (E4):", row4.getCell(5).value);
  console.log("Col 7 (G4):", row4.getCell(7).value);

  const row7 = wsMain.getRow(7);
  console.log("Row 7 Reg No:", row7.getCell(3).value, "Name:", row7.getCell(4).value);
}

test().catch(console.error);
