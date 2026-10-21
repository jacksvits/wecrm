@echo off
echo WeCRM Agent - service removal
net session >nul 2>&1
if errorlevel 1 goto need_admin
cd /d "%~dp0"
python agent.py stop
python agent.py remove
echo Service removed. Registry config HKLM\SOFTWARE\WeCRM\Agent is kept.
pause
exit /b 0

:need_admin
echo Run uninstall.bat as Administrator.
pause
exit /b 1
