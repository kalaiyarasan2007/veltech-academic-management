import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, '../data/database.json');
const raw = fs.readFileSync(DB_FILE, 'utf-8');
const db = JSON.parse(raw);

console.log('Original student count:', db.students?.length);
console.log('Original grade attempts count:', db.grade_attempts?.length);
console.log('Original arrears count:', db.arrears?.length);

// 1. admin_users
const adminHash = bcrypt.hashSync('VelTech@2026', 10);
db.admin_users = [
  {
    id: 'usr_admin',
    email: 'admin@veltech.edu.in',
    username: 'admin',
    password_hash: adminHash,
    name: 'Administrator',
    role: 'ADMIN',
    created_at: new Date().toISOString()
  }
];
// Keep users table in sync for backward compatibility
db.users = db.admin_users;

// 2. departments
if (!db.departments || db.departments.length === 0) {
  db.departments = [
    {
      id: 'dept_cse',
      name: 'Department of Computer Science and Engineering',
      code: 'CSE',
      description: 'Computer Science and Engineering',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    },
    {
      id: 'dept_ece',
      name: 'Department of Electronics and Communication Engineering',
      code: 'ECE',
      description: 'Electronics and Communication Engineering',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    },
    {
      id: 'dept_it',
      name: 'Department of Information Technology',
      code: 'IT',
      description: 'Information Technology',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    }
  ];
}

// 3. sections
if (!db.sections || db.sections.length === 0) {
  db.sections = [
    {
      id: 'sec_cse_a',
      department_id: 'dept_cse',
      section_name: 'CSE-A',
      section_code: 'CSE-A',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    },
    {
      id: 'sec_cse_b',
      department_id: 'dept_cse',
      section_name: 'CSE-B',
      section_code: 'CSE-B',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    },
    {
      id: 'sec_cse_c',
      department_id: 'dept_cse',
      section_name: 'CSE-C',
      section_code: 'CSE-C',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    },
    {
      id: 'sec_ece_a',
      department_id: 'dept_ece',
      section_name: 'ECE-A',
      section_code: 'ECE-A',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    },
    {
      id: 'sec_it_a',
      department_id: 'dept_it',
      section_name: 'IT-A',
      section_code: 'IT-A',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    }
  ];
}

// 4. curricula
if (!db.curricula || db.curricula.length === 0) {
  db.curricula = [
    {
      id: 'curr_cse_2020_2024',
      curriculum_name: 'CSE Curriculum 2020-2024',
      department_id: 'dept_cse',
      batch: '2020-2024',
      status: 'ACTIVE',
      created_at: new Date().toISOString()
    }
  ];
}

// 5. Update existing students
const studentMap = {};
db.students = (db.students || []).map((std, idx) => {
  const isCseA = idx < 60; // First 60 students in CSE-A, remaining in CSE-B
  const section_id = std.section_id || (isCseA ? 'sec_cse_a' : 'sec_cse_b');
  const section = std.section || (isCseA ? 'CSE-A' : 'CSE-B');
  const department_id = std.department_id || 'dept_cse';
  const status = std.status || 'ACTIVE';
  const academic_year = std.academic_year || '2020-2024';

  const updatedStd = {
    ...std,
    department_id,
    section_id,
    section,
    academic_year,
    status
  };
  studentMap[std.id] = updatedStd;
  studentMap[std.register_number] = updatedStd;
  return updatedStd;
});

// 6. Update subjects with required metadata
db.subjects = (db.subjects || []).map(sub => {
  const isLab = /lab|laboratory/i.test(sub.subject_name);
  const isProj = /project/i.test(sub.subject_name);
  const subject_type = sub.subject_type || (isProj ? 'Project' : isLab ? 'Laboratory' : 'Theory');
  return {
    ...sub,
    department_id: sub.department_id || 'dept_cse',
    curriculum_id: sub.curriculum_id || 'curr_cse_2020_2024',
    batch: sub.batch || '2020-2024',
    subject_type,
    status: sub.status || 'ACTIVE'
  };
});

// 7. section_subjects
if (!db.section_subjects || db.section_subjects.length === 0) {
  const cseSections = ['sec_cse_a', 'sec_cse_b', 'sec_cse_c'];
  db.section_subjects = [];
  for (const secId of cseSections) {
    for (const sub of db.subjects) {
      db.section_subjects.push({
        id: `ss_${secId}_${sub.id}`,
        section_id: secId,
        subject_id: sub.id,
        created_at: new Date().toISOString()
      });
    }
  }
}

// 8. Update grade_attempts with department_id, section_id, semester_id, subject_id
db.grade_attempts = (db.grade_attempts || []).map(att => {
  const std = studentMap[att.student_id] || studentMap[att.register_number];
  const deptId = att.department_id || (std ? std.department_id : 'dept_cse');
  const secId = att.section_id || (std ? std.section_id : 'sec_cse_a');
  const semId = att.semester_id || `sem_${att.semester_number}`;
  const subId = att.subject_id || `sub_${att.subject_code}`;

  return {
    ...att,
    department_id: deptId,
    section_id: secId,
    semester_id: semId,
    subject_id: subId
  };
});

// 9. Update arrears with department_id, section_id, semester_id, subject_id
db.arrears = (db.arrears || []).map(arr => {
  const std = studentMap[arr.student_id] || studentMap[arr.register_number];
  const deptId = arr.department_id || (std ? std.department_id : 'dept_cse');
  const secId = arr.section_id || (std ? std.section_id : 'sec_cse_a');
  const semId = arr.semester_id || `sem_${arr.original_semester}`;
  const subId = arr.subject_id || `sub_${arr.subject_code}`;

  return {
    ...arr,
    department_id: deptId,
    section_id: secId,
    semester_id: semId,
    subject_id: subId
  };
});

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
console.log('Migration completed successfully!');
console.log('CSE-A student count:', db.students.filter(s => s.section === 'CSE-A').length);
console.log('CSE-B student count:', db.students.filter(s => s.section === 'CSE-B').length);
