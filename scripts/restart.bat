@echo off
REM Restart Castor (Windows)
set "SCRIPT_DIR=%~dp0"
call "%SCRIPT_DIR%stop.bat"
timeout /t 1 /nobreak >NUL
call "%SCRIPT_DIR%start.bat"
