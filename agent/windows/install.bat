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
echo [1/6] Installing pywin32...
python -m pip install --upgrade pywin32
if errorlevel 1 goto fail

echo [2/6] pywin32 post-install (needed for services)...
python -c "import sys, os, subprocess; s=os.path.join(os.path.dirname(sys.executable),'Scripts','pywin32_postinstall.py'); subprocess.call([sys.executable, s, '-install'])"

echo [3/6] Writing config to registry...
python -c "import winreg; k=winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE,r'SOFTWARE\WeCRM\Agent',0,winreg.KEY_SET_VALUE|winreg.KEY_WOW64_64KEY); winreg.SetValueEx(k,'ServerUrl',0,winreg.REG_SZ,r'%SERVER%'); winreg.SetValueEx(k,'ContactKey',0,winreg.REG_SZ,r'%CONTACT%')"
if errorlevel 1 goto fail

echo [4/6] Installing WecrmAgent service...
cd /d "%~dp0"
python agent.py install
if errorlevel 1 goto fail

echo [5/6] Auto-restart on failure + autostart...
sc failure WecrmAgent reset= 0 actions= restart/5000/restart/10000/restart/30000
sc config WecrmAgent start= auto
sc description WecrmAgent "Reports computer and system information to WeCRM"
python agent.py start
if errorlevel 1 goto svc_fail

echo [6/6] Sending first test report...
python agent.py debug
if errorlevel 1 goto svc_fail

echo.
echo ==========================================
echo  Done! Service WecrmAgent is running.
echo  Check the Devices tab on contact %CONTACT%
echo  in CRM in about a minute.
echo ==========================================
pause
exit /b 0

:svc_fail
echo.
echo [ERROR] Service was installed but did not start or report.
echo Diagnostics:
echo   1) sc query WecrmAgent
echo   2) python agent.py debug   (shows the exact error)
echo   3) Event Viewer - Windows Logs - Application
pause
exit /b 1

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
