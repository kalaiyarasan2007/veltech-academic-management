export interface AdminUser {
  id: string;
  email: string;
  username: string;
  name: string;
  role: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at?: string;
}

export interface Section {
  id: string;
  department_id: string;
  section_name: string;
  section_code: string;
  status: 'ACTIVE' | 'INACTIVE';
  department_name?: string;
  department_code?: string;
  student_count?: number;
  created_at?: string;
}

export interface Student {
  id: string;
  register_number: string;
  roll_number: string;
  name: string;
  batch: string;
  department: string;
  department_id?: string;
  department_name?: string;
  section?: string;
  section_id?: string;
  section_name?: string;
  section_code?: string;
  academic_year?: string;
  status?: 'ACTIVE' | 'INACTIVE';
  sno?: string;
  created_at?: string;
}

export interface Subject {
  id: string;
  semester_number: number;
  subject_code: string;
  subject_name: string;
  credits: number;
  display_order?: number;
  department_id?: string;
  department_name?: string;
  batch?: string;
  curriculum_id?: string;
  subject_type?: 'Theory' | 'Laboratory' | 'Project' | 'Elective';
  status?: 'ACTIVE' | 'INACTIVE';
  is_assigned?: boolean;
}

export interface Semester {
  id: string;
  semester_number: number;
  exam_month: string;
  exam_year: string;
  color: string;
}

export interface GradeAttempt {
  id: string;
  department_id?: string;
  section_id?: string;
  student_id: string;
  register_number: string;
  semester_id?: string;
  semester_number: number;
  subject_id?: string;
  subject_code: string;
  subject_name: string;
  credits: number;
  grade: string;
  grade_point: number;
  attempt_type: 'REGULAR' | 'ARREAR_CLEARANCE';
  exam_month: string;
  exam_year: string;
}

export interface Arrear {
  id: string;
  department_id?: string;
  section_id?: string;
  student_id: string;
  register_number: string;
  roll_number?: string;
  student_name?: string;
  semester_id?: string;
  subject_id?: string;
  subject_code: string;
  subject_name: string;
  original_semester: number;
  original_grade: string;
  original_month: string;
  original_year: string;
  cleared_semester?: number | null;
  cleared_grade?: string | null;
  cleared_month?: string | null;
  cleared_year?: string | null;
  status: 'PENDING' | 'CLEARED';
}

export interface SemesterHistorySubject {
  subject_code: string;
  subject_name: string;
  credits: number;
  grade: string;
  grade_point: number;
  is_arrear: boolean;
  arrear_status?: 'PENDING' | 'CLEARED' | null;
  cleared_semester?: number | null;
  color: string;
}

export interface SemesterHistory {
  semester_number: number;
  color: string;
  total_credits: number;
  total_grade: number;
  gpa: number;
  cgpa: number;
  pending_arrears: number;
  cleared_arrears: number;
  subjects: SemesterHistorySubject[];
}

export interface DashboardStats {
  total_departments?: number;
  total_sections?: number;
  total_students: number;
  total_subjects?: number;
  total_semesters?: number;
  pending_arrears?: number;
  cleared_arrears?: number;
  students_with_pending_arrears: number;
  students_with_cleared_arrears: number;
  students_without_arrears: number;
  average_cgpa: number;
  semester_stats: Array<{
    semester_number: number;
    total_students: number;
    pending_arrears: number;
    cleared_arrears: number;
    total_arrears: number;
    pass_rate: number;
  }>;
}
