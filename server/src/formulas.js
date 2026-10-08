// Academic formulas and GPA / CGPA calculation logic

export const GRADE_POINT_MAP = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'RA': 0,
  'WH': 0,
  'AB': 0,
  'WD': 0
};

export const SEMESTER_CREDITS = {
  1: 25,
  2: 24,
  3: 24,
  4: 24,
  5: 25,
  6: 25,
  7: 22,
  8: 16
};

export const SEMESTER_COLORS = {
  1: '#92D050', // Light Green
  2: '#B3CEFA', // Soft Blue
  3: '#FFA766', // Soft Orange
  4: '#00B0F0', // Sky Blue
  5: '#FFFF00', // Yellow
  6: '#F28E85', // Soft Coral
  7: '#CC9900', // Gold
  8: '#94A3B8'  // Slate Grey
};

export const CUMULATIVE_CREDITS = {
  1: 25,
  2: 49,
  3: 73,
  4: 97,
  5: 122,
  6: 147,
  7: 169,
  8: 185
};

/**
 * Calculate total semester grade (Sum of Credit * GradePoint)
 * @param {Array<{ credits: number, grade: string }>} attempts 
 */
export function calculateSemesterTotalGrade(attempts) {
  let totalGrade = 0;
  for (const item of attempts) {
    const gp = GRADE_POINT_MAP[item.grade] ?? 0;
    totalGrade += (item.credits * gp);
  }
  return totalGrade;
}

/**
 * Calculate GPA for a given semester
 * GPA = Total Semester Grade / Total Semester Credits
 */
export function calculateGPA(totalGrade, semesterNumber) {
  const credits = SEMESTER_CREDITS[semesterNumber] || 1;
  if (!totalGrade || totalGrade === 0) return 0;
  return Number((totalGrade / credits).toFixed(2));
}

/**
 * Calculate CGPA through a target semester
 * CGPA = Sum(Semester Total Grade 1..k) / Sum(Semester Credits 1..k)
 */
export function calculateCGPA(semesterTotalGradesMap, targetSemester) {
  let cumGrade = 0;
  let cumCredits = 0;
  
  for (let sem = 1; sem <= targetSemester; sem++) {
    const semTotal = semesterTotalGradesMap[sem] || 0;
    const semCredits = SEMESTER_CREDITS[sem] || 0;
    cumGrade += semTotal;
    cumCredits += semCredits;
  }
  
  if (cumCredits === 0 || cumGrade === 0) return 0;
  return Number((cumGrade / cumCredits).toFixed(2));
}

/**
 * Determine arrear status from grade
 */
export function isArrearGrade(grade) {
  return ['RA', 'WH', 'AB', 'WD'].includes(grade);
}
