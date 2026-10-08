import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { GRADE_POINT_MAP, isArrearGrade } from './formulas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const EXTRACTED_JSON_PATH = path.join(__dirname, '../../extracted_students.json');

export function runSeed() {
  console.log('Starting seed process...');

  if (!fs.existsSync(EXTRACTED_JSON_PATH)) {
    console.error('extracted_students.json not found! Cannot seed Excel data.');
    return;
  }

  const raw = fs.readFileSync(EXTRACTED_JSON_PATH, 'utf-8');
  const extractedStudents = JSON.parse(raw);

  const studentsList = [];
  const gradeAttemptsList = [];
  const arrearsList = [];

  const semesterExamMonths = {
    1: { month: 'January', year: '2021' },
    2: { month: 'June', year: '2021' },
    3: { month: 'January', year: '2022' },
    4: { month: 'June', year: '2022' },
    5: { month: 'January', year: '2023' },
    6: { month: 'June', year: '2023' },
    7: { month: 'January', year: '2024' },
    8: { month: 'June', year: '2024' }
  };

  let studentCount = 0;
  let attemptCount = 0;
  let arrearCount = 0;

  for (const item of extractedStudents) {
    const studentId = `std_${item.register_number}`;
    
    studentsList.push({
      id: studentId,
      register_number: item.register_number,
      roll_number: item.roll_number,
      name: item.name || `Student ${item.register_number}`,
      batch: item.batch || '2020-2024',
      department: item.department || 'Department of Computer Science and Engineering',
      sno: item.sno,
      created_at: new Date().toISOString()
    });
    studentCount++;

    // Track pending arrears per student to match clearance
    // Map: subject_code -> arrear record
    const activeArrears = {};

    for (let semNum = 1; semNum <= 8; semNum++) {
      const semSubjects = item.semesters[String(semNum)] || [];
      const examSchedule = semesterExamMonths[semNum];

      for (const sub of semSubjects) {
        if (!sub.grade) continue;

        const isArrear = isArrearGrade(sub.grade);
        const clearedInSem = sub.cleared_in_sem;

        // Regular attempt or clearance attempt?
        let attemptType = 'REGULAR';
        if (activeArrears[sub.subject_code] && !isArrear) {
          attemptType = 'ARREAR_CLEARANCE';
        }

        const attemptId = `att_${studentId}_s${semNum}_${sub.subject_code}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        gradeAttemptsList.push({
          id: attemptId,
          student_id: studentId,
          register_number: item.register_number,
          semester_number: semNum,
          subject_code: sub.subject_code,
          subject_name: sub.subject_name,
          credits: sub.credits,
          grade: sub.grade,
          grade_point: sub.grade_point,
          attempt_type: attemptType,
          exam_month: examSchedule.month,
          exam_year: examSchedule.year,
          created_at: new Date().toISOString()
        });
        attemptCount++;

        // Arrear logic handling:
        // Case 1: Sub grade is RA / U / AB / WH / WD -> Creates a pending arrear
        if (isArrear) {
          const arrearId = `arr_${studentId}_${sub.subject_code}_s${semNum}`;
          const newArrear = {
            id: arrearId,
            student_id: studentId,
            register_number: item.register_number,
            subject_code: sub.subject_code,
            subject_name: sub.subject_name,
            original_semester: semNum,
            original_grade: sub.grade,
            original_month: examSchedule.month,
            original_year: examSchedule.year,
            cleared_semester: clearedInSem || null,
            cleared_grade: clearedInSem ? sub.grade : null, // If Excel displays cleared grade in original cell
            cleared_month: clearedInSem ? semesterExamMonths[clearedInSem].month : null,
            cleared_year: clearedInSem ? semesterExamMonths[clearedInSem].year : null,
            status: clearedInSem ? 'CLEARED' : 'PENDING'
          };
          arrearsList.push(newArrear);
          arrearCount++;
          if (!clearedInSem) {
            activeArrears[sub.subject_code] = newArrear;
          }
        }
        // Case 2: Sub has a cleared grade in original cell and cleared_in_sem color mismatch detected!
        else if (clearedInSem) {
          const arrearId = `arr_${studentId}_${sub.subject_code}_s${semNum}`;
          const newArrear = {
            id: arrearId,
            student_id: studentId,
            register_number: item.register_number,
            subject_code: sub.subject_code,
            subject_name: sub.subject_name,
            original_semester: semNum,
            original_grade: 'RA', // Original was RA before clearance
            original_month: examSchedule.month,
            original_year: examSchedule.year,
            cleared_semester: clearedInSem,
            cleared_grade: sub.grade,
            cleared_month: semesterExamMonths[clearedInSem].month,
            cleared_year: semesterExamMonths[clearedInSem].year,
            status: 'CLEARED'
          };
          arrearsList.push(newArrear);
          arrearCount++;
        }
      }
    }
  }

  db.setTable('students', studentsList);
  db.setTable('grade_attempts', gradeAttemptsList);
  db.setTable('arrears', arrearsList);

  console.log(`Seeding complete! Seeded ${studentCount} students, ${attemptCount} grade attempts, and ${arrearCount} arrear records.`);
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeed();
}
