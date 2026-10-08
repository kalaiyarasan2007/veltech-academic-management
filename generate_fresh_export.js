import { generateCollegeExcelWorkbook } from './server/src/excelExport.js';
import fs from 'fs';

async function main() {
  console.log('Generating fresh Excel from current code...');
  const wb = await generateCollegeExcelWorkbook();
  const buffer = await wb.xlsx.writeBuffer();
  fs.writeFileSync('Academic_Records_Updated.xlsx', Buffer.from(buffer));
  console.log(`Saved Academic_Records_Updated.xlsx (${buffer.length} bytes)`);
}

main();
