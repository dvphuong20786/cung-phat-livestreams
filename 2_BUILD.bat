@echo off
setlocal

title Buoc 2 - Build TikTok LIVE Monitor
cd /d "%~dp0"
set "CI=true"

echo.
echo ========================================
echo   BUOC 2 - BUILD KIEM TRA DU AN
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

echo Dang build frontend, backend va shared package...
call pnpm build

if errorlevel 1 (
  echo.
  echo [LOI] Build that bai. Xem thong bao loi phia tren.
  pause
  exit /b 1
)

echo.
echo [THANH CONG] Build hoan tat.
echo Tiep theo hay chay file: 3_CHAY_UNG_DUNG.bat
pause
endlocal
