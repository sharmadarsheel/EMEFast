@echo off
setlocal
set "ROOT=%~dp0"
set "MODULES=C:\Users\GITANSH-PC\Desktop\EMEFast_Modules"
if not exist "%MODULES%" mkdir "%MODULES%"
copy /Y "%ROOT%frontend-v2\package.json" "%MODULES%\package.json" >nul
cd /d "%MODULES%"
echo Installing EMEFast shared dependencies in:
echo %MODULES%\node_modules
echo.
npm install --legacy-peer-deps
if errorlevel 1 (
  echo.
  echo Dependency installation failed.
  pause
  exit /b 1
)
echo.
echo Shared dependencies installed successfully.
pause
