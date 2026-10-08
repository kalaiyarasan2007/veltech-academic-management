import openpyxl
wb = openpyxl.load_workbook(r'e:\COLLEGE PROJECT\test_export.xlsx', data_only=True)
ws = wb['20-24']

last_col_with_data = 0
for r in range(1, 10):
    for c in range(150, 185):
        v = ws.cell(r, c).value
        if v is not None:
            last_col_with_data = max(last_col_with_data, c)

print(f'max_column says: {ws.max_column}')
print(f'last data col:   {last_col_with_data}')

print()
print('Export row 4, cols 21-30:')
for c in range(21, 30):
    v = ws.cell(4, c).value
    print(f'  col {c}: {repr(v)}')

# Check merged ranges - print all 
wb_f = openpyxl.load_workbook(r'e:\COLLEGE PROJECT\test_export.xlsx', data_only=False)
ws_f = wb_f['20-24']
merges = sorted(str(m) for m in ws_f.merged_cells.ranges)
print(f'\nTotal merged ranges: {len(merges)}')
print('First 20:')
for m in merges[:20]:
    print(f'  {m}')
