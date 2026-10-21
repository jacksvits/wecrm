@echo off
echo ==========================================
echo  WeCRM Agent - installer (Windows 10)
echo  Run as Administrator!
echo ==========================================
echo.

net session >nul 2>&1
if errorlevel 1 goto need_admin
goto setup

:need_admin
echo [ERROR] Administrator rights required.
echo Right click install.bat - Run as administrator.
pause
exit /b 1

:setup
set "SERVER="
set /p "SERVER=WeCRM server URL [https://welans.cc]: "
if "%SERVER%"=="" set "SERVER=https://welans.cc"

set "CONTACT="
set /p "CONTACT=Contact ID from client card, format 000-000-000: "
echo %CONTACT%|findstr /r "^[0-9][0-9][0-9]-[0-9][0-9][0-9]-[0-9][0-9][0-9]$" >nul
if errorlevel 1 goto bad_id

where python >nul 2>&1
if errorlevel 1 goto no_python

echo.
echo [1/5] Installing pywin32...
python -m pip install --upgrade pywin32
if errorlevel 1 goto fail

echo [2/5] Writing config to registry...
python -c "import winreg; k=winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE,r'SOFTWARE\WeCRM\Agent',0,winreg.KEY_SET_VALUE|winreg.KEY_WOW64_64KEY); winreg.SetValueEx(k,'ServerUrl',0,winreg.REG_SZ,r'%SERVER%'); winreg.SetValueEx(k,'ContactKey',0,winreg.REG_SZ,r'%CONTACT%')"
if errorlevel 1 goto fail

echo [3/5] Installing WecrmAgent service...
cd /d "%~dp0"
python agent.py install
if errorlevel 1 goto fail

echo [4/5] Auto-restart on failure + autostart...
sc failure WecrmAgent reset= 0 actions= restart/5000/restart/10000/restart/30000
sc config WecrmAgent start= auto
sc description WecrmAgent "Reports computer and system information to WeCRM"

echo [5/5] Starting service...
python agent.py start
if errorlevel 1 goto fail

echo.
echo ==========================================
echo  Done! Service WecrmAgent is running.
echo  Computer will appear on contact %CONTACT%
echo  in CRM: client card - Devices tab.
echo  Test: python agent.py debug
echo ==========================================
pause
exit /b 0

:bad_id
echo [ERROR] Contact ID must look like 000-000-000
pause
exit /b 1

:no_python
echo [ERROR] Python not found.
echo Install Python 3.9+ from https://python.org
echo and check "Add python.exe to PATH" during setup.
pause
exit /b 1

:fail
echo [ERROR] Installation failed. See messages above.
pause
exit /b 1
