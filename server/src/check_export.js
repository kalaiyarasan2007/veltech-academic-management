import ExcelJS from 'exceljs';

// Test without re-applying merges
const wb = new ExcelJS.Workbook();
await wb.xlsx.readFile('e:/COLLEGE PROJECT/CN-PRJECT  DETSILS.xlsx');
const ws = wb.getWorksheet('20-24');

// Write grades only
ws.getCell(7, 5).value = 'B_TEST'; // Only col 5

// NO merge re-apply
console.log('WITHOUT merge re-apply:');
const buf = await wb.xlsx.writeBuffer();
const wb2 = new ExcelJS.Workbook();
await wb2.xlsx.load(buf);
const ws2 = wb2.getWorksheet('20-24');
console.log('  Merges preserved:', ws2.model.merges?.length || 0);
console.log('  R7C5 (grade col):', JSON.stringify(ws2.getCell(7, 5).value));
console.log('  R7C6 (gp formula):', JSON.stringify(String(ws2.getCell(7, 6).value).slice(0, 80)));
console.log('  maxCol:', ws2.columnCount);

// Check if col 25 has value (HS8251 in sem 2)
console.log('\nRow 4 around col 24-26:');
for (let c = 23; c <= 27; c++) {
  console.log(`  C${c}:`, JSON.stringify(ws2.getCell(4, c).value));
}
