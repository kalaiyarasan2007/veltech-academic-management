import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { db } from './src/db.js';
import { 
  generateCollegeExcelWorkbook, 
  generateCommonExcelWorkbook, 
  getCollegeExcelPreviewData, 
  getCommonExcelPreviewData,
  MASTER_TEMPLATE_PATH
} from './src/excelExport.js';
import { 
  GRADE_POINT_MAP, 
  SEMESTER_CREDITS, 
  calculateSemesterTotalGrade, 
  calculateGPA, 
  calculateCGPA, 
  isArrearGrade 
} from './src/formulas.js';

console.log('='.repeat(70));
console.log('COMPREHENSIVE BACKEND, DATABASE, FORMULA & EXCEL TEST SUITE');
console.log('='.repeat(70));

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✓ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${testName}`);
    failed++;
  }
}

async function runTests() {
  // 1. Master Template Existence & Resolution
  console.log('\n--- 1. Master Excel Template Verification ---');
  assert(fs.existsSync(MASTER_TEMPLATE_PATH), `Master template found at: ${MASTER_TEMPLATE_PATH}`);
  const stats = fs.statSync(MASTER_TEMPLATE_PATH);
  assert(stats.size > 100000, `Master template has valid file size: ${stats.size} bytes`);

  // 2. Database Integrity Checks
  console.log('\n--- 2. Database Integrity Checks ---');
  const adminUsers = db.getTable('admin_users');
  assert(adminUsers.length >= 1, `Admin user exists (count: ${adminUsers.length})`);
  const admin = adminUsers[0];
  assert(admin.email === 'admin@veltech.edu.in', `Admin email matches: ${admin.email}`);
  const isPwValid = await bcrypt.compare('VelTech@2026', admin.password_hash);
  assert(isPwValid, 'Admin password hash successfully verifies against VelTech@2026');

  const depts = db.getTable('departments');
  assert(depts.length === 3, `Departments count is 3 (actual: ${depts.length})`);

  const sections = db.getTable('sections');
  assert(sections.length === 5, `Sections count is 5 (actual: ${sections.length})`);

  const students = db.getTable('students');
  assert(students.length === 129, `Total students enrolled is 129 (actual: ${students.length})`);

  const subjects = db.getTable('subjects');
  assert(subjects.length === 64, `Total subjects across 8 semesters is 64 (actual: ${subjects.length})`);

  const attempts = db.getTable('grade_attempts');
  assert(attempts.length >= 7000, `Total grade attempts exceeds 7000 (actual: ${attempts.length})`);

  const arrears = db.getTable('arrears');
  assert(arrears.length === 30, `Total tracked arrears is 30 (actual: ${arrears.length})`);

  // 3. Section Student Isolation
  console.log('\n--- 3. Section Student Isolation ---');
  const cseA = students.filter(s => s.section_id === 'sec_cse_a' || s.section === 'CSE-A');
  const cseB = students.filter(s => s.section_id === 'sec_cse_b' || s.section === 'CSE-B');
  const cseC = students.filter(s => s.section_id === 'sec_cse_c' || s.section === 'CSE-C');
  assert(cseA.length === 62, `CSE-A student count is 62 (actual: ${cseA.length})`);
  assert(cseB.length === 66, `CSE-B student count is 66 (actual: ${cseB.length})`);
  assert(cseC.length === 1, `CSE-C student count is 1 (actual: ${cseC.length})`);
  assert(cseA.length + cseB.length + cseC.length === 129, 'Section counts sum correctly to 129 students');

  // 4. Formula Calculation Engine
  console.log('\n--- 4. Academic Formula Calculations ---');
  assert(GRADE_POINT_MAP['O'] === 10, 'Grade O = 10');
  assert(GRADE_POINT_MAP['A+'] === 9, 'Grade A+ = 9');
  assert(GRADE_POINT_MAP['A'] === 8, 'Grade A = 8');
  assert(GRADE_POINT_MAP['B+'] === 7, 'Grade B+ = 7');
  assert(GRADE_POINT_MAP['B'] === 6, 'Grade B = 6');
  assert(GRADE_POINT_MAP['C'] === 5, 'Grade C = 5');
  assert(GRADE_POINT_MAP['RA'] === 0, 'Grade RA = 0');
  assert(isArrearGrade('RA') === true, 'isArrearGrade(RA) = true');
  assert(isArrearGrade('WH') === true, 'isArrearGrade(WH) = true');
  assert(isArrearGrade('AB') === true, 'isArrearGrade(AB) = true');
  assert(isArrearGrade('WD') === true, 'isArrearGrade(WD) = true');
  assert(isArrearGrade('B+') === false, 'isArrearGrade(B+) = false');

  // GPA calculation test (Sem 1: 25 credits, total grade = 212.5 -> GPA = 8.5)
  const gpa = calculateGPA(212.5, 1);
  assert(parseFloat(gpa) === 8.5, `calculateGPA(212.5, 1) = 8.50 (actual: ${gpa})`);

  // Cumulative CGPA calculation test
  const semTotals = { 1: 200, 2: 192 }; // Sem 1 (25 creds) + Sem 2 (24 creds) = 49 creds, total 392 -> 8.0
  const cgpa = calculateCGPA(semTotals, 2);
  assert(parseFloat(cgpa) === 8.0, `calculateCGPA({1: 200, 2: 192}, 2) = 8.00 (actual: ${cgpa})`);

  // 5. Excel Generation - Section Workbooks
  console.log('\n--- 5. Excel Generation (Section Workbooks) ---');
  const t0 = Date.now();
  const cseAExport = await generateCollegeExcelWorkbook({ section_id: 'sec_cse_a' });
  const t1 = Date.now();
  assert(cseAExport && cseAExport.buffer, `CSE-A Workbook generated in ${t1 - t0}ms`);
  assert(cseAExport.filename === 'CSE_A_Academic_Records.xlsx', `CSE-A filename correct: ${cseAExport.filename}`);
  assert(cseAExport.buffer.length > 200000, `CSE-A buffer size valid: ${cseAExport.buffer.length} bytes`);

  const cseBExport = await generateCollegeExcelWorkbook({ section_id: 'sec_cse_b' });
  assert(cseBExport && cseBExport.buffer, 'CSE-B Workbook generated successfully');
  assert(cseBExport.filename === 'CSE_B_Academic_Records.xlsx', `CSE-B filename correct: ${cseBExport.filename}`);
  assert(cseBExport.buffer.length > 200000, `CSE-B buffer size valid: ${cseBExport.buffer.length} bytes`);

  // 6. Excel Generation - Common Workbook
  console.log('\n--- 6. Excel Generation (Common Workbook) ---');
  const commonExport = await generateCommonExcelWorkbook();
  assert(commonExport && commonExport.buffer, 'Common Workbook generated successfully');
  assert(commonExport.filename === 'Academic_Common_Data.xlsx', `Common filename correct: ${commonExport.filename}`);
  assert(commonExport.buffer.length > 10000, `Common buffer size valid: ${commonExport.buffer.length} bytes`);

  // 7. Interactive Excel Preview Engine
  console.log('\n--- 7. Interactive Excel Preview Engine ---');
  const secPreview = await getCollegeExcelPreviewData({ section_id: 'sec_cse_a' });
  assert(secPreview && secPreview.sheets && secPreview.sheets.length > 0, `Section preview has sheets (count: ${secPreview?.sheets?.length})`);
  assert(secPreview.sheets[0].name === '20-24', `Primary sheet name is '20-24' (actual: ${secPreview.sheets[0].name})`);
  assert(secPreview.sheets[0].rows.length > 10, `Primary sheet has rows (actual: ${secPreview.sheets[0].rows.length})`);
  assert(secPreview.studentCount === 62, `Section preview student count matches enrolled: ${secPreview.studentCount}`);

  const comPreview = await getCommonExcelPreviewData();
  assert(comPreview && comPreview.sheets && comPreview.sheets.length >= 5, `Common preview has config sheets (count: ${comPreview?.sheets?.length})`);

  console.log('\n' + '='.repeat(70));
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(70));

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
