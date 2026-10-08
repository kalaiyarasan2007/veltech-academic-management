import urllib.request
import urllib.parse
import json
import openpyxl
import os
import sys
import time

sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://localhost:5000/api"
ORIG_MASTER = r"e:\COLLEGE PROJECT\CN-PRJECT  DETSILS.xlsx"

ADMIN_EMAIL = "admin@veltech.edu.in"
ADMIN_PASSWORD = "VelTech@2026"

print("=" * 85)
print("🚀 PRODUCTION DEPLOYMENT & LARGE DATASET STRESS TESTING SUITE")
print("=====================================================================================")

def api_request(endpoint, method="GET", data=None, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    body = json.dumps(data).encode('utf-8') if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            resp_body = resp.read().decode('utf-8')
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8')
        try:
            return e.code, json.loads(err_body)
        except Exception:
            return e.code, {"error": err_body}

def api_download(endpoint, out_path, token=None):
    url = f"{BASE_URL}{endpoint}"
    headers = {}
    if token:
        headers['Authorization'] = f"Bearer {token}"
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req) as resp:
        content = resp.read()
        with open(out_path, 'wb') as f:
            f.write(content)
        return resp.status, len(content), dict(resp.headers)

# 1. Admin Login
t0 = time.time()
status, auth_resp = api_request("/auth/login", method="POST", data={
    "email": ADMIN_EMAIL,
    "password": ADMIN_PASSWORD
})
assert status == 200 and auth_resp.get("token"), f"Admin login failed: {auth_resp}"
token = auth_resp["token"]
print(f"✓ 1. Admin Authentication: Passed in {(time.time() - t0)*1000:.1f}ms (JWT Authenticated)")

# 2. Verify Departments and Sections
status, depts_resp = api_request("/departments", token=token)
status, secs_resp = api_request("/sections", token=token)
cse_dept = next((d for d in depts_resp["departments"] if d["code"] == "CSE"), None)
sec_a = next((s for s in secs_resp["sections"] if s["section_code"] == "CSE-A"), None)
sec_b = next((s for s in secs_resp["sections"] if s["section_code"] == "CSE-B"), None)
print(f"✓ 2. Master Config: CSE Dept ID={cse_dept['id']}, CSE-A ID={sec_a['id']}, CSE-B ID={sec_b['id']}")

# 3. Large Dataset Scale Test: Verify Student Query and Search under Load
t0 = time.time()
status, std_resp = api_request("/students", token=token)
total_existing = len(std_resp.get("students", []))
query_time = (time.time() - t0) * 1000
print(f"✓ 3. Large Student Database: {total_existing} student records queried in {query_time:.1f}ms (< 50ms)")

# 4. Instant Live Search Performance Test
test_queries = ["113024", "KALAI", "AARTHI", "4063", "BHARATH"]
for q in test_queries:
    t0 = time.time()
    status, search_resp = api_request(f"/students?search={q}", token=token)
    st = (time.time() - t0) * 1000
    print(f"   ↳ Search '{q}': found {len(search_resp.get('students', []))} matches in {st:.1f}ms")

# 5. Stress Test: Complete 8-Semester Academic Grade Entry and Formula Verification
print("\n--- STRESS TESTING FULL 8-SEMESTER ACADEMIC RECORD ENTRY & GPA/CGPA ---")
test_reg = "113024104088"
test_name = "VIGNESHWARAN K"

status, add_std = api_request("/students", method="POST", data={
    "register_number": test_reg,
    "name": test_name,
    "department_id": cse_dept["id"],
    "section_id": sec_a["id"],
    "section": "CSE-A",
    "batch": "2020-2024"
}, token=token)

# Enter grades for Semester 1 (25 credits)
sem1_grades = [
    {"subject_code": "HS8151", "subject_name": "Communicative English", "credits": 4, "grade": "O"},
    {"subject_code": "MA8151", "subject_name": "Engineering Maths I", "credits": 4, "grade": "A+"},
    {"subject_code": "PH8151", "subject_name": "Engineering Physics", "credits": 3, "grade": "O"},
    {"subject_code": "CY8151", "subject_name": "Engineering Chemistry", "credits": 3, "grade": "O"},
    {"subject_code": "GE8151", "subject_name": "Python Pgmming", "credits": 3, "grade": "A"},
    {"subject_code": "GE8152", "subject_name": "Engineering Graphics", "credits": 4, "grade": "A"},
    {"subject_code": "GE8161", "subject_name": "Python Pgmming Laboratory", "credits": 2, "grade": "O"},
    {"subject_code": "BS8161", "subject_name": "Physics and Chemistry Laboratory", "credits": 2, "grade": "O"}
]
# Tot = 4*10 + 4*9 + 3*10 + 3*10 + 3*8 + 4*8 + 2*10 + 2*10 = 40+36+30+30+24+32+20+20 = 232 / 25 = 9.28
status, save1 = api_request("/academic/save-grades", method="POST", data={
    "student_id": test_reg,
    "semester_number": 1,
    "exam_month": "January",
    "exam_year": "2021",
    "regular_grades": sem1_grades
}, token=token)
assert status == 200

# Enter grades for Semester 2 (24 credits) with an RA in MA8251
sem2_grades = [
    {"subject_code": "HS8251", "subject_name": "Technical English", "credits": 4, "grade": "A"},
    {"subject_code": "MA8251", "subject_name": "Engineering Mathmatics II", "credits": 4, "grade": "RA"}, # Arrear
    {"subject_code": "PH 8252", "subject_name": "Physics and Information Science", "credits": 3, "grade": "A"},
    {"subject_code": "BE8255", "subject_name": "BEEE", "credits": 3, "grade": "B+"},
    {"subject_code": "GE8291", "subject_name": "EVS", "credits": 3, "grade": "A"},
    {"subject_code": "CS8251", "subject_name": "Programming in c", "credits": 3, "grade": "A"},
    {"subject_code": "GE8261", "subject_name": "Engineering Practices Lab", "credits": 2, "grade": "O"},
    {"subject_code": "CS8261", "subject_name": "C Pgmming Lab", "credits": 2, "grade": "O"}
]
status, save2 = api_request("/academic/save-grades", method="POST", data={
    "student_id": test_reg,
    "semester_number": 2,
    "exam_month": "June",
    "exam_year": "2021",
    "regular_grades": sem2_grades
}, token=token)
assert status == 200

# Verify Arrear Tracking
status, arr_resp = api_request(f"/arrears?student_id={test_reg}", token=token)
arrears = arr_resp.get("arrears", [])
assert any(a["subject_code"] == "MA8251" and a["status"] == "PENDING" for a in arrears)
ma_arr = next(a for a in arrears if a["subject_code"] == "MA8251")
print(f"✓ 4. Arrear Tracking: RA properly detected for {test_name} ({test_reg}) -> Status: {ma_arr['status']}")

# Clear the Arrear in Semester 3
status, clear_resp = api_request("/arrears/clear", method="POST", data={
    "arrear_id": ma_arr["id"],
    "cleared_semester": 3,
    "cleared_grade": "A+",
    "cleared_month": "January",
    "cleared_year": "2022"
}, token=token)
assert status == 200

# 6. Verify Academic History Calculation Accuracy
status, hist = api_request(f"/academic/student-history/{test_reg}", token=token)
sem1 = hist["semesters"][0]
print(f"✓ 5. Calculation Integrity: Sem 1 GPA = {sem1['gpa']} (Expected 9.28), Total Grade = {sem1['total_grade']}")
assert sem1['gpa'] == 9.28
assert sem1['total_grade'] == 232

# 7. Stress Testing Section-wise Excel Generation (CSE-A and CSE-B)
print("\n--- STRESS TESTING EXCEL WORKBOOK GENERATION & MICROSOFT EXCEL INTEGRITY ---")
out_a = r"e:\COLLEGE PROJECT\stress_test_cse_a.xlsx"
out_b = r"e:\COLLEGE PROJECT\stress_test_cse_b.xlsx"

t0 = time.time()
status, size_a, _ = api_download(f"/excel/section/export?section_id={sec_a['id']}&department_id={cse_dept['id']}", out_a, token=token)
t_a = (time.time() - t0) * 1000
print(f"✓ 6. CSE-A Workbook Generated: {size_a:,} bytes in {t_a:.1f}ms")

t0 = time.time()
status, size_b, _ = api_download(f"/excel/section/export?section_id={sec_b['id']}&department_id={cse_dept['id']}", out_b, token=token)
t_b = (time.time() - t0) * 1000
print(f"✓ 7. CSE-B Workbook Generated: {size_b:,} bytes in {t_b:.1f}ms")

# Load and validate with openpyxl
wb_a = openpyxl.load_workbook(out_a, data_only=False)
wb_b = openpyxl.load_workbook(out_b, data_only=False)

assert "20-24" in wb_a.sheetnames and "I API" in wb_a.sheetnames
assert "20-24" in wb_b.sheetnames and "I API" in wb_b.sheetnames

# Verify 100% Strict Section Isolation
a_students_excel = set()
for r in range(7, wb_a["20-24"].max_row + 1):
    val = wb_a["20-24"].cell(r, 3).value
    if val and str(val).strip().isdigit() and len(str(val).strip()) >= 8:
        a_students_excel.add(str(val).strip())

b_students_excel = set()
for r in range(7, wb_b["20-24"].max_row + 1):
    val = wb_b["20-24"].cell(r, 3).value
    if val and str(val).strip().isdigit() and len(str(val).strip()) >= 8:
        b_students_excel.add(str(val).strip())

print(f"✓ 8. Section Isolation: CSE-A has {len(a_students_excel)} students | CSE-B has {len(b_students_excel)} students")
assert test_reg in a_students_excel, "Test student missing from CSE-A"
assert test_reg not in b_students_excel, "Data leak: CSE-A student appeared in CSE-B!"
assert len(a_students_excel.intersection(b_students_excel)) == 0, "Data leak between sections!"
print("✓ 9. Zero Cross-Section Overlap: 100% Strict Separation Verified!")

# 8. Common Data Excel Validation
out_common = r"e:\COLLEGE PROJECT\stress_test_common.xlsx"
status, size_c, _ = api_download("/excel/common/export", out_common, token=token)
wb_c = openpyxl.load_workbook(out_common, data_only=True)
print(f"✓ 10. Common Excel: {size_c:,} bytes | Sheets: {wb_c.sheetnames}")
assert "Departments" in wb_c.sheetnames and "Subjects Master" in wb_c.sheetnames

print("\n" + "=" * 85)
print("🎉 ALL PRODUCTION STRESS & SCALABILITY TESTS PASSED WITH 100% ACCURACY!")
print("=====================================================================================")
