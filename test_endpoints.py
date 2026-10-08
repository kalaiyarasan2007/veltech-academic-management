import requests
import os

print("--- Testing /api/excel/original ---")
r_orig = requests.get("http://localhost:5000/api/excel/original")
print(f"Status: {r_orig.status_code}")
print(f"Content-Type: {r_orig.headers.get('Content-Type')}")
print(f"Content-Disposition: {r_orig.headers.get('Content-Disposition')}")
print(f"Size: {len(r_orig.content):,} bytes")
assert r_orig.status_code == 200
assert 'CN-PRJECT' in r_orig.headers.get('Content-Disposition', '')
assert len(r_orig.content) > 300000

print("\n--- Testing /api/excel/export ---")
r_exp = requests.get("http://localhost:5000/api/excel/export")
print(f"Status: {r_exp.status_code}")
print(f"Content-Type: {r_exp.headers.get('Content-Type')}")
print(f"Content-Disposition: {r_exp.headers.get('Content-Disposition')}")
print(f"Size: {len(r_exp.content):,} bytes")
assert r_exp.status_code == 200
assert 'Academic_Records_Updated.xlsx' in r_exp.headers.get('Content-Disposition', '')
assert len(r_exp.content) > 200000

print("\nALL SERVER ENDPOINTS VERIFIED 100%!")
