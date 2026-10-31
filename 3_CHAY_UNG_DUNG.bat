@echo off
setlocal

title Buoc 3 - Chay TikTok LIVE Monitor
cd /d "%~dp0"
set "CI=true"

echo.
echo ========================================
echo   BUOC 3 - CHAY UNG DUNG
echo ========================================
echo.

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua co pnpm. Hay chay file 1_CAI_DAT.bat truoc.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [LOI] Chua co thu vien. Hay chay file 1_CAI_DAT.bat truoc.
  pause
  exit /b 1
)

echo Dashboard : http://localhost:5173
echo Backend   : http://localhost:3001
echo.
echo Trinh duyet se tu mo che do test 3D tai:
echo http://localhost:5173/test
echo.
echo Nhan Ctrl+C de dung ung dung.
echo ----------------------------------------
echo.

start "" powershell.exe -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 5; Start-Process 'http://localhost:5173/test'"
call pnpm dev

if errorlevel 1 (
  echo.
  echo [LOI] Ung dung da dung do co loi.
  pause
)

endlocal
