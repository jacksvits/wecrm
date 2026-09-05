#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Парсер личного кабинета Псковлайн (stat.pskovline.ru)
Сохраняет баланс и период услуги для всех аккаунтов в JSON
"""

import requests
import re
import json
import os
import subprocess
from datetime import datetime

URL = "https://stat.pskovline.ru"

if os.path.isdir("/app/data"):
    OUTPUT_JSON = "/app/data/pskovline.json"
else:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    OUTPUT_JSON = os.path.join(SCRIPT_DIR, "..", "data", "pskovline.json")


def get_settings_from_db():
    """Читаем настройки из БД через psql"""
    try:
        result = subprocess.run(
            ['docker', 'exec', '-i', 'wecrm-db-1', 'psql', '-U', 'crm', '-d', 'wecrm', '-t', '-A', '-c',
             'SELECT label, login, password, label2, login2, password2 FROM pskovline_settings LIMIT 1;'],
            capture_output=True, text=True, timeout=10
        )
        line = result.stdout.strip()
        if '|' in line:
            parts = line.split('|')
            return {
                'accounts': [
                    {'label': parts[0], 'login': parts[1], 'password': parts[2]},
                    {'label': parts[3], 'login': parts[4], 'password': parts[5]},
                ]
            }
    except Exception as e:
        print(f"DB read error: {e}", file=os.sys.stderr)
    return {
        'accounts': [
            {'label': 'Псковлайн', 'login': '91868', 'password': 'e5yvku2a'},
            {'label': 'Псковлайн телефон', 'login': 'upl69777', 'password': 'i9rmh2s9'},
        ]
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
        r'<td[^>]*>\s*Баланс\s*</td>\s*<td[^>]*>\s*<strong[^>]*>([0-9]+(?:[.,][0-9]+)?)</strong>',
        text,
        re.IGNORECASE | re.DOTALL,
    )
    if balance_match:
        result["balance"] = float(balance_match.group(1).replace(",", "."))
    else:
        alt_balance = re.search(
            r'<td[^>]*>\s*Баланс\s*</td>\s*<td[^>]*>\s*([0-9]+(?:[.,][0-9]+)?)',
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


def parse_pskovline():
    settings = get_settings_from_db()
    results = []
    for account in settings['accounts']:
        if account['login'] and account['password']:
            results.append(parse_account(account))

    output = {
        "accounts": results,
        "updated_at": datetime.now().isoformat(),
    }

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(json.dumps(output, ensure_ascii=False))
    return output


if __name__ == "__main__":
    parse_pskovline()
