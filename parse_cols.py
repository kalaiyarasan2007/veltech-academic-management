import json

with open('columns_dump.json') as f:
    cols = json.load(f)

print("=== ALL NON-EMPTY COLUMNS ===")
for col in cols:
    c = col['col_num']
    cl = col['col_let']
    r4 = col['r4'] if col['r4'] != 'None' else ''
    r5 = col['r5'] if col['r5'] != 'None' else ''
    r6 = col['r6'] if col['r6'] != 'None' else ''
    color = col['color']
    r7 = col['r7_sample'] if col['r7_sample'] != 'None' else ''
    
    if r4 or r5 or r6:
        print(f"Col {c:3d} ({cl:3s}) | Color: {color:25s} | R4: {r4[:30]:30s} | R5: {r5[:30]:30s} | R6: {r6:5s} | R7: {r7[:35]}")
