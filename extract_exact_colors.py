import openpyxl

wb = openpyxl.load_workbook(r'e:\COLLEGE PROJECT\CN-PRJECT  DETSILS.xlsx', data_only=False)
ws = wb['20-24']

# Let's check headers and subject columns for each semester
sem_cols = {
    'Sem 1': range(5, 21),    # E to T
    'Sem 2': range(25, 41),   # Y to AN
    'Sem 3': range(45, 64),   # AS to BL
    'Sem 4': range(69, 88),   # BQ to CJ
    'Sem 5': range(95, 113),  # CQ to DH
    'Sem 6': range(119, 139), # DO to EH
    'Sem 7': range(145, 161), # EO to FD
    'Sem 8': range(167, 173), # FK to FP
}

print("=== EXACT SEMESTER COLOR MAPPING FROM EXCEL ===")
for sem_name, col_range in sem_cols.items():
    colors = set()
    for col in col_range:
        for row in [4, 5, 6, 7, 8, 9, 10]:
            cell = ws.cell(row, col)
            if cell.fill and cell.fill.fill_type:
                fg = cell.fill.fgColor
                if fg and fg.type == 'rgb':
                    colors.add(fg.rgb)
                elif fg and fg.type == 'theme':
                    colors.add(f"theme_{fg.theme}_tint_{fg.tint}")
    print(f"{sem_name} (Cols {col_range.start}-{col_range.stop-1}): {colors}")
