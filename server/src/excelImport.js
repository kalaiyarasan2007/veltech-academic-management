import ExcelJS from 'exceljs';
import { db } from './db.js';
import { GRADE_POINT_MAP, isArrearGrade } from './formulas.js';

export async function parseAndImportCollegeExcel(bufferOrPath) {
  const workbook = new ExcelJS.Workbook();
  
  if (typeof bufferOrPath === 'string') {
    await workbook.xlsx.readFile(bufferOrPath);
  } else {
    await workbook.xlsx.load(bufferOrPath);
  }

  const wsMain = workbook.getWorksheet('20-24') || workbook.worksheets[0];
  if (!wsMain) {
    throw new Error("Could not find main sheet '20-24' in uploaded Excel file.");
  }

  const existingStudents = db.getTable('students');
  const existingAttempts = db.getTable('grade_attempts');
  const existingArrears = db.getTable('arrears');
  const subjects = db.getTable('subjects');

  // Build subject lookup map: sem -> subject_code -> subject
  const subjectsBySem = {};
  for (const s of subjects) {
    if (!subjectsBySem[s.semester_number]) subjectsBySem[s.semester_number] = {};
    subjectsBySem[s.semester_number][s.subject_code] = s;
  }

  // Scan header row 4 & 6 to detect subject columns
  // Col index -> { sem, subject_code, credits }
  const colSubjectMapping = {};
  for (let c = 5; c <= wsMain.columnCount; c++) {
    const val4 = wsMain.getCell(4, c).value;
    const val5 = wsMain.getCell(5, c).value;
    const val6 = wsMain.getCell(6, c).value;

    const str4 = val4 ? String(val4).trim() : '';
    const str5 = val5 ? String(val5).trim() : '';
    const str6 = val6 ? String(val6).trim() : '';

    if (str4 && str5 && str6 && !isNaN(parseInt(str6))) {
      // Find which semester this subject belongs to
      for (const s of subjects) {
        if (s.subject_code === str4) {
          colSubjectMapping[c] = {
            semester_number: s.semester_number,
            subject_code: s.subject_code,
            subject_name: s.subject_name,
            credits: s.credits
          };
          break;
        }
      }
    }
  }

  let importedCount = 0;
  let updatedCount = 0;

  // Process rows from row 7 downwards
  for (let r = 7; r <= wsMain.rowCount; r++) {
    const regVal = wsMain.getCell(r, 3).value;
    const nameVal = wsMain.getCell(r, 4).value;
    const snoVal = wsMain.getCell(r, 2).value;

    if (!regVal) continue;
    const regStr = String(regVal).trim();
    if (!regStr || !/^\d{8,15}$/.test(regStr)) continue;

    const nameStr = nameVal ? String(nameVal).trim() : `Student ${regStr}`;
    const snoStr = snoVal ? String(snoVal).trim() : String(r - 6);

    let student = existingStudents.find(s => s.register_number === regStr);
    let studentId;

    if (!student) {
      studentId = `std_${regStr}`;
      student = {
        id: studentId,
        register_number: regStr,
        roll_number: `20CS${String(snoStr).padStart(3, '0')}`,
        name: nameStr,
        batch: '2020-2024',
        department: 'Department of Computer Science and Engineering',
        sno: snoStr,
        created_at: new Date().toISOString()
      };
      existingStudents.push(student);
      importedCount++;
    } else {
      studentId = student.id;
      student.name = nameStr;
      updatedCount++;
    }

    // Process subject grades for this student
    for (const [colIdxStr, subMeta] of Object.entries(colSubjectMapping)) {
      const c = parseInt(colIdxStr);
      const gradeCell = wsMain.getCell(r, c);
      let gradeVal = gradeCell.value ? String(gradeCell.value).trim().toUpperCase() : '';

      if (gradeCell.value !== null && typeof gradeCell.value === 'object' && gradeCell.value.result !== null && gradeCell.value.result !== undefined) {
        gradeVal = String(gradeCell.value.result).trim().toUpperCase();
      }

      if (!gradeVal) continue;

      const gp = GRADE_POINT_MAP[gradeVal] ?? 0;
      const isArrear = isArrearGrade(gradeVal);

      // Check if attempt already exists
      let attempt = existingAttempts.find(a => 
        a.student_id === studentId && 
        a.semester_number === subMeta.semester_number && 
        a.subject_code === subMeta.subject_code
      );

      if (attempt) {
        attempt.grade = gradeVal;
        attempt.grade_point = gp;
      } else {
        existingAttempts.push({
          id: `att_${studentId}_s${subMeta.semester_number}_${subMeta.subject_code}_${Date.now()}`,
          student_id: studentId,
          register_number: regStr,
          semester_number: subMeta.semester_number,
          subject_code: subMeta.subject_code,
          subject_name: subMeta.subject_name,
          credits: subMeta.credits,
          grade: gradeVal,
          grade_point: gp,
          attempt_type: 'REGULAR',
          exam_month: 'June',
          exam_year: '2024',
          created_at: new Date().toISOString()
        });
      }

      // Handle arrears
      if (isArrear) {
        let arrearRec = existingArrears.find(a => 
          a.student_id === studentId && 
          a.subject_code === subMeta.subject_code && 
          a.status === 'PENDING'
        );
        if (!arrearRec) {
          existingArrears.push({
            id: `arr_${studentId}_${subMeta.subject_code}_s${subMeta.semester_number}`,
            student_id: studentId,
            register_number: regStr,
            subject_code: subMeta.subject_code,
            subject_name: subMeta.subject_name,
            original_semester: subMeta.semester_number,
            original_grade: gradeVal,
            original_month: 'June',
            original_year: '2024',
            cleared_semester: null,
            cleared_grade: null,
            cleared_month: null,
            cleared_year: null,
            status: 'PENDING'
          });
        }
      }
    }
  }

  db.setTable('students', existingStudents);
  db.setTable('grade_attempts', existingAttempts);
  db.setTable('arrears', existingArrears);

  return { importedCount, updatedCount, totalStudents: existingStudents.length };
}
