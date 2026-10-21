@echo off
chcp 65001 >nul
REM ===================================================================
REM  WeCRM Agent — установка системной службы (Windows 10)
REM  Требуется запуск от имени администратора
REM ===================================================================
net session >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Запустите install.bat от имени администратора ^(правая кнопка — Запуск от имени администратора^)
    pause
    exit /b 1
)

set /p SERVER="Адрес сервера WeCRM [https://welans.cc]: "
if "%SERVER%"=="" set SERVER=https://welans.cc
set /p CONTACT="ID контакта из карточки клиента (формат 000-000-000): "

echo %CONTACT%|findstr /r "^[0-9][0-9][0-9]-[0-9][0-9][0-9]-[0-9][0-9][0-9]$" >nul
if %errorlevel% neq 0 (
    echo [ОШИБКА] ID контакта должен иметь формат 000-000-000
    pause
    exit /b 1
)

where python >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Python не найден. Установите Python 3.9+ с https://python.org ^(отметьте Add to PATH^)
    pause
    exit /b 1
)

echo [1/5] Установка зависимостей...
python -m pip install --upgrade pywin32
if %errorlevel% neq 0 (
    echo [ОШИБКА] Не удалось установить pywin32
    pause
    exit /b 1
)

echo [2/5] Запись конфигурации в реестр...
python -c "import winreg; k=winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE,r'SOFTWARE\WeCRM\Agent',0,winreg.KEY_SET_VALUE|winreg.KEY_WOW64_64KEY); winreg.SetValueEx(k,'ServerUrl',0,winreg.REG_SZ,r'%SERVER%'); winreg.SetValueEx(k,'ContactKey',0,winreg.REG_SZ,r'%CONTACT%')"
if %errorlevel% neq 0 goto fail

echo [3/5] Установка службы %SERVICE%...
cd /d "%~dp0"
python agent.py install
if %errorlevel% neq 0 goto fail

echo [4/5] Настройка автоматического перезапуска службы при сбое...
sc failure WecrmAgent reset= 0 actions= restart/5000/restart/10000/restart/30000
sc config WecrmAgent start= auto
sc description WecrmAgent "Передаёт в WeCRM информацию о компьютере и системе клиента"

echo [5/5] Запуск службы...
python agent.py start
if %errorlevel% neq 0 goto fail

echo.
echo ==========================================================
echo  Готово! Служба WecrmAgent установлена и запущена.
echo  Компьютер появится у контакта %CONTACT% в CRM.
echo  Проверка отправки: python agent.py debug
echo ==========================================================
pause
exit /b 0

:fail
echo [ОШИБКА] Установка не завершена. Смотрите сообщения выше.
pause
exit /b 1
