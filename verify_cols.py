import sys
sys.stdout.reconfigure(encoding='utf-8')
import openpyxl

wb = openpyxl.load_workbook(r'e:\COLLEGE PROJECT\CN-PRJECT  DETSILS.xlsx', data_only=True)
ws = wb['20-24']

# Extract subject code -> first occurrence column (shows grade col since openpyxl doesn't duplicate for merged)
print('Subject code -> col mapping from original Excel row 4:')
print(f'{"Code":<22} {"Col":<6} {"GradeCol":<10} {"GPCol (=gradeCol+1)":<22} {"Row5 Name":<40} {"Row6 Credits"}')
print('-' * 120)
seen = {}
for c in range(1, ws.max_column + 1):
    v = ws.cell(4, c).value
    if v and str(v).strip():
        code = str(v).strip()
        if code not in seen:
            seen[code] = c
            name = ws.cell(5, c).value or ''
            cred = ws.cell(6, c).value or ''
            # For subject codes (not headers like 'Total Grade', 'GPA', etc)
            gp_col = c + 1 if ws.cell(4, c+1).value is None else '?'
            print(f'  {code:<20} col={c:<4} gp_col={gp_col:<8} name={str(name)[:35]:<37} cred={cred}')
