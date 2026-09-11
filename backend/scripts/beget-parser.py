#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Парсер данных Beget для виджетов директора:
- Партнёрский кабинет (cp.beget.com/partnership) — playwright: баланс, рефералы, транзакции
- Личный кабинет — официальный API (api.beget.com): тариф, баланс, дни до блокировки,
  диск, сайты, домены, сервер
Сохраняет всё в JSON
"""

import os
import re
import json
import urllib.request
import urllib.parse
from datetime import datetime

if os.path.isdir("/app/data"):
    OUTPUT_JSON = "/app/data/beget.json"
else:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    OUTPUT_JSON = os.path.join(SCRIPT_DIR, "..", "data", "beget.json")

BEGET_API_URL = "https://api.beget.com/api/user/getAccountInfo"
SETTINGS_JSON = os.path.join(os.path.dirname(OUTPUT_JSON), "beget_settings.json")


def _load_settings():
    try:
        with open(SETTINGS_JSON, encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


_settings = _load_settings()
if _settings.get("is_active") is False:
    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] Интеграция Beget деактивирована, пропуск")
    raise SystemExit(0)

# Креды берутся из настроек плагина (синхронизируются бэкендом), иначе — дефолтные
BEGET_LOGIN = _settings.get("login") or "softboeg"
BEGET_PASSWORD = _settings.get("password") or "nyBNQofDm96"

# Поля личного кабинета, забираемые из API
API_FIELDS = (
    "plan_name", "user_balance", "user_days_to_block",
    "user_quota", "plan_quota", "user_sites", "plan_site",
    "server_name", "user_domains",
)


def _to_float(s: str) -> float:
    """Преобразует '2 514,54' / '2\xa0514.54' в float (устойчиво к неразрывному пробелу)."""
    return float(s.replace('\xa0', ' ').replace(' ', '').replace(',', '.'))


def fetch_account_api():
    """Данные личного кабинета через официальный API Beget."""
    params = urllib.parse.urlencode({
        "login": BEGET_LOGIN,
        "passwd": BEGET_PASSWORD,
        "output_format": "json",
    })
    req = urllib.request.Request(
        BEGET_API_URL,
        data=params.encode("utf-8"),
        headers={"Content-Type": "application/x-www-form-urlencoded"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        payload = json.loads(resp.read().decode("utf-8"))
    if payload.get("status") != "success":
        return None
    return payload.get("answer", {}).get("result")


def parse_beget():
    # Запускаем Xvfb
    os.system("pkill Xvfb 2>/dev/null; sleep 1; nohup Xvfb :99 -screen 0 1280x720x24 -ac > /dev/null 2>&1 & sleep 2")
    os.environ['DISPLAY'] = ':99'

    from playwright.sync_api import sync_playwright

    result = {
        "updated_at": datetime.now().isoformat(),
        "balance": None,
        "partner_balance": None,
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
            page.fill('input[type="text"], input:not([type="password"])', BEGET_LOGIN)
            page.fill('input[type="password"]', BEGET_PASSWORD)
            page.click('button[type="submit"], button')
            page.wait_for_timeout(10000)

            # Partnership
            page.goto('https://cp.beget.com/partnership', timeout=60000)
            page.wait_for_timeout(8000)

            # Извлекаем данные из текста страницы
            text = page.inner_text('body')

            # Баланс
            m = re.search(r'Баланс:\s*([0-9\s\xa0]+[.,][0-9]+)\s*₽', text)
            if m:
                try:
                    result["balance"] = _to_float(m.group(1))
                    result["partner_balance"] = result["balance"]
                except ValueError:
                    pass

            # Активные рефералы
            m = re.search(r'Активные рефералы:\s*(\d+)', text)
            if m:
                try:
                    result["active_referrals"] = int(m.group(1))
                except ValueError:
                    pass

            # Последняя транзакция
            m = re.search(r'Последняя транзакция:\s*(\d{2}\.\d{2}\.\d{4})', text)
            if m:
                result["last_transaction"] = m.group(1)

            # Сумма транзакции
            m = re.search(r'Сумма транзакции:\s*([0-9\s\xa0]+[.,][0-9]+)\s*₽', text)
            if m:
                try:
                    result["last_transaction_amount"] = _to_float(m.group(1))
                except ValueError:
                    pass

        except Exception as e:
            result["error"] = str(e)
        finally:
            browser.close()

    # Останавливаем Xvfb
    os.system("pkill Xvfb 2>/dev/null")

    # Данные личного кабинета через API (партнёрский баланс не перезаписываем)
    try:
        api_data = fetch_account_api()
        if api_data:
            for key in API_FIELDS:
                if key in api_data:
                    result[key] = api_data[key]
    except Exception as e:
        if result["error"] is None:
            result["error"] = f"API: {e}"

    if result["balance"] is not None:
        result["status"] = "ok"
    else:
        result["error"] = result["error"] or "Не удалось извлечь данные"

    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    print(json.dumps(result, ensure_ascii=False))
    return result


if __name__ == "__main__":
    parse_beget()
