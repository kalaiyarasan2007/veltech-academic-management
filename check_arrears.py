import sys
sys.stdout.reconfigure(encoding='utf-8')
import json

DB_FILE = r'e:\COLLEGE PROJECT\server\data\database.json'
with open(DB_FILE, encoding='utf-8') as f:
    db = json.load(f)

students = db['students']
arrears = db['arrears']

print('Arrears from Sem 4:')
for a in arrears:
    if a['original_semester'] == 4:
        s = next((st for st in students if st['id'] == a['student_id']), None)
        if s:
            print(f'  {s["register_number"]} {s["name"]} | sub={a["subject_code"]} | cleared_sem={a["cleared_semester"]} | cleared_grade={a["cleared_grade"]}')

print('\nArrears from Sem 6:')
for a in arrears:
    if a['original_semester'] == 6:
        s = next((st for st in students if st['id'] == a['student_id']), None)
        if s:
            print(f'  {s["register_number"]} {s["name"]} | sub={a["subject_code"]} | cleared_sem={a["cleared_semester"]} | cleared_grade={a["cleared_grade"]}')
