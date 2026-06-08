@echo off
REM Stop Castor (Windows)
setlocal

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "PID_FILE=%PROJECT_DIR%\data\castor.pid"

if not exist "%PID_FILE%" (
    echo Castor is not running (no pid file)
    exit /b 0
)

set /p PID=<"%PID_FILE%"

tasklist /FI "PID eq %PID%" 2>NUL | find "%PID%" >NUL
if not errorlevel 1 (
    taskkill /PID %PID% /F >NUL 2>&1
    echo Castor stopped (PID: %PID%)
) else (
    echo Castor process not found (stale pid file)
)

del "%PID_FILE%"
