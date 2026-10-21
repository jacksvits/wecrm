@echo off
REM WeCRM Agent service removal (run as Administrator)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Run uninstall.bat as Administrator
    pause
    exit /b 1
)
cd /d "%~dp0"
python agent.py stop
python agent.py remove
echo Service removed. Configuration in HKLM\SOFTWARE\WeCRM\Agent is kept.
pause
