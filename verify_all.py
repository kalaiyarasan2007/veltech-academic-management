import openpyxl
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

ORIG   = r'e:\COLLEGE PROJECT\CN-PRJECT  DETSILS.xlsx'
EXPORT = r'e:\COLLEGE PROJECT\test_export.xlsx'
DB_FILE = r'e:\COLLEGE PROJECT\server\data\database.json'

print("=" * 70)
print("LOADING FILES...")
print("=" * 70)

wb_orig   = openpyxl.load_workbook(ORIG, data_only=True)
wb_orig_f = openpyxl.load_workbook(ORIG, data_only=False)
wb_exp    = openpyxl.load_workbook(EXPORT, data_only=True)
wb_exp_f  = openpyxl.load_workbook(EXPORT, data_only=False)

with open(DB_FILE, encoding='utf-8') as f:
    db = json.load(f)

# ============================================================
# 1. STUDENT COUNT VERIFICATION
# ============================================================
print("\n" + "=" * 70)
print("1. STUDENT COUNT VERIFICATION")
print("=" * 70)

ws_orig = wb_orig['20-24']
ws_exp  = wb_exp['20-24']

orig_students = {}
for r in range(7, ws_orig.max_row + 1):
    reg  = ws_orig.cell(r, 3).value
    name = ws_orig.cell(r, 4).value
    if reg and str(reg).strip().isdigit() and len(str(reg).strip()) >= 8:
        orig_students[str(reg).strip()] = {'name': str(name).strip() if name else '', 'row': r}

db_students = {s['register_number']: s['name'] for s in db['students']}

exp_students = {}
for r in range(7, ws_exp.max_row + 1):
    reg  = ws_exp.cell(r, 3).value
    name = ws_exp.cell(r, 4).value
    if reg and str(reg).strip().isdigit() and len(str(reg).strip()) >= 8:
        exp_students[str(reg).strip()] = str(name).strip() if name else ''

print(f"\n  Original Excel student count : {len(orig_students)}")
print(f"  Database student count       : {len(db_students)}")
print(f"  Exported Excel student count : {len(exp_students)}")

in_orig_not_db  = set(orig_students.keys()) - set(db_students.keys())
in_db_not_orig  = set(db_students.keys()) - set(orig_students.keys())
in_orig_not_exp = set(orig_students.keys()) - set(exp_students.keys())
in_exp_not_orig = set(exp_students.keys()) - set(orig_students.keys())

if in_orig_not_db:
    print(f"\n  [MISSING] In original Excel but NOT in database:")
    for reg in sorted(in_orig_not_db):
        print(f"    Register: {reg}  Name: {orig_students[reg]['name']}  Row: {orig_students[reg]['row']}")
else:
    print("\n  [OK] All original students present in database.")

if in_db_not_orig:
    print(f"\n  [EXTRA] In database but NOT in original Excel:")
    for reg in sorted(in_db_not_orig):
        print(f"    Register: {reg}  Name: {db_students[reg]}")
else:
    print("  [OK] No extra students in database.")

if in_orig_not_exp:
    print(f"\n  [MISSING] In original Excel but NOT in exported Excel:")
    for reg in sorted(in_orig_not_exp):
        print(f"    Register: {reg}  Name: {orig_students[reg]['name']}")
else:
    print("  [OK] All original students present in exported Excel.")

if in_exp_not_orig:
    print(f"\n  [EXTRA] In exported Excel but NOT in original Excel:")
    for reg in sorted(in_exp_not_orig):
        print(f"    Register: {reg}  Name: {exp_students[reg]}")

# ============================================================
# 2. SHEET STRUCTURE COMPARISON
# ============================================================
print("\n" + "=" * 70)
print("2. SHEET STRUCTURE COMPARISON")
print("=" * 70)

orig_sheets = wb_orig.sheetnames
exp_sheets  = wb_exp.sheetnames
print(f"\n  Original sheets : {orig_sheets}")
print(f"  Exported sheets : {exp_sheets}")
print(f"  Match           : {'[OK]' if orig_sheets == exp_sheets else '[FAIL]'}")

for sname in orig_sheets:
    ws_o = wb_orig[sname]
    ws_e = wb_exp[sname] if sname in exp_sheets else None
    print(f"\n  Sheet '{sname}':")
    print(f"    Original : rows={ws_o.max_row}, cols={ws_o.max_column}")
    if ws_e:
        print(f"    Exported : rows={ws_e.max_row}, cols={ws_e.max_column}")
        dim_ok = ws_o.max_row == ws_e.max_row and ws_o.max_column == ws_e.max_column
        print(f"    Dims     : {'[OK]' if dim_ok else '[MISMATCH - see detail below]'}")
    else:
        print(f"    [MISSING] Sheet not found in exported workbook!")

# ============================================================
# 3. MERGED CELLS COMPARISON (20-24)
# ============================================================
print("\n" + "=" * 70)
print("3. MERGED CELLS COMPARISON (20-24 sheet)")
print("=" * 70)

ws_o_f = wb_orig_f['20-24']
ws_e_f = wb_exp_f['20-24']

orig_merges = set(str(m) for m in ws_o_f.merged_cells.ranges)
exp_merges  = set(str(m) for m in ws_e_f.merged_cells.ranges)

missing_merges = orig_merges - exp_merges
extra_merges   = exp_merges  - orig_merges

print(f"\n  Original merged ranges : {len(orig_merges)}")
print(f"  Exported merged ranges : {len(exp_merges)}")
print(f"  Missing from export    : {len(missing_merges)}")
print(f"  Extra in export        : {len(extra_merges)}")
print(f"  Status : {'[OK] All preserved' if not missing_merges and not extra_merges else '[MISMATCH]'}")

if missing_merges:
    print(f"\n  Missing merged ranges (first 20):")
    for m in sorted(list(missing_merges))[:20]:
        print(f"    {m}")
if extra_merges:
    print(f"\n  Extra merged ranges (first 20):")
    for m in sorted(list(extra_merges))[:20]:
        print(f"    {m}")

# ============================================================
# 4. SEMESTER COLOR VERIFICATION
# ============================================================
print("\n" + "=" * 70)
print("4. SEMESTER COLOR VERIFICATION")
print("=" * 70)

ws_o_f2 = wb_orig_f['20-24']
ws_e_f2 = wb_exp_f['20-24']

# First subject grade column (letter grade column) for each semester
sem_sample_cols = {1: 5, 2: 25, 3: 47, 4: 71, 5: 95, 6: 119, 7: 145, 8: 167}
sample_row = 7  # first student row

def get_argb(cell):
    try:
        fill = cell.fill
        if fill and fill.fgColor:
            fg = fill.fgColor
            if fg.type == 'rgb':
                return fg.rgb
            elif fg.type == 'theme':
                return f'THEME:{fg.theme}'
        return 'None'
    except:
        return 'Error'

print(f"\n  {'Sem':<5} {'Orig ARGB Color':<22} {'Export ARGB Color':<22} {'Status'}")
print("  " + "-" * 65)
color_all_ok = True
for sem, col in sem_sample_cols.items():
    orig_cell = ws_o_f2.cell(sample_row, col)
    exp_cell  = ws_e_f2.cell(sample_row, col)
    orig_color = get_argb(orig_cell)
    exp_color  = get_argb(exp_cell)
    ok = orig_color == exp_color
    if not ok:
        color_all_ok = False
    print(f"  Sem {sem:<2} #{orig_color:<20} #{exp_color:<20} {'[OK]' if ok else '[MISMATCH]'}")

print(f"\n  Overall Colors: {'[OK]' if color_all_ok else '[SOME MISMATCHES]'}")

# ============================================================
# 5. SUBJECT COLUMN POSITION VERIFICATION
# ============================================================
print("\n" + "=" * 70)
print("5. SUBJECT COLUMN POSITION VERIFICATION (row 4)")
print("=" * 70)

ws_o_v = wb_orig['20-24']
ws_e_v = wb_exp['20-24']

orig_sub_cols = {}
for c in range(1, ws_o_v.max_column + 1):
    v = ws_o_v.cell(4, c).value
    if v and str(v).strip():
        orig_sub_cols[str(v).strip()] = c

exp_sub_cols = {}
for c in range(1, ws_e_v.max_column + 1):
    v = ws_e_v.cell(4, c).value
    if v and str(v).strip():
        exp_sub_cols[str(v).strip()] = c

col_mismatches = []
for code, col in orig_sub_cols.items():
    if code in exp_sub_cols:
        if exp_sub_cols[code] != col:
            col_mismatches.append((code, col, exp_sub_cols[code]))
    else:
        col_mismatches.append((code, col, 'MISSING'))

missing_in_exp = set(orig_sub_cols.keys()) - set(exp_sub_cols.keys())

print(f"\n  Original row-4 headers : {len(orig_sub_cols)}")
print(f"  Exported row-4 headers : {len(exp_sub_cols)}")
print(f"  Column mismatches      : {len(col_mismatches)}")

if not col_mismatches:
    print("  [OK] All subject codes in EXACT same columns.")
else:
    print("  [MISMATCH] Column position differences:")
    for code, oc, ec in col_mismatches[:20]:
        print(f"    {code:<15} orig=col{oc:<6} export=col{ec}")

# ============================================================
# 6. GRADE/GP SPOT CHECK — First 5 students, Sem 1
# ============================================================
print("\n" + "=" * 70)
print("6. GRADE & GRADE POINT SPOT CHECK (Sem 1, first 5 students)")
print("=" * 70)

ws_o_v = wb_orig['20-24']
ws_e_v = wb_exp['20-24']

sem1_grade_cols = list(range(5, 21, 2))   # odd = letter grade
sem1_gp_cols    = list(range(6, 22, 2))   # even = grade point

subj_codes = ['HS8151','MA8151','PH8151','CY8151','GE8151','GE8152','GE8161','BS8161']

grade_issues = []
print(f"\n  {'Reg No':<16} {'Subject':<10} {'Orig Grade':<12} {'Exp Grade':<12} {'Match'}")
print("  " + "-" * 65)

for row in range(7, 12):
    reg = ws_o_v.cell(row, 3).value
    for i, col in enumerate(sem1_grade_cols):
        orig_g = ws_o_v.cell(row, col).value
        exp_g  = ws_e_v.cell(row, col).value
        orig_str = str(orig_g).strip() if orig_g is not None else ''
        exp_str  = str(exp_g).strip()  if exp_g  is not None else ''
        match = orig_str == exp_str
        if not match:
            grade_issues.append((row, col, orig_str, exp_str))
        sub = subj_codes[i] if i < len(subj_codes) else f'col{col}'
        print(f"  {str(reg):<16} {sub:<10} {orig_str:<12} {exp_str:<12} {'[OK]' if match else '[DIFF]'}")

# Check a GP column example (even col) — should be formula in orig, value in export
print(f"\n  Grade Point column (col 6) comparison for rows 7-11:")
for row in range(7, 12):
    orig_gp_cell = wb_orig_f['20-24'].cell(row, 6)
    exp_gp_cell  = wb_exp_f['20-24'].cell(row, 6)
    orig_gp = orig_gp_cell.value
    exp_gp  = exp_gp_cell.value
    # For the export, the GP cell should hold the formula from the original (not computed)
    print(f"    Row {row}: orig={repr(str(orig_gp)[:40]):<44}  export={repr(str(exp_gp)[:40])}")

# ============================================================
# 7. FORMULA VERIFICATION
# ============================================================
print("\n" + "=" * 70)
print("7. FORMULA VERIFICATION")
print("=" * 70)

ws_e_f3 = wb_exp_f['20-24']
ws_o_f3 = wb_orig_f['20-24']

# Check for #REF! errors
ref_errors = []
for r in range(1, min(ws_e_f3.max_row + 1, 135)):
    for c in range(1, min(ws_e_f3.max_column + 1, 180)):
        v = ws_e_f3.cell(r, c).value
        if v and isinstance(v, str) and '#REF!' in v:
            ref_errors.append(f"Row {r}, Col {c}: {v}")

print(f"\n  #REF! errors in exported workbook : {len(ref_errors)}")
if ref_errors:
    print("  [FAIL] Errors found:")
    for e in ref_errors[:10]:
        print(f"    {e}")
else:
    print("  [OK] No formula reference errors.")

# Check a few known formula cells for Total Grade, GPA, CGPA
# In the original, these appear after the last subject column for each semester
# Look at row 7 for formulas
print(f"\n  Checking known formula cells (row 7):")
known_formula_cols = []
for c in range(1, ws_o_f3.max_column + 1):
    v = ws_o_f3.cell(6, c).value   # row 6 has labels
    if v and str(v).strip() in ['Total Grade', 'GPA', 'CGPA', 'Arrear', 'Cum. Arrear']:
        known_formula_cols.append((c, str(v).strip()))

for col, label in known_formula_cols[:10]:
    orig_v = ws_o_f3.cell(7, col).value
    exp_v  = ws_e_f3.cell(7, col).value
    is_orig_formula = isinstance(orig_v, str) and orig_v.startswith('=')
    is_exp_formula  = isinstance(exp_v, str) and exp_v.startswith('=')
    print(f"    Col {col:>4} [{label:<15}]: orig={repr(str(orig_v)[:35])}")
    print(f"    {'':>25}  exp ={repr(str(exp_v)[:35])}")

# ============================================================
# 8. HEADER ROW CONTENT VERIFICATION
# ============================================================
print("\n" + "=" * 70)
print("8. HEADER ROW CONTENT VERIFICATION (rows 1-6)")
print("=" * 70)

ws_o_h = wb_orig['20-24']
ws_e_h = wb_exp['20-24']

header_mismatches = []
for r in range(1, 7):
    for c in range(1, min(ws_o_h.max_column + 1, 180)):
        orig_val = ws_o_h.cell(r, c).value
        exp_val  = ws_e_h.cell(r, c).value
        o_str = str(orig_val).strip() if orig_val is not None else ''
        e_str = str(exp_val).strip()  if exp_val  is not None else ''
        if o_str != e_str:
            header_mismatches.append((r, c, o_str, e_str))

print(f"\n  Header mismatches : {len(header_mismatches)}")
if not header_mismatches:
    print("  [OK] All header rows (1-6) match exactly.")
else:
    print("  [MISMATCH] Differences:")
    for r, c, ov, ev in header_mismatches[:15]:
        print(f"    R{r}C{c}: orig={repr(ov)[:30]}, exp={repr(ev)[:30]}")

# ============================================================
# 9. ROW HEIGHT / COLUMN WIDTH SPOT CHECK
# ============================================================
print("\n" + "=" * 70)
print("9. ROW HEIGHT & COLUMN WIDTH SPOT CHECK")
print("=" * 70)

ws_o_f4 = wb_orig_f['20-24']
ws_e_f4 = wb_exp_f['20-24']

# Check row heights for first 10 student rows
print("\n  Row heights (rows 7-12):")
print(f"  {'Row':<6} {'Orig Ht':<12} {'Exp Ht':<12} {'Match'}")
for r in range(7, 13):
    orig_ht = ws_o_f4.row_dimensions[r].height
    exp_ht  = ws_e_f4.row_dimensions[r].height
    ok = (orig_ht == exp_ht) or (orig_ht is None and exp_ht is None)
    print(f"  {r:<6} {str(orig_ht):<12} {str(exp_ht):<12} {'[OK]' if ok else '[DIFF]'}")

# Check column widths for first 10 cols
print("\n  Column widths (cols A-J):")
print(f"  {'Col':<6} {'Orig W':<12} {'Exp W':<12} {'Match'}")
for c_idx in range(1, 11):
    letter = openpyxl.utils.get_column_letter(c_idx)
    orig_w = ws_o_f4.column_dimensions[letter].width
    exp_w  = ws_e_f4.column_dimensions[letter].width
    ok = (orig_w == exp_w) or (orig_w is None and exp_w is None)
    print(f"  {letter:<6} {str(orig_w):<12} {str(exp_w):<12} {'[OK]' if ok else '[DIFF]'}")

# ============================================================
# 10. ARREAR RECORDS VERIFICATION
# ============================================================
print("\n" + "=" * 70)
print("10. ARREAR RECORDS IN DATABASE")
print("=" * 70)

arrears = db.get('arrears', [])
print(f"\n  Total arrear records : {len(arrears)}")
cleared  = [a for a in arrears if a['status'] == 'CLEARED']
pending  = [a for a in arrears if a['status'] == 'PENDING']
print(f"  CLEARED arrears      : {len(cleared)}")
print(f"  PENDING arrears      : {len(pending)}")

print("\n  Sample arrear records:")
for a in arrears[:5]:
    print(f"    {a['register_number']} | {a['subject_code']} | orig={a['original_grade']} | cleared_grade={a.get('cleared_grade')} | status={a['status']} | cleared_sem={a.get('cleared_semester')}")

# ============================================================
# FINAL SUMMARY REPORT
# ============================================================
print("\n" + "=" * 70)
print("FINAL VERIFICATION SUMMARY REPORT")
print("=" * 70)

# recalculate totals
sheets_ok   = orig_sheets == exp_sheets
merges_ok   = not missing_merges and not extra_merges
cols_ok     = not col_mismatches
headers_ok  = not header_mismatches
formulas_ok = not ref_errors
colors_ok   = color_all_ok

print(f"""
  STUDENT COUNTS:
    Original Excel    : {len(orig_students)}
    Database          : {len(db_students)}
    Exported Excel    : {len(exp_students)}
    Missing orig-DB   : {sorted(in_orig_not_db) or 'None'}
    Extra   DB-orig   : {sorted(in_db_not_orig) or 'None'}
    Missing orig-exp  : {sorted(in_orig_not_exp) or 'None'}
    Extra   exp-orig  : {sorted(in_exp_not_orig) or 'None'}

  STRUCTURE:
    Sheet names match       : {'YES [OK]' if sheets_ok else 'NO [FAIL]'}
    Merged cells preserved  : {'YES [OK]' if merges_ok else f'NO [FAIL] - missing={len(missing_merges)}, extra={len(extra_merges)}'}
    Subject cols preserved  : {'YES [OK]' if cols_ok else f'NO [FAIL] - {len(col_mismatches)} mismatches'}
    Header content correct  : {'YES [OK]' if headers_ok else f'NO [FAIL] - {len(header_mismatches)} diffs'}
    Semester colors correct : {'YES [OK]' if colors_ok else 'NO [FAIL]'}
    Formula errors (#REF!)  : {'NONE [OK]' if formulas_ok else f'{len(ref_errors)} ERRORS [FAIL]'}

  EXCEL VALIDITY:
    Excel opens OK          : YES [OK]
    All 4 sheets exist      : {'YES [OK]' if set(orig_sheets) == set(exp_sheets) else 'NO [FAIL]'}
    Arrear records exist    : YES - {len(arrears)} records ({len(cleared)} cleared, {len(pending)} pending)

  OVERALL:
    {'ALL CHECKS PASSED' if all([sheets_ok, merges_ok, cols_ok, headers_ok, formulas_ok, colors_ok]) else 'SOME CHECKS NEED ATTENTION - see details above'}
""")
