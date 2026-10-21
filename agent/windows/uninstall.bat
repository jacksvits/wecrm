@echo off
chcp 65001 >nul
REM Удаление службы WeCRM Agent (от имени администратора)
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo Запустите от имени администратора
    pause
    exit /b 1
)
cd /d "%~dp0"
python agent.py stop
python agent.py remove
echo Служба удалена. Конфигурация в реестре HKLM\SOFTWARE\WeCRM\Agent сохранена.
pause
