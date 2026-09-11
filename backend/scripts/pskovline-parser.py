#!/usr/bin/env python3
"""Парсер балансов Псковлайн: списание за месяц, текущий баланс, дата.
Читает настройки плагина (/app/data/pskovline_settings.json), пишет /app/data/pskovline.json.
Cron на хосте вызывает скрипт ежечасно; запуск не чаще раза в день, не раньше update_time.
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "..", "data")
OUTPUT_JSON = os.path.join(DATA_DIR, "pskovline.json")
SETTINGS_JSON = os.path.join(DATA_DIR, "pskovline_settings.json")

DEFAULT_ACCOUNTS = [
    {"label": "Псковлайн", "login": "91868", "password": "e5yvku2a"},
    {"label": "Псковлайн телефон", "login": "upl69777", "password": "i9rmh2s9"},
]


def get_settings():
    """Настройки плагина: is_active, update_time, accounts. Fallback — legacy из БД."""
    try:
        with open(SETTINGS_JSON, encoding="utf-8") as f:
            s = json.load(f)
        if isinstance(s.get("accounts"), list):
            s.setdefault("is_active", True)
            s.setdefault("update_time", "08:00")
            return s
    except Exception:
        pass
    # Fallback: legacy-таблица pskovline_settings (docker exec psql)
    try:
        result = subprocess.run(
            [
                "docker", "exec", "wecrm-db-1", "psql", "-U", "crm", "wecrm", "-t", "-A",
                "-c",
                "SELECT label, login, password, label2, login2, password2 FROM pskovline_settings LIMIT 1",
            ],
            capture_output=True, text=True, timeout=30,
        )
        line = result.stdout.strip()
        if "|" in line:
            parts = line.split("|")
            accounts = []
            if len(parts) > 2 and parts[1] and parts[2]:
                accounts.append({"label": parts[0] or "Псковлайн", "login": parts[1], "password": parts[2]})
            if len(parts) > 5 and parts[4] and parts[5]:
                accounts.append({"label": parts[3] or "Псковлайн 2", "login": parts[4], "password": parts[5]})
            if accounts:
                return {"is_active": True, "update_time": "08:00", "accounts": accounts}
    except Exception as e:
        print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Ошибка чтения legacy-настроек: {e}")
    return {"is_active": True, "update_time": "08:00", "accounts": DEFAULT_ACCOUNTS}


def parse_pskovline(accounts):
    data = {"accounts": [], "updated_at": datetime.now().isoformat()}
    for acc in accounts:
        login = acc.get("login", "")
        password = acc.get("password", "")
        account = {
            "label": acc.get("label", ""),
            "login": login,
            "spending": None,
            "balance": None,
            "period": "",
            "status": "error",
            "error": "",
        }
        if not login or not password:
            account["error"] = "Не задан логин или пароль"
            data["accounts"].append(account)
            continue
        try:
            from selenium import webdriver
            from selenium.webdriver.common.by import By
            from selenium.webdriver.support import expected_conditions as EC
            from selenium.webdriver.support.ui import WebDriverWait

            options = webdriver.ChromeOptions()
            options.add_argument("--headless=new")
            options.add_argument("--no-sandbox")
            options.add_argument("--disable-dev-shm-usage")
            driver = webdriver.Chrome(options=options)
            try:
                driver.get("https://lk.pskovline.ru/")
                wait = WebDriverWait(driver, 15)
                wait.until(EC.presence_of_element_located((By.NAME, "login"))).send_keys(login)
                driver.find_element(By.NAME, "password").send_keys(password)
                driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
                wait.until(EC.presence_of_element_located((By.CSS_SELECTOR, ".balance-value, [class*='balance']")))
                body = driver.find_element(By.TAG_NAME, "body").text

                m = re.search(r"(-?[\d\s.,]+)\s*руб", body)
                if m:
                    account["spending"] = float(m.group(1).replace(" ", "").replace(",", "."))
                m = re.search(r"Текущий баланс[:\s]*(-?[\d\s.,]+)", body)
                if m:
                    account["balance"] = float(m.group(1).replace(" ", "").replace(",", "."))
                m = re.search(r"(\d{2}\.\d{2}\.\d{4})\s*[-—]\s*(\d{2}\.\d{2}\.\d{4})", body)
                if m:
                    account["period"] = f"{m.group(1)} — {m.group(2)}"
                account["status"] = "ok"
            finally:
                driver.quit()
        except Exception as e:
            account["error"] = str(e)[:200]
        data["accounts"].append(account)
    return data


if __name__ == "__main__":
    settings = get_settings()

    if settings.get("is_active") is False:
        print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Интеграция Псковлайн деактивирована, пропуск")
        sys.exit(0)

    # Запуск не чаще раза в день, не раньше заданного времени (cron вызывает ежечасно)
    now = datetime.now()
    try:
        hh, mm = map(int, settings.get("update_time", "08:00").split(":"))
    except ValueError:
        hh, mm = 8, 0
    scheduled = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
    if now < scheduled:
        print(f"[{now:%Y-%m-%d %H:%M:%S}] Ранее времени обновления {settings.get('update_time', '08:00')}, пропуск")
        sys.exit(0)
    try:
        with open(OUTPUT_JSON, encoding="utf-8") as f:
            last = datetime.fromisoformat(json.load(f).get("updated_at"))
        if last >= scheduled:
            print(f"[{now:%Y-%m-%d %H:%M:%S}] Данные уже собраны после {settings.get('update_time', '08:00')}, пропуск")
            sys.exit(0)
    except SystemExit:
        raise
    except Exception:
        pass  # файла ещё нет — собираем

    data = parse_pskovline(settings.get("accounts") or DEFAULT_ACCOUNTS)
    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Сохранено {len(data['accounts'])} аккаунтов")
