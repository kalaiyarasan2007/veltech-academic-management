import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial state schema
const defaultData = {
  admin_users: [
    {
      id: 'usr_admin',
      email: 'admin@veltech.edu.in',
      username: 'admin',
      password_hash: '$2b$10$GPHUWCzystHuZXafsdEYG..HGsEtSoZnqd3odEAP3TzMKQedDwfvq', // VelTech@2026
      name: 'Dr. System Administrator',
      role: 'ADMIN'
    }
  ],
  users: [
    {
      id: 'usr_admin',
      email: 'admin@veltech.edu.in',
      username: 'admin',
      password_hash: '$2b$10$GPHUWCzystHuZXafsdEYG..HGsEtSoZnqd3odEAP3TzMKQedDwfvq', 
      name: 'Dr. System Administrator',
      role: 'ADMIN'
    }
  ],
  departments: [
    {
      id: 'dept_cse',
      name: 'Department of Computer Science and Engineering',
      code: 'CSE',
      description: 'Computer Science and Engineering',
      status: 'ACTIVE'
    },
    {
      id: 'dept_ece',
      name: 'Department of Electronics and Communication Engineering',
      code: 'ECE',
      description: 'Electronics and Communication Engineering',
      status: 'ACTIVE'
    },
    {
      id: 'dept_it',
      name: 'Department of Information Technology',
      code: 'IT',
      description: 'Information Technology',
      status: 'ACTIVE'
    }
  ],
  sections: [
    { id: 'sec_cse_a', department_id: 'dept_cse', section_name: 'CSE-A', section_code: 'CSE-A', status: 'ACTIVE' },
    { id: 'sec_cse_b', department_id: 'dept_cse', section_name: 'CSE-B', section_code: 'CSE-B', status: 'ACTIVE' },
    { id: 'sec_cse_c', department_id: 'dept_cse', section_name: 'CSE-C', section_code: 'CSE-C', status: 'ACTIVE' },
    { id: 'sec_ece_a', department_id: 'dept_ece', section_name: 'ECE-A', section_code: 'ECE-A', status: 'ACTIVE' },
    { id: 'sec_it_a', department_id: 'dept_it', section_name: 'IT-A', section_code: 'IT-A', status: 'ACTIVE' }
  ],
  curricula: [
    {
      id: 'curr_cse_2020_2024',
      curriculum_name: 'CSE Curriculum 2020-2024',
      department_id: 'dept_cse',
      batch: '2020-2024',
      status: 'ACTIVE'
    }
  ],
  section_subjects: [],
  batches: [
    {
      id: 'batch_2020_2024',
      batch_name: '2020-2024',
      department: 'Department of Computer Science and Engineering',
      college: 'Vel Tech High Tech Dr.Rangarajan Dr.Sakunthala Engineering College',
      is_active: true
    }
  ],
  semesters: [
    { id: 'sem_1', semester_number: 1, exam_month: 'January', exam_year: '2021', color: '#92D050' },
    { id: 'sem_2', semester_number: 2, exam_month: 'June', exam_year: '2021', color: '#B3CEFA' },
    { id: 'sem_3', semester_number: 3, exam_month: 'January', exam_year: '2022', color: '#FFA766' },
    { id: 'sem_4', semester_number: 4, exam_month: 'June', exam_year: '2022', color: '#00B0F0' },
    { id: 'sem_5', semester_number: 5, exam_month: 'January', exam_year: '2023', color: '#FFFF00' },
    { id: 'sem_6', semester_number: 6, exam_month: 'June', exam_year: '2023', color: '#F28E85' },
    { id: 'sem_7', semester_number: 7, exam_month: 'January', exam_year: '2024', color: '#CC9900' },
    { id: 'sem_8', semester_number: 8, exam_month: 'June', exam_year: '2024', color: '#94A3B8' }
  ],
  subjects: [
    // Sem 1
    { id: 'sub_HS8151', semester_number: 1, subject_code: 'HS8151', subject_name: 'Communicative English', credits: 4, display_order: 1 },
    { id: 'sub_MA8151', semester_number: 1, subject_code: 'MA8151', subject_name: 'Engineering Maths I', credits: 4, display_order: 2 },
    { id: 'sub_PH8151', semester_number: 1, subject_code: 'PH8151', subject_name: 'Engineering Physics', credits: 3, display_order: 3 },
    { id: 'sub_CY8151', semester_number: 1, subject_code: 'CY8151', subject_name: 'Engineering Chemistry', credits: 3, display_order: 4 },
    { id: 'sub_GE8151', semester_number: 1, subject_code: 'GE8151', subject_name: 'Python Pgmming', credits: 3, display_order: 5 },
    { id: 'sub_GE8152', semester_number: 1, subject_code: 'GE8152', subject_name: 'Engineering Graphics', credits: 4, display_order: 6 },
    { id: 'sub_GE8161', semester_number: 1, subject_code: 'GE8161', subject_name: 'Python Pgmming Laboratory', credits: 2, display_order: 7 },
    { id: 'sub_BS8161', semester_number: 1, subject_code: 'BS8161', subject_name: 'Physics and Chemistry Laboratory', credits: 2, display_order: 8 },

    // Sem 2
    { id: 'sub_HS8251', semester_number: 2, subject_code: 'HS8251', subject_name: 'Technical English', credits: 4, display_order: 1 },
    { id: 'sub_MA8251', semester_number: 2, subject_code: 'MA8251', subject_name: 'Engineering Mathmatics II', credits: 4, display_order: 2 },
    { id: 'sub_PH8252', semester_number: 2, subject_code: 'PH 8252', subject_name: 'Physics and Information Science', credits: 3, display_order: 3 },
    { id: 'sub_BE8255', semester_number: 2, subject_code: 'BE8255', subject_name: 'BEEE', credits: 3, display_order: 4 },
    { id: 'sub_GE8291', semester_number: 2, subject_code: 'GE8291', subject_name: 'EVS', credits: 3, display_order: 5 },
    { id: 'sub_CS8251', semester_number: 2, subject_code: 'CS8251', subject_name: 'Programming in c', credits: 3, display_order: 6 },
    { id: 'sub_GE8261', semester_number: 2, subject_code: 'GE8261', subject_name: 'Engineering Practices Lab', credits: 2, display_order: 7 },
    { id: 'sub_CS8261', semester_number: 2, subject_code: 'CS8261', subject_name: 'C Pgmming Lab', credits: 2, display_order: 8 },

    // Sem 3
    { id: 'sub_MA8351', semester_number: 3, subject_code: 'MA8351', subject_name: 'Discrete Mathematics', credits: 4, display_order: 1 },
    { id: 'sub_CS8351', semester_number: 3, subject_code: 'CS8351', subject_name: 'Digital Principles and System Design', credits: 4, display_order: 2 },
    { id: 'sub_CS8391', semester_number: 3, subject_code: 'CS8391', subject_name: 'Data Structure', credits: 3, display_order: 3 },
    { id: 'sub_CS8392', semester_number: 3, subject_code: 'CS8392', subject_name: 'OBJECT ORIENTEDPROGRAMMING', credits: 3, display_order: 4 },
    { id: 'sub_EC8395', semester_number: 3, subject_code: 'EC8395', subject_name: 'COMMUNICATION ENGINEERING', credits: 3, display_order: 5 },
    { id: 'sub_CS8381', semester_number: 3, subject_code: 'CS8381', subject_name: 'DATA STRUCTURES LABORATORY', credits: 2, display_order: 6 },
    { id: 'sub_CS8383', semester_number: 3, subject_code: 'CS8383', subject_name: 'OBJECT ORIENTED PROGRAMMING LABORATORY', credits: 2, display_order: 7 },
    { id: 'sub_CS8382', semester_number: 3, subject_code: 'CS8382', subject_name: 'DIGITAL SYSTEMS LABORATORY', credits: 2, display_order: 8 },
    { id: 'sub_HS8381', semester_number: 3, subject_code: 'HS8381', subject_name: 'INTERPERSONAL SKILLS', credits: 1, display_order: 9 },

    // Sem 4
    { id: 'sub_MA8402', semester_number: 4, subject_code: 'MA8402', subject_name: 'PROBABILITY AND QUEUEING THEORY', credits: 4, display_order: 1 },
    { id: 'sub_CS8491', semester_number: 4, subject_code: 'CS8491', subject_name: 'COMPUTER ARCHITECTURE', credits: 3, display_order: 2 },
    { id: 'sub_CS8492', semester_number: 4, subject_code: 'CS8492', subject_name: 'DATABASE MANAGEMENT SYSTEMS', credits: 3, display_order: 3 },
    { id: 'sub_CS8451', semester_number: 4, subject_code: 'CS8451', subject_name: 'DESIGN AND ANALYSIS OF ALGORITHMS', credits: 3, display_order: 4 },
    { id: 'sub_CS8493', semester_number: 4, subject_code: 'CS8493', subject_name: 'OPERATING SYSTEMS', credits: 3, display_order: 5 },
    { id: 'sub_CS8494', semester_number: 4, subject_code: 'CS8494', subject_name: 'SOFTWARE ENGINEERING', credits: 3, display_order: 6 },
    { id: 'sub_CS8481', semester_number: 4, subject_code: 'CS8481', subject_name: 'DATABASE MANAGEMENT SYSTEMS LABORATORY', credits: 2, display_order: 7 },
    { id: 'sub_CS8461', semester_number: 4, subject_code: 'CS8461', subject_name: 'OPERATING SYSTEMS LABORATORY', credits: 2, display_order: 8 },
    { id: 'sub_HS8461', semester_number: 4, subject_code: 'HS8461', subject_name: 'ADVANCED READING AND WRITING', credits: 1, display_order: 9 },

    // Sem 5
    { id: 'sub_MA8551', semester_number: 5, subject_code: 'MA8551', subject_name: 'ALGEBRA AND NUMBER THEORY', credits: 4, display_order: 1 },
    { id: 'sub_CS8591', semester_number: 5, subject_code: 'CS8591', subject_name: 'COMPUTER NETWORK', credits: 3, display_order: 2 },
    { id: 'sub_EC8691', semester_number: 5, subject_code: 'EC8691', subject_name: 'MICROPROCESSORS AND MICROCONTROLLERS', credits: 3, display_order: 3 },
    { id: 'sub_CS8501', semester_number: 5, subject_code: 'CS8501', subject_name: 'THEORY OF COMPUTATION', credits: 3, display_order: 4 },
    { id: 'sub_CS8592', semester_number: 5, subject_code: 'CS8592', subject_name: 'OBJECT ORIENTED ANALYSIS AND DESIGN', credits: 3, display_order: 5 },
    { id: 'sub_OMF551', semester_number: 5, subject_code: 'OMF551', subject_name: 'PRODUCT DESIGN AND DEVELOPMENT', credits: 3, display_order: 6 },
    { id: 'sub_EC8681', semester_number: 5, subject_code: 'EC8681', subject_name: 'MICROPROCESSORS AND MICROCONTROLLERS LABORATORY', credits: 2, display_order: 7 },
    { id: 'sub_CS8582', semester_number: 5, subject_code: 'CS8582', subject_name: 'OBJECT ORIENTED ANALYSIS AND DESIGN LABORATORY', credits: 2, display_order: 8 },
    { id: 'sub_CS8581', semester_number: 5, subject_code: 'CS8581', subject_name: 'NETWORKS LABORATORY', credits: 2, display_order: 9 },

    // Sem 6
    { id: 'sub_CS8651', semester_number: 6, subject_code: 'CS8651', subject_name: 'INTERNET PROGRAMMING', credits: 3, display_order: 1 },
    { id: 'sub_CS8691', semester_number: 6, subject_code: 'CS8691', subject_name: 'ARTIFICIAL INTELLIGENCE', credits: 3, display_order: 2 },
    { id: 'sub_CS8601', semester_number: 6, subject_code: 'CS8601', subject_name: 'MOBILE COMPUTING', credits: 3, display_order: 3 },
    { id: 'sub_CS8602', semester_number: 6, subject_code: 'CS8602', subject_name: 'COMPILER DESIGN', credits: 4, display_order: 4 },
    { id: 'sub_CS8603', semester_number: 6, subject_code: 'CS8603', subject_name: 'DISTRIBUTED SYSTEMS', credits: 3, display_order: 5 },
    { id: 'sub_IT8076', semester_number: 6, subject_code: 'IT8076', subject_name: 'SOFTWARE TESTING', credits: 3, display_order: 6 },
    { id: 'sub_CS8661', semester_number: 6, subject_code: 'CS8661', subject_name: 'INTERNET PROGRAMMING LABORATORY', credits: 2, display_order: 7 },
    { id: 'sub_CS8662', semester_number: 6, subject_code: 'CS8662', subject_name: 'MOBILE APPLICATION DEVELOPMENT LABORATORY', credits: 2, display_order: 8 },
    { id: 'sub_CS8611', semester_number: 6, subject_code: 'CS8611', subject_name: 'MINI PROJECT', credits: 1, display_order: 9 },
    { id: 'sub_HS8581', semester_number: 6, subject_code: 'HS8581', subject_name: 'PROFESSIONAL COMMUNICATION', credits: 1, display_order: 10 },

    // Sem 7
    { id: 'sub_MG8591', semester_number: 7, subject_code: 'MG8591', subject_name: 'PRINCIPLES OF MANAGEMENT', credits: 3, display_order: 1 },
    { id: 'sub_CS8792', semester_number: 7, subject_code: 'CS8792', subject_name: 'CRYPTOGRAPHY AND NETWORK SECURITY', credits: 3, display_order: 2 },
    { id: 'sub_CS8791', semester_number: 7, subject_code: 'CS8791', subject_name: 'CLOUD COMPUTING', credits: 3, display_order: 3 },
    { id: 'sub_OME753', semester_number: 7, subject_code: 'OME753', subject_name: 'SYSTEMS ENGINEERING', credits: 3, display_order: 4 },
    { id: 'sub_IT8075', semester_number: 7, subject_code: 'IT8075', subject_name: 'SOFTWARE PROJECT MANAGEMENT', credits: 3, display_order: 5 },
    { id: 'sub_CS8079', semester_number: 7, subject_code: 'CS8079', subject_name: 'HUMAN COMPUTER INTERACTION', credits: 3, display_order: 6 },
    { id: 'sub_CS8711', semester_number: 7, subject_code: 'CS8711', subject_name: 'CLOUD COMPUTING LABORATORY', credits: 2, display_order: 7 },
    { id: 'sub_IT8761', semester_number: 7, subject_code: 'IT8761', subject_name: 'SECURITY LABORATORY', credits: 2, display_order: 8 },

    // Sem 8
    { id: 'sub_IT8073', semester_number: 8, subject_code: 'IT8073', subject_name: 'INFORMATION SECURITY', credits: 3, display_order: 1 },
    { id: 'sub_CS8080', semester_number: 8, subject_code: 'CS8080', subject_name: 'INFORMATION RETRIEVAL TECHNIQUES', credits: 3, display_order: 2 },
    { id: 'sub_CS8811', semester_number: 8, subject_code: 'CS8811', subject_name: 'PROJECT WORK', credits: 10, display_order: 3 }
  ],
  grade_scale: [
    { id: 'gs_O', letter_grade: 'O', grade_point: 10, is_passing: true, status_type: 'PASS' },
    { id: 'gs_A_PLUS', letter_grade: 'A+', grade_point: 9, is_passing: true, status_type: 'PASS' },
    { id: 'gs_A', letter_grade: 'A', grade_point: 8, is_passing: true, status_type: 'PASS' },
    { id: 'gs_B_PLUS', letter_grade: 'B+', grade_point: 7, is_passing: true, status_type: 'PASS' },
    { id: 'gs_B', letter_grade: 'B', grade_point: 6, is_passing: true, status_type: 'PASS' },
    { id: 'gs_C', letter_grade: 'C', grade_point: 5, is_passing: true, status_type: 'PASS' },
    { id: 'gs_RA', letter_grade: 'RA', grade_point: 0, is_passing: false, status_type: 'REAPPEAR' },
    { id: 'gs_WH', letter_grade: 'WH', grade_point: 0, is_passing: false, status_type: 'WITHHELD' },
    { id: 'gs_AB', letter_grade: 'AB', grade_point: 0, is_passing: false, status_type: 'ABSENT' },
    { id: 'gs_WD', letter_grade: 'WD', grade_point: 0, is_passing: false, status_type: 'WITHDRAWAL' }
  ],
  students: [],
  grade_attempts: [],
  arrears: []
};

class DB {
  constructor() {
    this.data = defaultData;
    this.init();
  }

  init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = { ...defaultData, ...parsed };
      } catch (e) {
        console.error('Error reading DB_FILE, creating fresh database:', e);
        this.save();
      }
    } else {
      this.save();
    }
  }

  save() {
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  getTable(name) {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } catch (e) {}
    }
    return this.data[name] || [];
  }

  setTable(name, items) {
    this.data[name] = items;
    this.save();
  }
}

export const db = new DB();
