import urllib.request
import json
import openpyxl
import io

BASE_URL = 'http://localhost:5000/api'

# 1. Fetch Student Entry View for Student 113020104001, Semester 3
print("=== TEST 1: Fetching Student Entry View for 113020104001 (Semester 3) ===")
req = urllib.request.Request(f"{BASE_URL}/academic/entry-view?register_number=113020104001&semester_number=3")
with urllib.request.urlopen(req) as resp:
    data = json.loads(resp.read().decode())
    print("Student Name:", data['student']['name'])
    print("Student ID:", data['student']['id'])
    print("Regular Subjects count:", len(data['regular_subjects']))

# 2. Save a grade update for CS8391 (Data Structure) in Semester 3 as 'A+'
print("\n=== TEST 2: Saving grade update for CS8391 in Semester 3 ===")
save_payload = {
    "student_id": data['student']['id'],
    "semester_number": 3,
    "exam_month": "January",
    "exam_year": "2022",
    "regular_grades": [
        {
            "subject_code": "CS8391",
            "subject_name": "Data Structure",
            "credits": 3,
            "grade": "A+",
            "grade_point": 9
        }
    ]
}

req_save = urllib.request.Request(
    f"{BASE_URL}/academic/save-grades",
    data=json.dumps(save_payload).encode(),
    headers={'Content-Type': 'application/json'},
    method='POST'
)
with urllib.request.urlopen(req_save) as resp:
    print("Save Response:", resp.read().decode())

# 3. Download Excel and verify updated grade for CS8391 in openpyxl!
print("\n=== TEST 3: Downloading Updated Master Excel & Verifying CS8391 Grade ===")
req_export = urllib.request.Request(f"{BASE_URL}/excel/export")
with urllib.request.urlopen(req_export) as resp:
    excel_bytes = resp.read()
    print("Exported Excel Size:", len(excel_bytes), "bytes")

wb = openpyxl.load_workbook(io.BytesIO(excel_bytes), data_only=True)
ws = wb['20-24']

# CS8391 grade column in 20-24 is Column 51 (AY)
cs8391_grade = ws.cell(7, 51).value
print(f"Row 7 (113020104001) CS8391 Grade in Exported Master Excel: '{cs8391_grade}'")
assert str(cs8391_grade) == 'A+', f"Expected A+, got {cs8391_grade}"

print("\nSUCCESS: Master template correctly updated and verified with openpyxl!")
