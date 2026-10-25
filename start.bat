@echo off
setlocal
if not exist "%~dp0dist\index.html" (
  echo.
  echo The build was not found.
  echo Install Node.js 20+ and run:
  echo     npm install
  echo     npm run build
  echo.
  pause
  exit /b 1
)
start "" "%~dp0dist\index.html"
