@echo off
setlocal
set "ROOT=%~dp0"
set "FRONTEND=%ROOT%frontend-v2"
set "EXTERNAL_NM=C:\Users\GITANSH-PC\Desktop\EMEFast_Modules\node_modules"
if not exist "%EXTERNAL_NM%\next\dist\bin\next" (
  echo Shared EMEFast_Modules node_modules not found:
  echo %EXTERNAL_NM%
  echo.
  echo Put your installed node_modules there first.
  pause
  exit /b 1
)
start "EMEFast API" /D "%ROOT%backend" cmd /k node mock-server.mjs
timeout /t 2 /nobreak >nul
cd /d "%FRONTEND%"
set "NODE_PATH=%EXTERNAL_NM%"
set "PATH=%EXTERNAL_NM%\.bin;%PATH%"
echo Starting EMEFast frontend on http://localhost:3001
node "%EXTERNAL_NM%\next\dist\bin\next" dev -p 3001
