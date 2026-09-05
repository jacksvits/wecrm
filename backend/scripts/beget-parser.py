#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Парсер партнёрского кабинета Beget (cp.beget.com/partnership)
Сохраняет баланс, рефералов, транзакции в JSON
"""

import os
import re
import json
import subprocess
from datetime import datetime

if os.path.isdir("/app/data"):
    OUTPUT_JSON = "/app/data/beget.json"
else:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    OUTPUT_JSON = os.path.join(SCRIPT_DIR, "..", "data", "beget.json")


def parse_beget():
    # Запускаем Xvfb
    os.system("pkill Xvfb 2>/dev/null; sleep 1; nohup Xvfb :99 -screen 0 1280x720x24 -ac > /dev/null 2>&1 & sleep 2")
    os.environ['DISPLAY'] = ':99'

    from playwright.sync_api import sync_playwright

    result = {
        "updated_at": datetime.now().isoformat(),
        "balance": None,
        "active_referrals": None,
        "last_transaction": None,
        "last_transaction_amount": None,
        "status": "error",
        "error": None,
    }

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            executable_path='/usr/bin/chromium-browser',
            args=['--no-sandbox', '--disable-setuid-sandbox'],
            timeout=30000
        )
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        try:
            # Логин
            page.goto('https://cp.beget.com/login', timeout=60000)
            page.wait_for_timeout(5000)
            page.fill('input[type="text"], input:not([type="password"])', 'softboeg')
            page.fill('input[type="password"]', 'nyBNQofDm96')
            page.click('button[type="submit"], button')
            page.wait_for_timeout(10000)

            # Partnership
            page.goto('https://cp.beget.com/partnership', timeout=60000)
            page.wait_for_timeout(8000)

            # Извлекаем данные из текста страницы
            text = page.inner_text('body')

            # Баланс
            m = re.search(r'Баланс:\s*([0-9\s]+[.,][0-9]+)\s*₽', text)
            if m:
                result["balance"] = float(m.group(1).replace(' ', '').replace(',', '.'))

            # Активные рефералы
            m = re.search(r'Активные рефералы:\s*(\d+)', text)
            if m:
                result["active_referrals"] = int(m.group(1))

            # Последняя транзакция
            m = re.search(r'Последняя транзакция:\s*(\d{2}\.\d{2}\.\d{4})', text)
            if m:
                result["last_transaction"] = m.group(1)

            # Сумма транзакции
            m = re.search(r'Сумма транзакции:\s*([0-9\s\xa0]+[.,][0-9]+)\s*₽', text)
            if m:
                result["last_transaction_amount"] = float(m.group(1).replace(' ', '').replace('\xa0', '').replace(',', '.'))

            if result["balance"] is not None:
                result["status"] = "ok"
            else:
                result["error"] = "Не удалось извлечь данные"

        except Exception as e:
            result["error"] = str(e)
        finally:
            browser.close()

    # Останавливаем Xvfb
    os.system("pkill Xvfb 2>/dev/null")

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(json.dumps(result, ensure_ascii=False))
    return result


if __name__ == "__main__":
    parse_beget()
