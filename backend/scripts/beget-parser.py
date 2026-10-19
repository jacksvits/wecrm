#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Парсер данных Beget для виджетов директора (мультитенантный):
- Партнёрский кабинет (cp.beget.com/partnership) — playwright: баланс, рефералы, транзакции
- Личный кабинет — официальный API (api.beget.com): тариф, баланс, дни до блокировки,
  диск, сайты, домены, сервер

Для каждого набора настроек (beget_settings.json) пишет рядом с ним beget.json:
- data/beget_settings.json → data/beget.json (главная организация, платформа)
- data/t-<slug>/beget_settings.json → data/t-<slug>/beget.json (tenant'ы)

Файл настроек — контракт между бэкендом и cron: бэкенд пишет его при сохранении
настроек плагина (см. routes/beget-settings.ts), cron на хосте читает.
Обновление каждого tenant'а — не чаще раза в день, после update_time.
"""
import os
import re
import json
import urllib.request
import urllib.parse
from datetime import datetime

if os.path.isdir("/app/data"):
    DATA_DIR = "/app/data"
else:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
    DATA_DIR = os.path.join(SCRIPT_DIR, "..", "data")

# Креды по умолчанию — ТОЛЬКО для главной организации (историческое поведение)
DEFAULT_LOGIN = "softboeg"
DEFAULT_PASSWORD = "nyBNQofDm96"

BEGET_API_URL = "https://api.beget.com/api/user/getAccountInfo"

# Поля личного кабинета, забираемые из API
API_FIELDS = (
    "plan_name", "user_balance", "user_days_to_block",
    "user_quota", "plan_quota", "user_sites", "plan_site",
    "server_name", "user_domains",
)


def _to_float(s: str) -> float:
    """Преобразует '2 514,54' / '2\xa0514.54' в float (устойчиво к неразрывному пробелу)."""
    return float(s.replace('\xa0', ' ').replace(' ', '').replace(',', '.'))


def log(msg):
    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {msg}", flush=True)


def fetch_account_api(login, password):
    """Данные личного кабинета через официальный API Beget."""
    params = urllib.parse.urlencode({
        "login": login,
        "passwd": password,
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
        return None, (payload.get("error_text") or "Beget API error")
    return payload.get("answer", {}).get("result"), None


def parse_beget(settings, login, password):
    """
    Парсинг партнёрского кабинета (playwright + Xvfb, если включён в настройках)
    + данные личного кабинета через официальный API.
    """
    # Партнёрский кабинет парсится только при включённой галочке «Партнёр»
    partner_enabled = settings.get("is_partner") is not False

    if partner_enabled:
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

    if partner_enabled:
      with sync_playwright() as p:
        # snap-chromium (/usr/bin/chromium-browser) playwright не запускает
        # (требует snap cgroup) — используем браузер из ~/.cache/ms-playwright
        browser = p.chromium.launch(
            headless=False,
            args=['--no-sandbox', '--disable-setuid-sandbox'],
            timeout=30000
        )
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        try:
            # Логин
            page.goto('https://cp.beget.com/login', timeout=60000)
            page.wait_for_timeout(5000)
            page.fill('input[type="text"], input:not([type="password"])', login)
            page.fill('input[type="password"]', password)
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
    api_ok = False
    try:
        api_data, api_error = fetch_account_api(login, password)
        if api_data:
            api_ok = True
            for key in API_FIELDS:
                if key in api_data:
                    result[key] = api_data[key]
        elif api_error:
            msg = str(api_error).lower()
            if "auth" in msg or "password" in msg or "парол" in msg or "невер" in msg or "login" in msg:
                result["error"] = "Неверный логин/пароль Beget, обновите в настройках"
            elif result["error"] is None:
                result["error"] = f"API: {api_error}"
    except Exception as e:
        if result["error"] is None:
            result["error"] = f"API: {e}"

    # Успех: партнёрский баланс ИЛИ данные личного кабинета по API —
    # у tenant'ов без партнёрского кабинета виджет показывает тариф/баланс/диск
    if result["balance"] is not None or api_ok:
        result["status"] = "ok"
    else:
        result["error"] = result["error"] or "Не удалось извлечь данные"
    return result


def collect_one(settings_path, output_path, label, is_main):
    """Сбор для одного tenant'а. True/False — успех/ошибка, None — пропуск."""
    try:
        with open(settings_path, encoding="utf-8") as f:
            settings = json.load(f)
    except FileNotFoundError:
        log(f"{label}: файл настроек не найден, пропуск")
        return None
    except Exception as e:
        log(f"{label}: не удалось прочитать настройки: {e}")
        return False

    if settings.get("is_active") is False:
        log(f"{label}: интеграция деактивирована, пропуск")
        return None

    login = settings.get("login") or (DEFAULT_LOGIN if is_main else None)
    password = settings.get("password") or (DEFAULT_PASSWORD if is_main else None)
    if not login or not password:
        log(f"{label}: логин/пароль не заданы в настройках CRM, пропуск")
        return None

    update_time = settings.get("update_time") or "10:00"
    now = datetime.now()
    try:
        hh, mm = map(int, str(update_time).split(":"))
    except ValueError:
        hh, mm = 10, 0
    scheduled = now.replace(hour=hh, minute=mm, second=0, microsecond=0)
    if now < scheduled:
        log(f"{label}: ранее времени обновления {update_time}, пропуск")
        return None
    try:
        with open(output_path, encoding="utf-8") as f:
            last = datetime.fromisoformat(json.load(f).get("updated_at"))
        if last >= scheduled:
            log(f"{label}: данные уже собраны после {update_time}, пропуск")
            return None
    except Exception:
        pass  # файла ещё нет — собираем

    result = parse_beget(settings, login, password)
    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(result, f, ensure_ascii=False, indent=2)

    if result.get("status") == "ok":
        log(f"{label}: данные успешно обновлены")
    else:
        log(f"{label}: ошибка сбора данных: {result.get('error')}")
    return result.get("status") == "ok"


def main():
    sources = [
        (os.path.join(DATA_DIR, "beget_settings.json"), os.path.join(DATA_DIR, "beget.json"), "main", True),
    ]
    if os.path.isdir(DATA_DIR):
        for entry in sorted(os.listdir(DATA_DIR)):
            sp = os.path.join(DATA_DIR, entry, "beget_settings.json")
            if os.path.isfile(sp):
                sources.append((sp, os.path.join(DATA_DIR, entry, "beget.json"), entry, False))

    ok = True
    for settings_path, output_path, label, is_main in sources:
        try:
            res = collect_one(settings_path, output_path, label, is_main)
            if res is False:
                ok = False
        except SystemExit:
            raise
        except Exception as e:
            log(f"{label}: непредвиденная ошибка: {e}")
            ok = False
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
