# -*- coding: utf-8 -*-
r"""
WeCRM Agent — служба Windows 10 для передачи информации о компьютере в WeCRM.

Собирает: систему (ОС, сборка, разрядность), железо (CPU/ОЗУ/диски/видео),
сеть (IP/MAC), список устройств из «Диспетчера устройств» (Win32_PnPEntity)
и периодически отправляет в CRM. Работает как системная служба (LocalSystem),
запускается автоматически, автоматически перезапускается при сбое.

Зависимости: Python 3.9+ (python.org), pywin32 (ставится install.bat).

Конфигурация (HKLM\SOFTWARE\WeCRM\Agent):
  ServerUrl   — https://welans.cc (или поддомен организации)
  ContactKey  — ID контакта формата 000-000-000 из карточки клиента
  DeviceKey   — стабильный идентификатор железа (генерируется при первом старте)
  Token       — токен устройства (выдаёт сервер при первой регистрации)

Управление:
  python agent.py install   — установить службу (от администратора)
  python agent.py remove    — удалить службу
  python agent.py start / stop / debug
"""
import json
import hashlib
import os
import sys
import time
import traceback
import urllib.request
import urllib.error
import winreg

import win32service
import win32serviceutil
import win32event
import servicemanager

AGENT_VERSION = "1.0.0"
SERVICE_NAME = "WecrmAgent"
SERVICE_DISPLAY = "WeCRM Agent (устройства клиентов)"

REPORT_INTERVAL_SEC = 5 * 60     # полный отчёт раз в 5 минут
HEARTBEAT_INTERVAL_SEC = 60      # heartbeat раз в минуту
HTTP_TIMEOUT_SEC = 30

# Журнал работы агента (для диагностики на самом ПК)
LOG_FILE = os.path.join(os.environ.get("ProgramData", r"C:\ProgramData"), "WeCRM", "agent.log")


def log(msg):
    try:
        os.makedirs(os.path.dirname(LOG_FILE), exist_ok=True)
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(time.strftime("%Y-%m-%d %H:%M:%S") + " " + msg + "\n")
    except Exception:
        pass

REG_PATH = r"SOFTWARE\WeCRM\Agent"


# ---------------------------------------------------------------------------
# Конфигурация в реестре (доступна только администраторам — обычный
# пользователь не может подменить адрес сервера или ID контакта)
# ---------------------------------------------------------------------------

def reg_read(name, default=""):
    try:
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, REG_PATH, 0, winreg.KEY_READ) as key:
            val, _ = winreg.QueryValueEx(key, name)
            return str(val)
    except OSError:
        return default


def reg_write(name, value):
    with winreg.CreateKeyEx(winreg.HKEY_LOCAL_MACHINE, REG_PATH, 0,
                            winreg.KEY_SET_VALUE | winreg.KEY_WOW64_64KEY) as key:
        winreg.SetValueEx(key, name, 0, winreg.REG_SZ, str(value))


def load_config():
    return {
        "serverUrl": reg_read("ServerUrl").rstrip("/"),
        "contactKey": reg_read("ContactKey"),
        "deviceKey": reg_read("DeviceKey"),
        "token": reg_read("Token"),
    }


# ---------------------------------------------------------------------------
# Сбор информации о компьютере (WMI)
# ---------------------------------------------------------------------------

def _wmi():
    import win32com.client
    locator = win32com.client.Dispatch("WbemScripting.SWbemLocator")
    return locator.ConnectServer(".", "root\\cimv2")


def _get(wmi, query):
    try:
        return wmi.ExecQuery(query)
    except Exception:
        return []

def _i(value, default=0):
    """WMI возвращает uint64 (размеры дисков, память) строками — приводим к int."""
    try:
        if value is None:
            return default
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return default
        return int(value)
    except (TypeError, ValueError):
        return default


def collect_device_key():
    """Стабильный идентификатор железа: MachineGuid + серийник системного диска."""
    parts = []
    try:
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE,
                            r"SOFTWARE\Microsoft\Cryptography", 0, winreg.KEY_READ) as key:
            parts.append(winreg.QueryValueEx(key, "MachineGuid")[0])
    except OSError:
        pass
    try:
        for d in _get(_wmi(), "SELECT SerialNumber FROM Win32_DiskDrive WHERE Index=0"):
            parts.append(getattr(d, "SerialNumber", "") or "")
            break
    except Exception:
        pass
    raw = "|".join(parts) or os.environ.get("COMPUTERNAME", "unknown")
    return hashlib.sha256(raw.encode("utf-8", "ignore")).hexdigest()[:32]


def collect_info():
    wmi = _wmi()

    def first(query):
        for item in _get(wmi, query):
            return item
        return None

    os_item = first("SELECT Caption, Version, BuildNumber, OSArchitecture, InstallDate, "
                    "LastBootUpTime, TotalVisibleMemorySize FROM Win32_OperatingSystem")
    cs = first("SELECT Manufacturer, Model, UserName, Workgroup, TotalPhysicalMemory "
               "FROM Win32_ComputerSystem")
    cpu = first("SELECT Name, NumberOfCores, NumberOfLogicalProcessors FROM Win32_Processor")
    prod = first("SELECT UUID FROM Win32_ComputerSystemProduct")

    gpus = [getattr(g, "Name", "") for g in _get(wmi, "SELECT Name FROM Win32_VideoController")]
    gpus = [g for g in gpus if g]

    disks = []
    phys = {}
    for d in _get(wmi, "SELECT Index, Model, Size, SerialNumber FROM Win32_DiskDrive"):
        phys[getattr(d, "Index", 0)] = {
            "model": (getattr(d, "Model", "") or "").strip(),
            "serial": (getattr(d, "SerialNumber", "") or "").strip(),
        }
    idx = 0
    for ld in _get(wmi, "SELECT DeviceID, Size, FreeSpace FROM Win32_LogicalDisk WHERE DriveType=3"):
        p = phys.get(idx, {})
        size_gb = _i(getattr(ld, "Size", 0)) // (1024 ** 3)
        free_gb = _i(getattr(ld, "FreeSpace", 0)) // (1024 ** 3)
        disks.append({
            "model": p.get("model", "") or (getattr(ld, "DeviceID", "") or ""),
            "sizeGb": size_gb,
            "freeGb": free_gb,
            "serial": p.get("serial", ""),
        })
        idx += 1

    ip = mac = ""
    for nic in _get(wmi, "SELECT IPAddress, MACAddress FROM Win32_NetworkAdapterConfiguration WHERE IPEnabled=True"):
        ips = getattr(nic, "IPAddress", None)
        if ips and not ip:
            ip = ips[0]
        if getattr(nic, "MACAddress", "") and not mac:
            mac = nic.MACAddress
        if ip and mac:
            break

    # «Диспетчер устройств»: все PnP-устройства
    pnp_devices = []
    for dev in _get(wmi, "SELECT Name, Manufacturer, Status, PNPDeviceID FROM Win32_PnPEntity"):
        pnp_id = (getattr(dev, "PNPDeviceID", "") or "")
        # Класс устройства — первый сегмент PNPDeviceID (ACPI, PCI, USB, ...),
        # как в дереве «Диспетчера устройств»
        cls = pnp_id.split("\\")[0] if "\\" in pnp_id else ""
        pnp_devices.append({
            "class": cls,
            "name": getattr(dev, "Name", "") or "",
            "manufacturer": getattr(dev, "Manufacturer", "") or "",
            "status": getattr(dev, "Status", "") or "",
            "deviceId": pnp_id,
        })
    pnp_devices.sort(key=lambda x: (x["class"], x["name"]))

    def dt(value):
        # WMI-дата: 20261021120000.000000+180 -> ISO
        v = str(value or "")
        if len(v) >= 14:
            return "%s-%s-%sT%s:%s:%s" % (v[0:4], v[4:6], v[6:8], v[8:10], v[10:12], v[12:14])
        return None

    ram_mb = 0
    if cs is not None and _i(getattr(cs, "TotalPhysicalMemory", 0)):
        ram_mb = _i(getattr(cs, "TotalPhysicalMemory", 0)) // (1024 ** 2)
    elif os_item is not None:
        ram_mb = _i(getattr(os_item, "TotalVisibleMemorySize", 0)) // 1024

    username = ""
    if cs is not None and getattr(cs, "UserName", ""):
        username = cs.UserName.split("\\")[-1]

    return {
        "hostname": os.environ.get("COMPUTERNAME", ""),
        "username": username,
        "workgroup": (getattr(cs, "Workgroup", "") or "") if cs is not None else "",
        "osCaption": (getattr(os_item, "Caption", "") or "") if os_item is not None else "",
        "osVersion": (getattr(os_item, "Version", "") or "") if os_item is not None else "",
        "osBuild": (getattr(os_item, "BuildNumber", "") or "") if os_item is not None else "",
        "osArch": (getattr(os_item, "OSArchitecture", "") or "") if os_item is not None else "",
        "osInstallDate": dt(getattr(os_item, "InstallDate", None)) if os_item is not None else None,
        "manufacturer": (getattr(cs, "Manufacturer", "") or "") if cs is not None else "",
        "model": (getattr(cs, "Model", "") or "") if cs is not None else "",
        "serialNumber": (getattr(prod, "UUID", "") or "") if prod is not None else "",
        "cpu": (getattr(cpu, "Name", "") or "").strip() if cpu is not None else "",
        "cpuCores": _i(getattr(cpu, "NumberOfCores", 0)) if cpu is not None else 0,
        "cpuThreads": _i(getattr(cpu, "NumberOfLogicalProcessors", 0)) if cpu is not None else 0,
        "ramTotalMb": ram_mb,
        "disks": disks,
        "pnpDevices": pnp_devices,
        "ipAddress": ip,
        "macAddress": mac,
        "gpu": ", ".join(gpus),
        "lastBootAt": dt(getattr(os_item, "LastBootUpTime", None)) if os_item is not None else None,
        "agentVersion": AGENT_VERSION,
    }


# ---------------------------------------------------------------------------
# HTTP-клиент (только стандартная библиотека)
# ---------------------------------------------------------------------------

def post_json(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=HTTP_TIMEOUT_SEC) as resp:
        body = resp.read().decode("utf-8", "replace")
        return resp.status, json.loads(body) if body else {}


class AgentError(Exception):
    pass


def send_report(cfg):
    if not cfg["serverUrl"] or not cfg["contactKey"]:
        raise AgentError("Не заданы ServerUrl/ContactKey в HKLM\\SOFTWARE\\WeCRM\\Agent")
    payload = {
        "contactKey": cfg["contactKey"],
        "deviceKey": cfg["deviceKey"],
        "token": cfg["token"] or None,
        "info": collect_info(),
    }
    status, body = post_json(cfg["serverUrl"] + "/api/agent/report", payload)
    token = body.get("token")
    if token and token != cfg["token"]:
        reg_write("Token", token)
        cfg["token"] = token
        log("report: registered, token stored")
    log("report: HTTP %s hostname=%s" % (status, payload["info"].get("hostname", "")))
    return status, body


def send_heartbeat(cfg):
    payload = {"deviceKey": cfg["deviceKey"], "token": cfg["token"]}
    status, _ = post_json(cfg["serverUrl"] + "/api/agent/heartbeat", payload)
    return status


# ---------------------------------------------------------------------------
# Служба Windows
# ---------------------------------------------------------------------------

class WecrmAgentService(win32serviceutil.ServiceFramework):
    _svc_name_ = SERVICE_NAME
    _svc_display_name_ = SERVICE_DISPLAY
    _svc_description_ = ("Передаёт в WeCRM информацию о компьютере и системе "
                         "(железо, диски, сеть, диспетчер устройств)")

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.stop_event = win32event.CreateEvent(None, 0, 0, None)

    def SvcStop(self):
        log("service stopped by request")
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        win32event.SetEvent(self.stop_event)

    def SvcDoRun(self):
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, ""),
        )
        self.main()

    def main(self):
        log("service started, agent %s" % AGENT_VERSION)
        cfg = load_config()
        if not cfg["deviceKey"]:
            try:
                cfg["deviceKey"] = collect_device_key()
                reg_write("DeviceKey", cfg["deviceKey"])
            except Exception:
                pass

        next_report = 0.0
        next_heartbeat = 0.0

        while True:
            wait = win32event.WaitForSingleObject(self.stop_event, 1000)
            if wait == win32event.WAIT_OBJECT_0:
                break

            now = time.time()
            if not cfg["serverUrl"] or not cfg["contactKey"]:
                # Конфиг ещё не задан — перечитываем каждые 10 секунд
                cfg = load_config()
                next_report = next_heartbeat = 0.0
                time.sleep(10)
                continue

            try:
                if now >= next_report:
                    send_report(cfg)
                    log("report sent ok")
                    next_report = time.time() + REPORT_INTERVAL_SEC
                    next_heartbeat = time.time() + HEARTBEAT_INTERVAL_SEC
                elif cfg["token"] and now >= next_heartbeat:
                    send_heartbeat(cfg)
                    next_heartbeat = time.time() + HEARTBEAT_INTERVAL_SEC
            except urllib.error.HTTPError as e:
                log("HTTP error %s: %s" % (e.code, e.reason))
                # 4xx — не повторять до следующего цикла отчёта, ошибка в конфиге/токене
                if e.code >= 500:
                    next_report = time.time() + 60
                else:
                    next_report = time.time() + REPORT_INTERVAL_SEC
                time.sleep(30)
            except Exception:
                traceback.print_exc()
                log("ERROR: %s" % traceback.format_exc())
                next_report = time.time() + 60
                time.sleep(30)


def cmd_debug():
    """Одиночный прогон без службы — для проверки в консоли."""
    cfg = load_config()
    if not cfg["deviceKey"]:
        cfg["deviceKey"] = collect_device_key()
        reg_write("DeviceKey", cfg["deviceKey"])
        print("DeviceKey:", cfg["deviceKey"])
    status, body = send_report(cfg)
    print("HTTP", status, body)


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "debug":
        cmd_debug()
    else:
        win32serviceutil.HandleCommandLine(WecrmAgentService)
