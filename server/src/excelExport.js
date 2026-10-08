import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from './db.js';
import { GRADE_POINT_MAP, isArrearGrade } from './formulas.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Primary Source of Truth: Master Template File (never modified)
const MASTER_TEMPLATE_PATH = path.join(__dirname, '../../CN-PRJECT  DETSILS.xlsx');

/**
 * Exact semester-to-grade-column mapping from the original Excel (CN-PRJECT  DETSILS.xlsx).
 * Grade col holds letter grade (O, A+, A, B+, B, C, RA, etc.)
 * GP col holds IF formula computing grade point.
 */
export const EXACT_SUBJECT_GRADE_COLS = {
  // Semester 1 (cols 5-20)
  'HS8151':  [5,   6],
  'MA8151':  [7,   8],
  'PH8151':  [9,   10],
  'CY8151':  [11,  12],
  'GE8151':  [13,  14],
  'GE8152':  [15,  16],
  'GE8161':  [17,  18],
  'BS8161':  [19,  20],
  // Semester 2 (cols 25-40)
  'HS8251':  [25,  26],
  'MA8251':  [27,  28],
  'PH 8252': [29,  30],
  'BE8255':  [31,  32],
  'GE8291':  [33,  34],
  'CS8251':  [35,  36],
  'GE8261':  [37,  38],
  'CS8261':  [39,  40],
  // Semester 3 (cols 47-64)
  'MA8351':  [47,  48],
  'CS8351':  [49,  50],
  'CS8391':  [51,  52],
  'CS8392':  [53,  54],
  'EC8395':  [55,  56],
  'CS8381':  [57,  58],
  'CS8383':  [59,  60],
  'CS8382':  [61,  62],
  'HS8381':  [63,  64],
  // Semester 4 (cols 71-88)
  'MA8402':  [71,  72],
  'CS8491':  [73,  74],
  'CS8492':  [75,  76],
  'CS8451':  [77,  78],
  'CS8493':  [79,  80],
  'CS8494':  [81,  82],
  'CS8481':  [83,  84],
  'CS8461':  [85,  86],
  'HS8461':  [87,  88],
  // Semester 5 (cols 95-112)
  'MA8551':  [95,  96],
  'CS8591':  [97,  98],
  'EC8691':  [99,  100],
  'CS8501':  [101, 102],
  'CS8592':  [103, 104],
  'OMF551':  [105, 106],
  'EC8681':  [107, 108],
  'CS8582':  [109, 110],
  'CS8581':  [111, 112],
  // Semester 6 (cols 119-138)
  'CS8651':  [119, 120],
  'CS8691':  [121, 122],
  'CS8601':  [123, 124],
  'CS8602':  [125, 126],
  'CS8603':  [127, 128],
  'IT8076':  [129, 130],
  'CS8661':  [131, 132],
  'CS8662':  [133, 134],
  'CS8611':  [135, 136],
  'HS8581':  [137, 138],
  // Semester 7 (cols 145-160)
  'MG8591':  [145, 146],
  'CS8792':  [147, 148],
  'CS8791':  [149, 150],
  'OME753':  [151, 152],
  'IT8075':  [153, 154],
  'CS8079':  [155, 156],
  'CS8711':  [157, 158],
  'IT8761':  [159, 160],
  // Semester 8 (cols 167-172)
  'IT8073':  [167, 168],
  'CS8080':  [169, 170],
  'CS8811':  [171, 172],
};

/**
 * Exact Subject Credits from original Excel row 6
 */
export const SUBJECT_CREDITS = {
  "HS8151": 4, "MA8151": 4, "PH8151": 3, "CY8151": 3, "GE8151": 3, "GE8152": 4, "GE8161": 2, "BS8161": 2,
  "HS8251": 4, "MA8251": 4, "PH 8252": 3, "BE8255": 3, "GE8291": 3, "CS8251": 3, "GE8261": 2, "CS8261": 2,
  "MA8351": 4, "CS8351": 4, "CS8391": 3, "CS8392": 3, "EC8395": 3, "CS8381": 2, "CS8383": 2, "CS8382": 2, "HS8381": 1,
  "MA8402": 4, "CS8491": 3, "CS8492": 3, "CS8451": 3, "CS8493": 3, "CS8494": 3, "CS8481": 2, "CS8461": 2, "HS8461": 1,
  "MA8551": 4, "CS8591": 3, "EC8691": 3, "CS8501": 3, "CS8592": 3, "OMF551": 3, "EC8681": 2, "CS8582": 2, "CS8581": 2,
  "CS8651": 3, "CS8691": 3, "CS8601": 3, "CS8602": 4, "CS8603": 3, "IT8076": 3, "CS8661": 2, "CS8662": 2, "CS8611": 1, "HS8581": 1,
  "MG8591": 3, "CS8792": 3, "CS8791": 3, "OME753": 3, "IT8075": 3, "CS8079": 3, "CS8711": 2, "IT8761": 2,
  "IT8073": 3, "CS8080": 3, "CS8811": 10
};

/**
 * Semester ARGB fill colors (exact colors from original Excel)
 */
export const SEM_FILL_ARGB = {
  1: 'FF92D050',
  2: 'FFB3CEFA',
  3: 'FFFFA766',
  4: 'FF00B0F0',
  5: 'FFFFFF00',
  6: 'FFF28E85',
  7: 'FFCC9900',
  8: null, // Sem 8 in original file has no fill
};

/**
 * Semester structure, columns, and formulas matching original Excel
 */
export const SEMESTER_META = {
  1: {
    semester: 1,
    credits: 25,
    cumCredits: 25,
    totalGradeCol: 21,
    gpaCol: 22,
    cgpaCol: null,
    arrearCol: 23,
    cumArrearCol: null,
    subjects: ['HS8151', 'MA8151', 'PH8151', 'CY8151', 'GE8151', 'GE8152', 'GE8161', 'BS8161'],
    totalGradeFormula: (r) => `F${r}*4+H${r}*4+J${r}*3+L${r}*3+N${r}*3+P${r}*4+R${r}*2+T${r}*2`,
    gpaFormula: (r) => `U${r}/25`,
    cgpaFormula: null,
    arrearFormula: (r) => `COUNTIF(E${r}:S${r},"U")+COUNTIF(E${r}:S${r},"RA")`,
    cumArrearFormula: null
  },
  2: {
    semester: 2,
    credits: 24,
    cumCredits: 49,
    totalGradeCol: 41,
    gpaCol: 42,
    cgpaCol: 43,
    arrearCol: 44,
    cumArrearCol: 45,
    subjects: ['HS8251', 'MA8251', 'PH 8252', 'BE8255', 'GE8291', 'CS8251', 'GE8261', 'CS8261'],
    totalGradeFormula: (r) => `Z${r}*4+AB${r}*4+AD${r}*3+AF${r}*3+AH${r}*3+AJ${r}*3+AL${r}*2+AN${r}*2`,
    gpaFormula: (r) => `AO${r}/24`,
    cgpaFormula: (r) => `(U${r}+AO${r})/49`,
    arrearFormula: (r) => `COUNTIF(Y${r}:AN${r},"U")+COUNTIF(Y${r}:AN${r},"RA")`,
    cumArrearFormula: (r) => `COUNTIF(E${r}:AO${r},"U")+COUNTIF(E${r}:AO${r},"RA")`
  },
  3: {
    semester: 3,
    credits: 24,
    cumCredits: 73,
    totalGradeCol: 65,
    gpaCol: 66,
    cgpaCol: 67,
    arrearCol: 68,
    cumArrearCol: 69,
    subjects: ['MA8351', 'CS8351', 'CS8391', 'CS8392', 'EC8395', 'CS8381', 'CS8383', 'CS8382', 'HS8381'],
    totalGradeFormula: (r) => `AV${r}*4+AX${r}*4+AZ${r}*3+BB${r}*3+BD${r}*3+BF${r}*2+BH${r}*2+BJ${r}*2+BL${r}*1`,
    gpaFormula: (r) => `BM${r}/24`,
    cgpaFormula: (r) => `(U${r}+AO${r}+BM${r})/73`,
    arrearFormula: (r) => `COUNTIF(AU${r}:BL${r},"U")+COUNTIF(AU${r}:BL${r},"RA")`,
    cumArrearFormula: (r) => `COUNTIF(E${r}:BL${r},"U")+COUNTIF(E${r}:BL${r},"RA")`
  },
  4: {
    semester: 4,
    credits: 24,
    cumCredits: 97,
    totalGradeCol: 89,
    gpaCol: 90,
    cgpaCol: 91,
    arrearCol: 92,
    cumArrearCol: 93,
    subjects: ['MA8402', 'CS8491', 'CS8492', 'CS8451', 'CS8493', 'CS8494', 'CS8481', 'CS8461', 'HS8461'],
    totalGradeFormula: (r) => `BT${r}*4+BV${r}*3+BX${r}*3+BZ${r}*3+CB${r}*3+CD${r}*3+CF${r}*2+CH${r}*2+CJ${r}*1`,
    gpaFormula: (r) => `CK${r}/24`,
    cgpaFormula: (r) => `(U${r}+AO${r}+BM${r}+CK${r})/97`,
    arrearFormula: (r) => `COUNTIF(BS${r}:CJ${r},"U")+COUNTIF(BS${r}:CJ${r},"RA")`,
    cumArrearFormula: (r) => `COUNTIF(E${r}:CJ${r},"U")+COUNTIF(E${r}:CJ${r},"RA")`
  },
  5: {
    semester: 5,
    credits: 25,
    cumCredits: 122,
    totalGradeCol: 113,
    gpaCol: 114,
    cgpaCol: 115,
    arrearCol: 116,
    cumArrearCol: 117,
    subjects: ['MA8551', 'CS8591', 'EC8691', 'CS8501', 'CS8592', 'OMF551', 'EC8681', 'CS8582', 'CS8581'],
    totalGradeFormula: (r) => `CR${r}*4+CT${r}*3+CV${r}*3+CX${r}*3+CZ${r}*3+DB${r}*3+DD${r}*2+DF${r}*2+DH${r}*2`,
    gpaFormula: (r) => `DI${r}/25`,
    cgpaFormula: (r) => `(U${r}+AO${r}+BM${r}+CK${r}+DI${r})/122`,
    arrearFormula: (r) => `COUNTIF(CQ${r}:DH${r},"U")+COUNTIF(CQ${r}:DH${r},"RA")`,
    cumArrearFormula: (r) => `COUNTIF(E${r}:DH${r},"U")+COUNTIF(E${r}:DH${r},"RA")`
  },
  6: {
    semester: 6,
    credits: 25,
    cumCredits: 147,
    totalGradeCol: 139,
    gpaCol: 140,
    cgpaCol: 141,
    arrearCol: 142,
    cumArrearCol: 143,
    subjects: ['CS8651', 'CS8691', 'CS8601', 'CS8602', 'CS8603', 'IT8076', 'CS8661', 'CS8662', 'CS8611', 'HS8581'],
    totalGradeFormula: (r) => `DP${r}*3+DR${r}*3+DT${r}*3+DV${r}*4+DX${r}*3+DZ${r}*3+EB${r}*2+ED${r}*2+EF${r}*1+EH${r}*1`,
    gpaFormula: (r) => `EI${r}/25`,
    cgpaFormula: (r) => `(U${r}+AO${r}+BM${r}+CK${r}+DI${r}+EI${r})/147`,
    arrearFormula: (r) => `COUNTIF(DO${r}:EH${r},"U")+COUNTIF(DO${r}:EH${r},"RA")`,
    cumArrearFormula: (r) => `COUNTIF(E${r}:EH${r},"U")+COUNTIF(E${r}:EH${r},"RA")`
  },
  7: {
    semester: 7,
    credits: 22,
    cumCredits: 169,
    totalGradeCol: 161,
    gpaCol: 162,
    cgpaCol: 163,
    arrearCol: 164,
    cumArrearCol: 165,
    subjects: ['MG8591', 'CS8792', 'CS8791', 'OME753', 'IT8075', 'CS8079', 'CS8711', 'IT8761'],
    totalGradeFormula: (r) => `EP${r}*3+ER${r}*3+ET${r}*3+EV${r}*3+EX${r}*3+EZ${r}*3+FB${r}*2+FD${r}*2`,
    gpaFormula: (r) => `FE${r}/22`,
    cgpaFormula: (r) => `(U${r}+AO${r}+BM${r}+CK${r}+DI${r}+EI${r}+FE${r})/169`,
    arrearFormula: (r) => `COUNTIF(EO${r}:FD${r},"U")+COUNTIF(EO${r}:FD${r},"RA")`,
    cumArrearFormula: (r) => `COUNTIF(E${r}:FD${r},"U")+COUNTIF(E${r}:FD${r},"RA")`
  },
  8: {
    semester: 8,
    credits: 16,
    cumCredits: 185,
    totalGradeCol: 173,
    gpaCol: 174,
    cgpaCol: 175,
    arrearCol: 176,
    cumArrearCol: 177,
    subjects: ['IT8073', 'CS8080', 'CS8811'],
    totalGradeFormula: (r) => `FL${r}*3+FN${r}*3+FP${r}*10`,
    gpaFormula: (r) => `FQ${r}/16`,
    cgpaFormula: (r) => `(U${r}+AO${r}+BM${r}+CK${r}+DI${r}+EI${r}+FE${r}+FQ${r})/185`,
    arrearFormula: (r) => `COUNTIF(FK${r}:FP${r},"U")+COUNTIF(FK${r}:FP${r},"RA")`,
    cumArrearFormula: (r) => `COUNTIF(E${r}:FP${r},"U")+COUNTIF(E${r}:FP${r},"RA")`
  }
};

/**
 * Resolve Section and Department info from criteria
 */
export function resolveSectionAndDept(options = {}) {
  const departments = db.getTable('departments');
  const sections = db.getTable('sections');

  let section = null;
  if (options.section_id) {
    section = sections.find(s => s.id === options.section_id || s.section_code === options.section_id);
  } else if (options.section_code) {
    section = sections.find(s => s.section_code === options.section_code);
  } else if (options.section) {
    section = sections.find(s => s.id === options.section || s.section_code === options.section);
  }

  // Fallback to first section if not specified
  if (!section && sections.length > 0) {
    section = sections[0];
  }

  let dept = null;
  if (section) {
    dept = departments.find(d => d.id === section.department_id);
  }
  if (!dept && options.department_id) {
    dept = departments.find(d => d.id === options.department_id || d.code === options.department_id);
  }
  if (!dept && departments.length > 0) {
    dept = departments[0];
  }

  return { section, department: dept };
}

/**
 * Helper to generate standardized file name: Department + Section
 * e.g. CSE_A_Academic_Records.xlsx
 */
export function getSectionExcelFilename(section, dept) {
  const deptCode = (dept?.code || 'CSE').trim();
  let secCode = (section?.section_code || section?.section_name || 'A').trim();

  // If secCode starts with deptCode (e.g. CSE-A or CSE_A), sanitize and return CSE_A_Academic_Records.xlsx
  if (secCode.toUpperCase().startsWith(deptCode.toUpperCase())) {
    const formatted = secCode.replace(/[^a-zA-Z0-9]/g, '_');
    return `${formatted}_Academic_Records.xlsx`;
  }
  const cleanDept = deptCode.replace(/[^a-zA-Z0-9]/g, '_');
  const cleanSec = secCode.replace(/[^a-zA-Z0-9]/g, '_');
  return `${cleanDept}_${cleanSec}_Academic_Records.xlsx`;
}

/**
 * SECTION-WISE EXCEL GENERATION
 * Generates an Excel workbook containing ONLY the students belonging to the specified section.
 * Preserves the exact structure, headers, formulas, and formatting of original master Excel.
 * NEVER overwrites the original template file.
 */
export async function generateCollegeExcelWorkbook(options = {}) {
  if (!fs.existsSync(MASTER_TEMPLATE_PATH)) {
    throw new Error(`Master Excel template file not found at ${MASTER_TEMPLATE_PATH}`);
  }

  const { section, department } = resolveSectionAndDept(options);
  const filename = getSectionExcelFilename(section, department);

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(MASTER_TEMPLATE_PATH);

  const allStudents = db.getTable('students');
  const gradeAttempts = db.getTable('grade_attempts');
  const arrears = db.getTable('arrears');

  // CRITICAL REQUIREMENT: Filter ONLY students belonging to THIS section!
  const targetSectionId = section?.id;
  const targetSectionCode = section?.section_code;

  const sectionStudents = allStudents.filter(s => {
    if (targetSectionId && s.section_id === targetSectionId) return true;
    if (targetSectionCode && (s.section === targetSectionCode || s.section_code === targetSectionCode)) return true;
    return false;
  }).sort((a, b) => {
    const aSno = parseInt(a.sno || '0', 10);
    const bSno = parseInt(b.sno || '0', 10);
    if (aSno && bSno) return aSno - bSno;
    return String(a.register_number).localeCompare(String(b.register_number));
  });

  const wsMain = workbook.getWorksheet('20-24');
  if (!wsMain) {
    throw new Error("Worksheet '20-24' not found in master template");
  }

  // Pre-build attempts and arrears lookups
  const studentAttemptsMap = {};
  for (const att of gradeAttempts) {
    if (att.student_id) {
      if (!studentAttemptsMap[att.student_id]) studentAttemptsMap[att.student_id] = {};
      studentAttemptsMap[att.student_id][att.subject_code] = att;
    }
    if (att.register_number) {
      if (!studentAttemptsMap[att.register_number]) studentAttemptsMap[att.register_number] = {};
      studentAttemptsMap[att.register_number][att.subject_code] = att;
    }
  }

  const arrearsMap = {};
  for (const arr of arrears) {
    if (arr.student_id) {
      if (!arrearsMap[arr.student_id]) arrearsMap[arr.student_id] = {};
      arrearsMap[arr.student_id][arr.subject_code] = arr;
    }
    if (arr.register_number) {
      if (!arrearsMap[arr.register_number]) arrearsMap[arr.register_number] = {};
      arrearsMap[arr.register_number][arr.subject_code] = arr;
    }
  }

  const templateStyleRow = wsMain.getRow(7);
  const studentYearTotals = {}; // index -> { sem1Tot, sem2Tot, ... }

  // 1. Populate each student of THIS section ONLY
  for (let i = 0; i < sectionStudents.length; i++) {
    const std = sectionStudents[i];
    const targetRow = 7 + i;
    const curRow = wsMain.getRow(targetRow);
    curRow.height = templateStyleRow.height || 20;

    // Set identification columns
    wsMain.getCell(targetRow, 2).value = i + 1; // Section-wise S.No
    wsMain.getCell(targetRow, 3).value = std.register_number;
    wsMain.getCell(targetRow, 4).value = std.name;

    const stdAttempts = {
      ...(studentAttemptsMap[std.id] || {}),
      ...(studentAttemptsMap[std.register_number] || {})
    };
    const stdArrears = {
      ...(arrearsMap[std.id] || {}),
      ...(arrearsMap[std.register_number] || {})
    };
    studentYearTotals[i] = {};

    let cumTotalGrade = 0;
    let cumCredits = 0;
    let cumPendingArrears = 0;

    // Process Semesters 1 to 8
    for (let sem = 1; sem <= 8; sem++) {
      const meta = SEMESTER_META[sem];
      let semTotalGrade = 0;
      let semArrears = 0;

      for (const subCode of meta.subjects) {
        const [gradeCol, gpCol] = EXACT_SUBJECT_GRADE_COLS[subCode];
        const credits = SUBJECT_CREDITS[subCode] || 3;
        const attempt = stdAttempts[subCode];
        const arrearRec = stdArrears[subCode];

        let letterGrade = null;
        if (arrearRec && arrearRec.status === 'CLEARED' && arrearRec.cleared_grade) {
          letterGrade = String(arrearRec.cleared_grade).trim().toUpperCase();
        } else if (attempt && attempt.grade) {
          letterGrade = String(attempt.grade).trim().toUpperCase();
        }

        if (letterGrade && letterGrade !== '') {
          const gp = GRADE_POINT_MAP[letterGrade] ?? 0;
          const gradeColLetter = wsMain.getColumn(gradeCol).letter;
          const gradeCell = wsMain.getCell(targetRow, gradeCol);
          const gpCell = wsMain.getCell(targetRow, gpCol);

          gradeCell.value = letterGrade;

          // Set IF formula and pre-calculated grade point result
          gpCell.value = {
            formula: `IF(${gradeColLetter}${targetRow}="O",10,IF(${gradeColLetter}${targetRow}="A+",9,IF(${gradeColLetter}${targetRow}="A",8,IF(${gradeColLetter}${targetRow}="B+",7,IF(${gradeColLetter}${targetRow}="B",6,0)))))`,
            result: gp
          };

          const isArrear = ['RA', 'WH', 'AB', 'WD', 'U'].includes(letterGrade);
          const isCleared = arrearRec && arrearRec.status === 'CLEARED';
          if (isArrear && !isCleared) {
            semArrears++;
            cumPendingArrears++;
          }

          // Arrear clearance color:
          if (isCleared && arrearRec.cleared_semester) {
            const clearArgb = SEM_FILL_ARGB[arrearRec.cleared_semester];
            if (clearArgb) {
              gradeCell.style = {
                ...gradeCell.style,
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: clearArgb } }
              };
              gpCell.style = {
                ...gpCell.style,
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: clearArgb } }
              };
            }
          } else if (SEM_FILL_ARGB[sem] && sem !== 8) {
            gradeCell.style = {
              ...gradeCell.style,
              fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: SEM_FILL_ARGB[sem] } }
            };
            gpCell.style = {
              ...gpCell.style,
              fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: SEM_FILL_ARGB[sem] } }
            };
          }

          semTotalGrade += (credits * gp);
        } else {
          // Empty cell
          wsMain.getCell(targetRow, gradeCol).value = null;
          wsMain.getCell(targetRow, gpCol).value = null;
        }
      }

      studentYearTotals[i][sem] = semTotalGrade;

      // 1. Total Grade Cell
      wsMain.getCell(targetRow, meta.totalGradeCol).value = {
        formula: meta.totalGradeFormula(targetRow),
        result: semTotalGrade
      };

      // 2. GPA Cell
      const semGPA = meta.credits > 0 ? Number((semTotalGrade / meta.credits).toFixed(2)) : 0;
      wsMain.getCell(targetRow, meta.gpaCol).value = {
        formula: meta.gpaFormula(targetRow),
        result: semGPA
      };

      // 3. Arrear Cell
      wsMain.getCell(targetRow, meta.arrearCol).value = {
        formula: meta.arrearFormula(targetRow),
        result: semArrears
      };

      // 4. Update Cumulative
      cumTotalGrade += semTotalGrade;
      cumCredits += meta.credits;
      const cumCGPA = cumCredits > 0 ? Number((cumTotalGrade / cumCredits).toFixed(2)) : 0;

      // 5. CGPA Cell
      if (meta.cgpaCol) {
        wsMain.getCell(targetRow, meta.cgpaCol).value = {
          formula: meta.cgpaFormula(targetRow),
          result: cumCGPA
        };
      }

      // 6. Cumulative Arrear Cell
      if (meta.cumArrearCol) {
        wsMain.getCell(targetRow, meta.cumArrearCol).value = {
          formula: meta.cumArrearFormula(targetRow),
          result: cumPendingArrears
        };
      }
    }
  }

  // 2. CRITICAL: Clear all remaining student rows beyond this section's students
  const clearStartRow = 7 + sectionStudents.length;
  const maxExistingRow = Math.max(wsMain.rowCount, 150);
  for (let r = clearStartRow; r <= maxExistingRow; r++) {
    const row = wsMain.getRow(r);
    for (let c = 1; c <= 178; c++) {
      const cell = row.getCell(c);
      cell.value = null;
    }
  }

  // 3. Update API Sheets ('I API', 'II API ', 'III API') for this section ONLY
  const apiSheetsConfig = [
    { name: 'I API', semA: 1, credA: 25, semB: 2, credB: 24, cumCred: 49 },
    { name: 'II API ', semA: 3, credA: 24, semB: 4, credB: 24, cumCred: 48 },
    { name: 'III API', semA: 5, credA: 25, semB: 6, credB: 25, cumCred: 50 },
  ];

  for (const cfg of apiSheetsConfig) {
    const wsApi = workbook.getWorksheet(cfg.name);
    if (!wsApi) continue;

    const templateApiRow = wsApi.getRow(10);

    for (let i = 0; i < sectionStudents.length; i++) {
      const std = sectionStudents[i];
      const apiRow = 10 + i;

      if (apiRow > 10) {
        const curApiRow = wsApi.getRow(apiRow);
        curApiRow.height = templateApiRow.height || 20;
        for (let c = 1; c <= 9; c++) {
          const src = templateApiRow.getCell(c);
          const dst = curApiRow.getCell(c);
          if (src.font) dst.font = { ...src.font };
          if (src.alignment) dst.alignment = { ...src.alignment };
          if (src.border) dst.border = { ...src.border };
          if (src.fill) dst.fill = JSON.parse(JSON.stringify(src.fill));
        }
      }

      const totA = studentYearTotals[i]?.[cfg.semA] || 0;
      const totB = studentYearTotals[i]?.[cfg.semB] || 0;
      const yearGPA = Number(((totA + totB) / cfg.cumCred).toFixed(2));

      wsApi.getCell(apiRow, 2).value = i + 1;
      wsApi.getCell(apiRow, 3).value = std.register_number;
      wsApi.getCell(apiRow, 4).value = std.name;
      wsApi.getCell(apiRow, 5).value = totA;
      wsApi.getCell(apiRow, 6).value = cfg.credA;
      wsApi.getCell(apiRow, 7).value = totB;
      wsApi.getCell(apiRow, 8).value = cfg.credB;
      wsApi.getCell(apiRow, 9).value = {
        formula: `(E${apiRow}+G${apiRow})/${cfg.cumCred}`,
        result: yearGPA
      };
    }

    // Clear extra rows in API sheet
    const apiClearStart = 10 + sectionStudents.length;
    const maxApiRow = Math.max(wsApi.rowCount, 150);
    for (let r = apiClearStart; r <= maxApiRow; r++) {
      const row = wsApi.getRow(r);
      for (let c = 1; c <= 10; c++) {
        row.getCell(c).value = null;
      }
    }
  }

  // Also save file to workspace root dynamically
  const outPath = path.join(__dirname, `../../${filename}`);
  const buffer = await workbook.xlsx.writeBuffer();
  fs.writeFileSync(outPath, buffer);

  return {
    workbook,
    filename,
    buffer,
    studentCount: sectionStudents.length,
    section,
    department
  };
}

/**
 * COMMON EXCEL WORKBOOK GENERATION
 * Generates Academic_Common_Data.xlsx containing master configuration:
 * Departments, Sections, Batches, Semesters, Subjects, Academic Configuration.
 * DOES NOT contain student individual marks/grades.
 */
export async function generateCommonExcelWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Academic System Administrator';
  workbook.created = new Date();

  const departments = db.getTable('departments');
  const sections = db.getTable('sections');
  const batches = db.getTable('batches');
  const semesters = db.getTable('semesters');
  const subjects = db.getTable('subjects');
  const gradeScale = db.getTable('grade_scale');

  const headerStyle = {
    font: { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }, // Deep blue
    alignment: { vertical: 'middle', horizontal: 'center' },
    border: {
      top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      bottom: { style: 'medium', color: { argb: 'FF1E293B' } },
      right: { style: 'thin', color: { argb: 'FFCBD5E1' } }
    }
  };

  const rowStyle = {
    font: { name: 'Calibri', size: 10 },
    alignment: { vertical: 'middle' },
    border: {
      top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
    }
  };

  // 1. Departments Sheet
  const wsDepts = workbook.addWorksheet('Departments');
  wsDepts.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Department ID', key: 'id', width: 18 },
    { header: 'Department Name', key: 'name', width: 45 },
    { header: 'Code', key: 'code', width: 12 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Description', key: 'desc', width: 40 }
  ];
  wsDepts.getRow(1).height = 24;
  wsDepts.getRow(1).eachCell(c => c.style = headerStyle);
  departments.forEach((d, idx) => {
    const row = wsDepts.addRow({
      sno: idx + 1,
      id: d.id,
      name: d.name,
      code: d.code,
      status: d.status,
      desc: d.description || d.name
    });
    row.height = 20;
    row.eachCell(c => c.style = rowStyle);
  });

  // 2. Sections Sheet
  const wsSecs = workbook.addWorksheet('Sections');
  wsSecs.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Section ID', key: 'id', width: 18 },
    { header: 'Department ID', key: 'dept_id', width: 18 },
    { header: 'Section Name', key: 'name', width: 20 },
    { header: 'Section Code', key: 'code', width: 16 },
    { header: 'Status', key: 'status', width: 12 }
  ];
  wsSecs.getRow(1).height = 24;
  wsSecs.getRow(1).eachCell(c => c.style = headerStyle);
  sections.forEach((s, idx) => {
    const row = wsSecs.addRow({
      sno: idx + 1,
      id: s.id,
      dept_id: s.department_id,
      name: s.section_name,
      code: s.section_code,
      status: s.status
    });
    row.height = 20;
    row.eachCell(c => c.style = rowStyle);
  });

  // 3. Batches Sheet
  const wsBatches = workbook.addWorksheet('Batches');
  wsBatches.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Batch ID', key: 'id', width: 22 },
    { header: 'Batch Name', key: 'name', width: 18 },
    { header: 'Department', key: 'dept', width: 45 },
    { header: 'College Name', key: 'college', width: 60 },
    { header: 'Status', key: 'status', width: 12 }
  ];
  wsBatches.getRow(1).height = 24;
  wsBatches.getRow(1).eachCell(c => c.style = headerStyle);
  batches.forEach((b, idx) => {
    const row = wsBatches.addRow({
      sno: idx + 1,
      id: b.id,
      name: b.batch_name,
      dept: b.department,
      college: b.college,
      status: b.is_active ? 'ACTIVE' : 'INACTIVE'
    });
    row.height = 20;
    row.eachCell(c => c.style = rowStyle);
  });

  // 4. Semesters Sheet
  const wsSems = workbook.addWorksheet('Semesters');
  wsSems.columns = [
    { header: 'Semester Number', key: 'sem_num', width: 18 },
    { header: 'Semester ID', key: 'id', width: 16 },
    { header: 'Exam Month', key: 'month', width: 16 },
    { header: 'Exam Year', key: 'year', width: 14 },
    { header: 'Color Code', key: 'color', width: 16 },
    { header: 'Total Credits', key: 'credits', width: 16 }
  ];
  wsSems.getRow(1).height = 24;
  wsSems.getRow(1).eachCell(c => c.style = headerStyle);
  semesters.forEach(sem => {
    const credits = SEMESTER_META[sem.semester_number]?.credits || 24;
    const row = wsSems.addRow({
      sem_num: `Semester ${sem.semester_number}`,
      id: sem.id,
      month: sem.exam_month,
      year: sem.exam_year,
      color: sem.color,
      credits
    });
    row.height = 20;
    row.eachCell(c => c.style = rowStyle);
  });

  // 5. Subjects Master Sheet
  const wsSubs = workbook.addWorksheet('Subjects Master');
  wsSubs.columns = [
    { header: 'S.No', key: 'sno', width: 8 },
    { header: 'Subject Code', key: 'code', width: 16 },
    { header: 'Subject Name', key: 'name', width: 45 },
    { header: 'Semester', key: 'sem', width: 12 },
    { header: 'Credits', key: 'credits', width: 10 },
    { header: 'Department', key: 'dept', width: 22 },
    { header: 'Type', key: 'type', width: 14 },
    { header: 'Status', key: 'status', width: 12 }
  ];
  wsSubs.getRow(1).height = 24;
  wsSubs.getRow(1).eachCell(c => c.style = headerStyle);
  subjects.forEach((sub, idx) => {
    const row = wsSubs.addRow({
      sno: idx + 1,
      code: sub.subject_code,
      name: sub.subject_name,
      sem: `Sem ${sub.semester_number}`,
      credits: sub.credits,
      dept: sub.department_id || 'dept_cse',
      type: sub.subject_type || 'Theory',
      status: sub.status || 'ACTIVE'
    });
    row.height = 20;
    row.eachCell(c => c.style = rowStyle);
  });

  // 6. Academic Configuration / Grade Scale Sheet
  const wsScale = workbook.addWorksheet('Academic Configuration');
  wsScale.columns = [
    { header: 'Grade Letter', key: 'grade', width: 14 },
    { header: 'Grade Point', key: 'point', width: 14 },
    { header: 'Result Status', key: 'status', width: 18 },
    { header: 'Passing', key: 'passing', width: 14 }
  ];
  wsScale.getRow(1).height = 24;
  wsScale.getRow(1).eachCell(c => c.style = headerStyle);
  gradeScale.forEach(gs => {
    const row = wsScale.addRow({
      grade: gs.letter_grade,
      point: gs.grade_point,
      status: gs.status_type,
      passing: gs.is_passing ? 'YES' : 'NO'
    });
    row.height = 20;
    row.eachCell(c => c.style = rowStyle);
  });

  const filename = 'Academic_Common_Data.xlsx';
  const outPath = path.join(__dirname, `../../${filename}`);
  const buffer = await workbook.xlsx.writeBuffer();
  fs.writeFileSync(outPath, buffer);

  return { workbook, filename, buffer };
}

/**
 * Generate structured Excel Preview JSON from Section Excel Workbook
 */
export async function getCollegeExcelPreviewData(options = {}) {
  const result = await generateCollegeExcelWorkbook(options);
  const workbook = result.workbook;
  const sheetsData = [];

  for (const worksheet of workbook.worksheets) {
    const maxRow = Math.min(worksheet.rowCount, 100);
    const maxCol = Math.min(worksheet.columnCount, 178);

    const rows = [];
    const colLetters = [];
    for (let c = 1; c <= maxCol; c++) {
      colLetters.push(worksheet.getColumn(c).letter);
    }

    for (let r = 1; r <= maxRow; r++) {
      const rowCells = [];
      const rowObj = worksheet.getRow(r);

      for (let c = 1; c <= maxCol; c++) {
        const cell = rowObj.getCell(c);
        let val = '';
        let formula = '';

        if (cell.value !== null && cell.value !== undefined) {
          if (typeof cell.value === 'object' && cell.value.formula) {
            formula = '=' + cell.value.formula;
            if (cell.value.result !== undefined && cell.value.result !== null) {
              val = String(cell.value.result);
            } else {
              val = formula;
            }
          } else {
            val = String(cell.value);
          }
        }

        let color = null;
        if (cell.fill && cell.fill.fgColor && cell.fill.fgColor.argb) {
          color = '#' + cell.fill.fgColor.argb.substring(2);
        }

        rowCells.push({
          row: r,
          col: c,
          value: val,
          formula,
          color,
          isHeader: r <= 6
        });
      }

      if (r <= 6 + result.studentCount || rowCells.some(cell => cell.value !== '')) {
        rows.push({ rowNumber: r, cells: rowCells });
      }
    }

    sheetsData.push({ name: worksheet.name, colLetters, rows });
  }

  return { 
    filename: result.filename, 
    studentCount: result.studentCount,
    section: result.section,
    department: result.department,
    sheets: sheetsData 
  };
}

/**
 * Generate structured Excel Preview JSON from Common Excel Workbook
 */
export async function getCommonExcelPreviewData() {
  const result = await generateCommonExcelWorkbook();
  const workbook = result.workbook;
  const sheetsData = [];

  for (const worksheet of workbook.worksheets) {
    const maxRow = worksheet.rowCount;
    const maxCol = worksheet.columnCount;

    const rows = [];
    const colLetters = [];
    for (let c = 1; c <= maxCol; c++) {
      colLetters.push(worksheet.getColumn(c).letter);
    }

    for (let r = 1; r <= maxRow; r++) {
      const rowCells = [];
      const rowObj = worksheet.getRow(r);

      for (let c = 1; c <= maxCol; c++) {
        const cell = rowObj.getCell(c);
        let val = cell.value !== null && cell.value !== undefined ? String(cell.value) : '';
        let color = null;
        if (cell.fill && cell.fill.fgColor && cell.fill.fgColor.argb) {
          color = '#' + cell.fill.fgColor.argb.substring(2);
        }

        rowCells.push({
          row: r,
          col: c,
          value: val,
          formula: '',
          color,
          isHeader: r === 1
        });
      }
      rows.push({ rowNumber: r, cells: rowCells });
    }

    sheetsData.push({ name: worksheet.name, colLetters, rows });
  }

  return { filename: result.filename, sheets: sheetsData };
}
