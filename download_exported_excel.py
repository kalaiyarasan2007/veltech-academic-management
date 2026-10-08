import urllib.request
import os

url = "http://localhost:5000/api/excel/export"
output_file = "Academic_Records_Updated.xlsx"

print(f"Downloading from {url}...")
urllib.request.urlretrieve(url, output_file)

size = os.path.getsize(output_file)
print(f"Downloaded successfully: {output_file} ({size:,} bytes)")
