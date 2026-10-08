import openpyxl
import json
import os
import sys

ORIG = r'CN-PRJECT  DETSILS.xlsx'
EXPORT = r'Academic_Records_Updated.xlsx'
DB_PATH = r'server\data\database.json'

print("=" * 80)
print("COMPREHENSIVE FINAL VERIFICATION REPORT")
print("=" * 80)

# Check files exist
assert os.path.exists(ORIG), f"Original file {ORIG} not found"
assert os.path.exists(EXPORT), f"Exported file {EXPORT} not found"
assert os.path.exists(DB_PATH), f"Database file {DB_PATH} not found"

wb_orig = openpyxl.load_workbook(ORIG, data_only=True)
wb_orig_f = openpyxl.load_workbook(ORIG, data_only=False)
wb_exp = openpyxl.load_workbook(EXPORT, data_only=True)
wb_exp_f = openpyxl.load_workbook(EXPORT, data_only=False)

with open(DB_PATH, 'r', encoding='utf-8') as f:
    db = json.load(f)

# -------------------------------------------------------------
# 1. STUDENT COUNT & REGISTER NUMBER COMPARISON
# -------------------------------------------------------------
print("\n" + "=" * 50)
print("1. STUDENT COUNT & REGISTER NUMBER VERIFICATION")
print("=" * 50)

ws_orig_2024 = wb_orig['20-24']
orig_students = {}
for r in range(7, ws_orig_2024.max_row + 1):
    reg = ws_orig_2024.cell(r, 3).value
    name = ws_orig_2024.cell(r, 4).value
    if reg and str(reg).strip().isdigit() and len(str(reg).strip()) >= 8:
        orig_students[str(reg).strip()] = {
            'row': r,
            'name': str(name).strip() if name else '(No Name in Excel)'
        }

db_students = {s['register_number']: s['name'] for s in db['students']}

ws_exp_2024 = wb_exp['20-24']
exp_students = {}
for r in range(7, ws_exp_2024.max_row + 1):
    reg = ws_exp_2024.cell(r, 3).value
    name = ws_exp_2024.cell(r, 4).value
    if reg and str(reg).strip().isdigit() and len(str(reg).strip()) >= 8:
        exp_students[str(reg).strip()] = {
            'row': r,
            'name': str(name).strip() if name else '(No Name in Excel)'
        }

print(f"Original Excel '20-24' student count : {len(orig_students)}")
print(f"Database student count               : {len(db_students)}")
print(f"Exported Excel '20-24' student count : {len(exp_students)}")

# Compare sets
in_orig_not_db = set(orig_students.keys()) - set(db_students.keys())
in_db_not_orig = set(db_students.keys()) - set(orig_students.keys())
in_orig_not_exp = set(orig_students.keys()) - set(exp_students.keys())
in_exp_not_orig = set(exp_students.keys()) - set(orig_students.keys())

print(f"\nMissing from DB (in original Excel but not in DB) : {len(in_orig_not_db)}")
for reg in sorted(in_orig_not_db):
    print(f"  - {reg}: {orig_students[reg]['name']}")

print(f"Extra in DB (in DB but not in original Excel)     : {len(in_db_not_orig)}")
for reg in sorted(in_db_not_orig):
    print(f"  - {reg}: {db_students[reg]}")

print(f"Missing from Export (in orig Excel but not in Exp): {len(in_orig_not_exp)}")
for reg in sorted(in_orig_not_exp):
    print(f"  - {reg}: {orig_students[reg]['name']}")

print(f"Extra in Export (in Exp but not in orig Excel)    : {len(in_exp_not_orig)}")
for reg in sorted(in_exp_not_orig):
    print(f"  - {reg}: {exp_students[reg]['name']}")

# -------------------------------------------------------------
# 2. MASTER EXCEL STRUCTURE COMPARISON (ALL SHEETS)
# -------------------------------------------------------------
print("\n" + "=" * 50)
print("2. MASTER EXCEL STRUCTURE COMPARISON")
print("=" * 50)

print(f"Original sheet names: {wb_orig.sheetnames}")
print(f"Exported sheet names: {wb_exp.sheetnames}")

for sname in wb_orig.sheetnames:
    print(f"\n--- Checking Sheet: '{sname}' ---")
    if sname not in wb_exp.sheetnames:
        print(f"  [ERROR] Sheet '{sname}' MISSING from exported workbook!")
        continue
    
    ws_o = wb_orig[sname]
    ws_e = wb_exp[sname]
    ws_of = wb_orig_f[sname]
    ws_ef = wb_exp_f[sname]
    
    print(f"  Dimensions: Orig=rows {ws_o.max_row}, cols {ws_o.max_column} | Exp=rows {ws_e.max_row}, cols {ws_e.max_column}")
    
    # Merged ranges
    o_merges = set(str(m) for m in ws_of.merged_cells.ranges)
    e_merges = set(str(m) for m in ws_ef.merged_cells.ranges)
    print(f"  Merged ranges count: Orig={len(o_merges)} | Exp={len(e_merges)}")
    if o_merges == e_merges:
        print("  [OK] All merged ranges preserved identically!")
    else:
        diff_missing = o_merges - e_merges
        diff_extra = e_merges - o_merges
        print(f"  [MERGE DIFF] Missing: {len(diff_missing)}, Extra: {len(diff_extra)}")
        if diff_missing:
            print(f"    Sample missing: {list(diff_missing)[:5]}")
        if diff_extra:
            print(f"    Sample extra: {list(diff_extra)[:5]}")

    # Freeze panes
    print(f"  Freeze panes: Orig={ws_of.freeze_panes} | Exp={ws_ef.freeze_panes}")

# -------------------------------------------------------------
# 3. CELL-LEVEL FORMAT & SEMESTER COLOR VERIFICATION
# -------------------------------------------------------------
print("\n" + "=" * 50)
print("3. CELL-LEVEL FORMAT & SEMESTER COLOR VERIFICATION (20-24)")
print("=" * 50)

ws_of_2024 = wb_orig_f['20-24']
ws_ef_2024 = wb_exp_f['20-24']

def get_color(cell):
    fill = cell.fill
    if fill and fill.fgColor:
        if fill.fgColor.type == 'rgb':
            return fill.fgColor.rgb
        elif fill.fgColor.type == 'theme':
            return f"theme:{fill.fgColor.theme}"
    return "None"

# Check header semester colors (row 3 or 4)
# In 20-24 sheet:
# Sem 1: cols 5-20
# Sem 2: cols 25-40
# Sem 3: cols 47-64
# Sem 4: cols 71-88
# Sem 5: cols 95-112
# Sem 6: cols 119-138
# Sem 7: cols 145-160
# Sem 8: cols 167-172
sem_cols = {
    1: 5,
    2: 25,
    3: 47,
    4: 71,
    5: 95,
    6: 119,
    7: 145,
    8: 167
}

print(f"{'Semester':<10} | {'Col':<5} | {'Orig Color (Row 7)':<20} | {'Exp Color (Row 7)':<20} | {'Status'}")
print("-" * 75)
for sem, col in sem_cols.items():
    o_c = get_color(ws_of_2024.cell(7, col))
    e_c = get_color(ws_ef_2024.cell(7, col))
    match = "[OK]" if o_c == e_c else "[MISMATCH]"
    print(f"Sem {sem:<6} | {col:<5} | {o_c:<20} | {e_c:<20} | {match}")

# -------------------------------------------------------------
# 4. SUBJECT COLUMN POSITION VERIFICATION
# -------------------------------------------------------------
print("\n" + "=" * 50)
print("4. SUBJECT COLUMN POSITION VERIFICATION")
print("=" * 50)

# Compare row 4 (Subject Codes) and row 5 (Subject Names/Credits) across all columns
mismatches_code = []
for c in range(1, ws_orig_2024.max_column + 1):
    o_val = ws_orig_2024.cell(4, c).value
    e_val = ws_exp_2024.cell(4, c).value
    o_str = str(o_val).strip() if o_val is not None else ""
    e_str = str(e_val).strip() if e_val is not None else ""
    if o_str != e_str:
        mismatches_code.append((c, o_str, e_str))

print(f"Total row 4 (Subject Code) column mismatches: {len(mismatches_code)}")
if mismatches_code:
    for c, o_s, e_s in mismatches_code[:10]:
        print(f"  Col {c}: Orig='{o_s}' vs Exp='{e_s}'")
else:
    print("  [OK] 100% of subject code columns match exactly!")

# -------------------------------------------------------------
# 5. GRADE / GRADE POINT VERIFICATION
# -------------------------------------------------------------
print("\n" + "=" * 50)
print("5. GRADE & GRADE POINT ARRANGEMENT VERIFICATION")
print("=" * 50)

# For row 7 to row 12 (first 5 students), check Sem 1 cols 5, 6, 7, 8
sample_grades = []
for r in range(7, 12):
    reg = ws_orig_2024.cell(r, 3).value
    # Col 5 is Grade (e.g. A), Col 6 is GP formula/val
    orig_g = ws_orig_2024.cell(r, 5).value
    exp_g = ws_exp_2024.cell(r, 5).value
    orig_gp = wb_orig_f['20-24'].cell(r, 6).value
    exp_gp = wb_exp_f['20-24'].cell(r, 6).value
    print(f"  Row {r} ({reg}): Grade Orig='{orig_g}' Exp='{exp_g}' | GP Orig='{str(orig_gp)[:25]}' Exp='{str(exp_gp)[:25]}'")

# -------------------------------------------------------------
# 6. FORMULA VERIFICATION
# -------------------------------------------------------------
print("\n" + "=" * 50)
print("6. FORMULA VERIFICATION")
print("=" * 50)

ref_errors = []
for r in range(1, min(ws_exp_2024.max_row + 1, 135)):
    for c in range(1, min(ws_exp_2024.max_column + 1, 180)):
        cell_val = wb_exp_f['20-24'].cell(r, c).value
        if cell_val and isinstance(cell_val, str) and '#REF!' in cell_val:
            ref_errors.append((r, c, cell_val))

print(f"#REF! formula errors in exported workbook: {len(ref_errors)}")
if ref_errors:
    for err in ref_errors[:5]:
        print(f"  [ERROR] Row {err[0]}, Col {err[1]}: {err[2]}")
else:
    print("  [OK] Zero #REF! errors found.")

# Compare sample formulas (Total Grade, GPA, CGPA) in Sem 1 (col 21, 22)
print("Sample summary formula check (Row 7, Sem 1 Total Grade & GPA):")
print(f"  Col 21 (Total Grade): Orig='{wb_orig_f['20-24'].cell(7, 21).value}' | Exp='{wb_exp_f['20-24'].cell(7, 21).value}'")
print(f"  Col 22 (GPA)        : Orig='{wb_orig_f['20-24'].cell(7, 22).value}' | Exp='{wb_exp_f['20-24'].cell(7, 22).value}'")
print(f"  Col 23 (Arrear)     : Orig='{wb_orig_f['20-24'].cell(7, 23).value}' | Exp='{wb_exp_f['20-24'].cell(7, 23).value}'")
