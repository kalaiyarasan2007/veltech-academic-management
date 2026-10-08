import ExcelJS from 'exceljs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MASTER_TEMPLATE_PATH = path.join(__dirname, '../../CN-PRJECT  DETSILS.xlsx');

async function test() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(MASTER_TEMPLATE_PATH);
  const ws = wb.getWorksheet('20-24');
  
  console.log('BEFORE WRITING:');
  console.log('Cell(7, 5) value:', ws.getCell(7, 5).value);
  console.log('Cell(7, 6) value:', ws.getCell(7, 6).value);
  
  // Set Cell(7, 5)
  ws.getCell(7, 5).value = 'A';
  
  console.log('AFTER SETTING CELL(7, 5) = "A":');
  console.log('Cell(7, 5) value:', ws.getCell(7, 5).value);
  console.log('Cell(7, 6) value:', ws.getCell(7, 6).value);

  // Write buffer and reload
  const buf = await wb.xlsx.writeBuffer();
  const wb2 = new ExcelJS.Workbook();
  await wb2.xlsx.load(buf);
  const ws2 = wb2.getWorksheet('20-24');
  console.log('AFTER RELOADING BUFFER:');
  console.log('Cell(7, 5) value:', ws2.getCell(7, 5).value);
  console.log('Cell(7, 6) value:', ws2.getCell(7, 6).value);
}

test();
