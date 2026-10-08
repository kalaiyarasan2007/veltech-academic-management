import json

with open('server/data/database.json') as f:
    data = json.load(f)

atts = [a for a in data['grade_attempts'] if a['student_id'] == 'std_113020104001' and a['semester_number'] == 3]
print("DB Attempts for std_113020104001 Sem 3:")
for a in atts:
    print(f"  Subj: '{a['subject_code']}' | Grade: '{a['grade']}' | GP: {a['grade_point']}")
