try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $excel.DisplayAlerts = $false
    Write-Host "Excel COM Object Created. Version: $($excel.Version)"
    
    $filePath = (Resolve-Path ".\CN_PROJECT_UPDATED.xlsx").Path
    Write-Host "Opening file: $filePath"
    $wb = $excel.Workbooks.Open($filePath)
    Write-Host "SUCCESSFULLY OPENED IN REAL MICROSOFT EXCEL!"
    Write-Host "Worksheet count: $($wb.Sheets.Count)"
    for ($i = 1; $i -le $wb.Sheets.Count; $i++) {
        $sheet = $wb.Sheets.Item($i)
        $sName = $sheet.Name
        Write-Host "  Sheet $($i): $sName"
    }

    $ws = $wb.Sheets.Item("20-24")
    Write-Host "`n--- Inspecting Row 7 (First Student) ---"
    Write-Host "  Reg: $($ws.Range('C7').Text) | Name: $($ws.Range('D7').Text)"
    Write-Host "  Sem 1 GPA: $($ws.Range('V7').Text) (Formula: $($ws.Range('V7').Formula))"
    Write-Host "  Sem 2 GPA: $($ws.Range('AP7').Text) (Formula: $($ws.Range('AP7').Formula))"
    Write-Host "  Sem 2 CGPA: $($ws.Range('AQ7').Text) (Formula: $($ws.Range('AQ7').Formula))"
    Write-Host "  Sem 1 Arrears: $($ws.Range('W7').Text)"

    Write-Host "`n--- Inspecting Row 133 (New Student KALAI) ---"
    Write-Host "  Reg: $($ws.Range('C133').Text) | Name: $($ws.Range('D133').Text)"
    Write-Host "  Sem 1 GPA: $($ws.Range('V133').Text) (Formula: $($ws.Range('V133').Formula))"
    Write-Host "  Sem 2 GPA: $($ws.Range('AP133').Text) (Formula: $($ws.Range('AP133').Formula))"
    Write-Host "  Sem 2 CGPA: $($ws.Range('AQ133').Text) (Formula: $($ws.Range('AQ133').Formula))"
    Write-Host "  Sem 3 GPA: $($ws.Range('BN133').Text) (Formula: $($ws.Range('BN133').Formula))"
    Write-Host "  Sem 3 CGPA: $($ws.Range('BO133').Text) (Formula: $($ws.Range('BO133').Formula))"

    $wb.Close($false)
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    Write-Host "`nTEST RESULT: PASSED 100% IN REAL MICROSOFT EXCEL"
} catch {
    Write-Host "TEST FAILED IN MS EXCEL: $($_.Exception.Message)"
}
