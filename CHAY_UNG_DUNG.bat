@echo off
setlocal

title TikTok LIVE Monitor
cd /d "%~dp0"
set "CI=true"

echo.
echo ========================================
echo   TIKTOK LIVE REALTIME EVENT MONITOR
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai Node.js.
  echo Tai Node.js tai: https://nodejs.org/
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [LOI] Chua cai pnpm.
  echo Hay chay lenh: npm install -g pnpm
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [1/2] Dang cai thu vien lan dau...
  call pnpm install
  if errorlevel 1 (
    echo.
    echo [LOI] Cai thu vien that bai. Vui long kiem tra mang va thu lai.
    pause
    exit /b 1
  )
) else (
  echo [1/2] Thu vien da san sang.
)

echo [2/2] Dang khoi dong ung dung...
echo.
echo Dashboard : http://localhost:5173
echo Backend   : http://localhost:3001
echo.
echo Nhan Ctrl+C de dung ung dung.
echo ----------------------------------------
echo.

call pnpm dev

if errorlevel 1 (
  echo.
  echo [LOI] Ung dung da dung do co loi.
  pause
)

endlocal
