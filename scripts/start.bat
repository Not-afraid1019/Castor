@echo off
REM Start Castor in the background (Windows)
setlocal

set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%.."
set "PID_FILE=%PROJECT_DIR%\data\castor.pid"
set "LOG_FILE=%PROJECT_DIR%\data\castor.stdout.log"

cd /d "%PROJECT_DIR%"

REM Ensure data directory exists
if not exist "data" mkdir "data"

REM Check if already running
if exist "%PID_FILE%" (
    set /p OLD_PID=<"%PID_FILE%"
    tasklist /FI "PID eq %OLD_PID%" 2>NUL | find "%OLD_PID%" >NUL
    if not errorlevel 1 (
        echo Castor is already running (PID: %OLD_PID%)
        exit /b 0
    ) else (
        del "%PID_FILE%"
    )
)

REM Start in background using wmic/start
start /b "" npx tsx src/index.ts > "%LOG_FILE%" 2>&1

REM Get PID of the last background process via wmic
timeout /t 2 /nobreak >NUL
for /f "tokens=2" %%i in ('wmic process where "commandline like '%%tsx%%src/index.ts%%' and name='node.exe'" get processid /format:list 2^>NUL ^| find "="') do (
    echo %%i> "%PID_FILE%"
    echo Castor started (PID: %%i)
    echo Logs: %LOG_FILE%
    exit /b 0
)

echo Castor started (PID unknown - check logs)
echo Logs: %LOG_FILE%
