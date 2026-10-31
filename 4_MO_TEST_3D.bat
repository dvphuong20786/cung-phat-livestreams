@echo off
setlocal

title Mo che do test chua 3D
cd /d "%~dp0"

echo.
echo ========================================
echo   MO CHE DO TEST CHUA 3D
echo ========================================
echo.

powershell.exe -NoProfile -Command "try { $response = Invoke-RestMethod 'http://localhost:3001/health' -TimeoutSec 3; if ($response.ok) { exit 0 }; exit 1 } catch { exit 1 }"

if errorlevel 1 (
  echo [LOI] Backend chua chay hoac dang bi treo.
  echo Hay chay 3_CHAY_UNG_DUNG.bat va giu cua so do mo.
  echo Sau khi thay VITE ready, chay lai file nay.
  pause
  exit /b 1
)

echo [OK] Backend dang hoat dong.
echo Dang mo: http://localhost:5173/test
start "" "http://localhost:5173/test"

endlocal
