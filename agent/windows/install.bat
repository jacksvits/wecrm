@echo off
REM ===================================================================
REM  WeCRM Agent - Windows service installer (Windows 10)
REM  Run as Administrator (right click -> Run as administrator)
REM ===================================================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Run install.bat as Administrator (right click - Run as administrator)
    pause
    exit /b 1
)

set /p SERVER="WeCRM server URL [https://welans.cc]: "
if "%SERVER%"=="" set SERVER=https://welans.cc
set /p CONTACT="Contact ID from the client card (format 000-000-000): "

echo %CONTACT%|findstr /r "^[0-9][0-9][0-9]-[0-9][0-9][0-9]-[0-9][0-9][0-9]$" >nul
if %errorlevel% neq 0 (
    echo [ERROR] Contact ID must have format 000-000-000
    pause
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found. Install Python 3.9+ from https://python.org (check "Add python.exe to PATH")
    pause
    exit /b 1
)

echo [1/5] Installing dependencies...
python -m pip install --upgrade pywin32
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install pywin32
    pause
    exit /b 1
)

echo [2/5] Writing configuration to registry...
python -c "import winreg; k=winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE,r'SOFTWARE\WeCRM\Agent',0,winreg.KEY_SET_VALUE|winreg.KEY_WOW64_64KEY); winreg.SetValueEx(k,'ServerUrl',0,winreg.REG_SZ,r'%SERVER%'); winreg.SetValueEx(k,'ContactKey',0,winreg.REG_SZ,r'%CONTACT%')"
if %errorlevel% neq 0 goto fail

echo [3/5] Installing the WecrmAgent service...
cd /d "%~dp0"
python agent.py install
if %errorlevel% neq 0 goto fail

echo [4/5] Configuring automatic restart on failure...
sc failure WecrmAgent reset= 0 actions= restart/5000/restart/10000/restart/30000
sc config WecrmAgent start= auto
sc description WecrmAgent "Reports computer and system information to WeCRM"

echo [5/5] Starting the service...
python agent.py start
if %errorlevel% neq 0 goto fail

echo.
echo ==========================================================
echo  Done! Service WecrmAgent installed and running.
echo  The computer will appear on contact %CONTACT% in CRM
echo  (Contacts - client card - Devices tab).
echo  Test run: python agent.py debug
echo ==========================================================
pause
exit /b 0

:fail
echo [ERROR] Installation failed. See messages above.
pause
exit /b 1
