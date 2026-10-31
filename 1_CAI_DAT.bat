@echo off
setlocal

title Buoc 1 - Cai dat TikTok LIVE Monitor
cd /d "%~dp0"
set "CI=true"

echo.
echo ========================================
echo   BUOC 1 - CAI DAT THU VIEN
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [LOI] May chua co Node.js.
  echo Tai va cai Node.js LTS tai: https://nodejs.org/
  echo Sau khi cai xong, hay dong cua so nay va chay lai file.
  pause
  exit /b 1
)

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [THONG BAO] Chua co pnpm. Dang cai pnpm...
  call npm install --global pnpm
  if errorlevel 1 (
    echo [LOI] Khong cai duoc pnpm.
    echo Thu mo Terminal voi quyen Administrator va chay: npm install -g pnpm
    pause
    exit /b 1
  )
)

echo Node.js:
call node --version
echo pnpm:
call pnpm --version
echo.
echo Dang tai va cai cac thu vien cua du an...
call pnpm install

if errorlevel 1 (
  echo.
  echo [LOI] Cai dat that bai. Kiem tra ket noi Internet va thu lai.
  pause
  exit /b 1
)

echo.
echo [THANH CONG] Da cai dat xong.
echo Tiep theo hay chay file: 2_BUILD.bat
pause
endlocal
