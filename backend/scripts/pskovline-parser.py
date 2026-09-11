#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Парсер личного кабинета Псковлайн (stat.pskovline.ru)
Сохраняет баланс и период услуги для всех аккаунтов плагина в JSON.

Настройки читает из /app/data/pskovline_settings.json (синхронизируется бэкендом):
  { "is_active": bool, "update_time": "ЧЧ:ММ", "accounts": [{label, login, password}, ...] }
Cron на хосте вызывает скрипт каждые 5 минут; запуск не чаще раза в день, не раньше update_time.
"""

import requests
import re
import json
import os
import subprocess
import sys
from datetime import datetime

URL = "https://stat.pskovline.ru"

if os.path.isdir("/app/data"):
    DATA_DIR = "/app/data"
else:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(SCRIPT_DIR, "..", "data")
OUTPUT_JSON = os.path.join(DATA_DIR, "pskovline.json")
SETTINGS_JSON = os.path.join(DATA_DIR, "pskovline_settings.json")


def get_settings():
    """Настройки плагина: is_active, update_time, accounts. Fallback — legacy-таблица из БД."""
    try:
        with open(SETTINGS_JSON, encoding="utf-8") as f:
            s = json.load(f)
        if isinstance(s.get("accounts"), list):
            s.setdefault("is_active", True)
            s.setdefault("update_time", "08:00")
            return s
    except Exception:
        pass
    # Fallback: legacy-таблица pskovline_settings
    try:
        result = subprocess.run(
            ['docker', 'exec', '-i', 'wecrm-db-1', 'psql', '-U', 'crm', '-d', 'wecrm', '-t', '-A', '-c',
             'SELECT label, login, password, label2, login2, password2 FROM pskovline_settings LIMIT 1;'],
            capture_output=True, text=True, timeout=10
        )
        line = result.stdout.strip()
        if '|' in line:
            parts = line.split('|')
            accounts = []
            if len(parts) > 2 and parts[1] and parts[2]:
                accounts.append({'label': parts[0], 'login': parts[1], 'password': parts[2]})
            if len(parts) > 5 and parts[4] and parts[5]:
                accounts.append({'label': parts[3], 'login': parts[4], 'password': parts[5]})
            if accounts:
                return {'is_active': True, 'update_time': '08:00', 'accounts': accounts}
    except Exception as e:
        print(f"DB read error: {e}", file=sys.stderr)
    return {
        'is_active': True,
        'update_time': '08:00',
        'accounts': [
            {'label': 'Псковлайн', 'login': '91868', 'password': 'e5yvku2a'},
            {'label': 'Псковлайн телефон', 'login': 'upl69777', 'password': 'i9rmh2s9'},
        ],
    }


def parse_account(account):
    """Парсим один аккаунт — новая сессия для каждого"""
    session = requests.Session()
    session.headers.update({
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })

    session.get(URL, timeout=30)
    auth = session.post(URL, data={"login": account['login'], "password": account['password']}, timeout=30)
    text = auth.text

    result = {
        "label": account['label'],
        "login": account['login'],
        "updated_at": datetime.now().isoformat(),
        "balance": None,
        "period": None,
        "status": "error",
        "error": None,
    }

    balance_match = re.search(
        r'<td[^>]*>\s*Баланс\s*</td>\s*<td[^>]*>\s*<strong[^>]*>(?:<[^>]+>)*\s*([0-9]+(?:[.,][0-9]+)?)',
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if balance_match:
        result["balance"] = float(balance_match.group(1).replace(",", "."))
    else:
        alt_balance = re.search(
            r'<td[^>]*>\s*Баланс\s*</td>\s*<td[^>]*>(?:<[^>]+>)*\s*([0-9]+(?:[.,][0-9]+)?)',
            text,
            re.IGNORECASE | re.DOTALL,
        )
        if alt_balance:
            result["balance"] = float(alt_balance.group(1).replace(",", "."))

    period_match = re.search(
        r'Период услуги:\s*(\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}:\d{2}\s*[-–—]\s*\d{4}\.\d{2}\.\d{2}\s+\d{2}:\d{2}:\d{2})',
        text,
    )
    if period_match:
        result["period"] = period_match.group(1).strip()
    else:
        alt_match = re.search(
            r'Период услуги:\s*(\d{2}:\d{2}:\d{2}\s+\d{2}\.\d{2}\.\d{4}\s*[-–—]\s*\d{2}:\d{2}:\d{2}\s+\d{2}\.\d{2}\.\d{4})',
            text,
        )
        if alt_match:
            result["period"] = alt_match.group(1).strip()

    if result["balance"] is not None or result["period"] is not None:
        result["status"] = "ok"
    else:
        result["error"] = "Не удалось извлечь данные со страницы"

    return result


def parse_pskovline(accounts):
    results = []
    for account in accounts:
        if account.get('login') and account.get('password'):
            results.append(parse_account(account))

    output = {
        "accounts": results,
        "updated_at": datetime.now().isoformat(),
    }

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Сохранено {len(results)} аккаунтов")
    return output


if __name__ == "__main__":
    settings = get_settings()

    if settings.get("is_active") is False:
        print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Интеграция Псковлайн деактивирована, пропуск")
        sys.exit(0)

    # Запуск не чаще раза в день, не раньше заданного времени (cron вызывает каждые 5 минут)
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

    parse_pskovline(settings.get("accounts") or [])
