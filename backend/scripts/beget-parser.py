#!/usr/bin/env python3
# -*- coding: utf-8 -*-
# Парсер/сборщик данных интеграции Beget для weCRM.
#
# Мультитенантный: обрабатывает КАЖДЫЙ файл настроек beget_settings.json —
# главный (data/beget_settings.json, платформа) и тенантские
# (data/t-<slug>/beget_settings.json, синхронизируются бэкендом при сохранении
# настроек плагина) — и пишет результат рядом с настройками в beget.json.
# Файл настроек = контракт между бэкендом и cron: пароль читается только
# отсюда, в git не попадает. Cron на хосте читает этот файл.
# Обновление каждого tenant'а — не чаще раза в день, после update_time.

import os
import re
import json
import urllib.request
import urllib.parse
from datetime import datetime

if os.path.isdir("/app/data"):
    DATA_DIR = "/app/data"
else:
    DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "data")

# Креды по умолчанию — ТОЛЬКО для главной организации (историческое поведение)
DEFAULT_LOGIN = "softboeg"
DEFAULT_PASSWORD = "nyBNQofDm96"

BEGET_API_URL = "https://api.beget.com/api/user/getAccountInfo"
API_FIELDS = [
    ("balance", "Баланс"),
    ("bonus", "Бонусы"),
    ("days_to_block", "Дней до блокировки"),
]


def _to_float(s):
    if s is None:
        return 0.0
    s = re.sub(r"[^\d.,\-]", "", str(s)).replace(",", ".")
    try:
        return float(s)
    except ValueError:
        return 0.0


def log(msg):
    print(f"[{datetime.now():%Y-%m-%d %H:%M:%S}] {msg}", flush=True)


def fetch_account_api(login, password):
    """Данные лицевого счёта через официальный API Beget (основной источник)."""
    body = urllib.parse.urlencode({
        "login": login,
        "passwd": password,
        "output_format": "json",
    }).encode("utf-8")
    req = urllib.request.Request(BEGET_API_URL, data=body)
    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        if data.get("status") == "error":
            msg = (data.get("error_text") or "").lower()
            # Неверные креды — обновление пароля в настройках, без тревоги
            if "auth" in msg or "password" in msg or "неверный" in msg or "login" in msg:
                return {"status": "ok", "error": "Неверный логин/пароль Beget, обновите в настройках"}
            return {"status": "error", "error": data.get("error_text") or "Beget API error"}
        info = data.get("answer", {}).get("status", {})
        return {
            "status": "ok",
            "updated_at": datetime.now().isoformat(),
            "fields": [
                {"label": label, "value": _to_float(info.get(key))}
                for key, label in API_FIELDS
            ],
        }
    except Exception as e:
        return {"status": "error", "error": str(e)}


def parse_beget(settings, login, password):
    """
    Парсинг данных Beget из личного кабинета (playwright + xvfb-run)
    и партнёрского кабинета (если включено в настройках).
    """
    from playwright.sync_api import sync_playwright

    partner_enabled = settings.get("is_partner") is not False  # по умолчанию — да
    cookies = None

    try:
        from beget_cabinet import parse_beget_cabinet

        cookies = parse_beget_cabinet(login, password)
    except ImportError:
        log("Модуль beget_cabinet.py не найден — основной кабинет пропущен")
    except Exception as e:
        log(f"Ошибка парсинга основного кабинета: {e}")

    result = {
        "status": "ok",
        "updated_at": datetime.now().isoformat(),
        "fields": [],
        "partner": None,
        "tables": [],
    }

    # Партнёрский кабинет (playwright + xvfb-run, переключатель «Партнёр» в настройках)
    if partner_enabled:
        partner_login = settings.get("partner_login") or login
        partner_password = settings.get("partner_password") or password
        try:
            from beget_partner_cabinet import parse_beget_partner_cabinet

            partner_data = parse_beget_partner_cabinet(partner_login, partner_password, cookies)
            if partner_data:
                result["partner"] = partner_data.get("partner")
                result["tables"] = partner_data.get("tables") or []
        except ImportError:
            log("Модуль beget_partner_cabinet.py не найден — партнёрский кабинет пропущен")
        except Exception as e:
            log(f"Ошибка парсинга партнёрского кабинета: {e}")

    if not result["partner"] and not result["tables"] and not cookies:
        result["status"] = "error"
        result["error"] = "Не удалось получить данные ни из одного кабинета"
    return result


def collect_one(settings_path, output_path, label, is_main):
    """Сбор данных для одного набора настроек; True/False — успех, None — пропуск."""
    try:
        with open(settings_path, encoding="utf-8") as fh:
            settings = json.load(fh)
    except FileNotFoundError:
        log(f"{label}: файл настроек не найден ({settings_path}), пропуск")
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
        log(f"{label}: ежедневное обновление запланировано на {update_time}, пропуск")
        return None
    try:
        with open(output_path, encoding="utf-8") as fh:
            last = datetime.fromisoformat(json.load(fh).get("updated_at"))
        if last >= scheduled:
            log(f"{label}: данные уже актуальны (обновлены {last:%d.%m.%Y %H:%M}), пропуск")
            return None
    except Exception:
        pass

    result = parse_beget(settings, login, password)
    out_dir = os.path.dirname(output_path)
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(result, fh, ensure_ascii=False, indent=1)
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
