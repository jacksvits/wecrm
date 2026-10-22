// Форматирование дат/времени в часовом поясе пользователя.
// Личный пояс задаётся в настройках профиля (поле timezone у User, IANA-имя зоны).
// Когда личный пояс не выбран — используется СИСТЕМНЫЙ пояс организации
// (задаётся в настройках системы, подставляется из /api/branding при старте),
// если и он не задан — UTC.

let systemTimezone: string | null = null;

/** Системный часовой пояс организации (вызывается из AuthContext после /api/branding) */
export function setSystemTimezone(tz: string | null): void {
  systemTimezone = tz || null;
}

/** Эффективный пояс: личный → системный организации → UTC */
export function getEffectiveTimezone(personal?: string | null): string {
  return personal || systemTimezone || 'UTC';
}

const DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

// Отображение даты/времени: «21 окт 2026, 18:30». Невалидное значение → пустая строка.
export function formatDateTime(
  value: string | Date | null | undefined,
  timezone?: string | null,
): string {
  if (!value) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (isNaN(d.getTime())) return '';
  try {
    return d.toLocaleString('ru-RU', { ...DATE_TIME_OPTIONS, timeZone: getEffectiveTimezone(timezone) });
  } catch {
    return d.toLocaleString('ru-RU', { ...DATE_TIME_OPTIONS, timeZone: 'UTC' });
  }
}

// Смещение часового пояса (минуты) в указанный момент: wall-time(tz) − UTC
function tzOffsetMinutes(timezone: string, date: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value || 0);
  const wallUTC = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'), get('second'));
  return Math.round((wallUTC - Math.floor(date.getTime() / 1000) * 1000) / 60000);
}

// Серверная UTC-метка → значение для input[type=datetime-local] (местное время часового пояса)
export function toDateTimeLocalValue(
  iso: string | null | undefined,
  timezone?: string | null,
): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: getEffectiveTimezone(timezone),
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(d);
    const get = (type: string) => parts.find((p) => p.type === type)?.value || '';
    return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`;
  } catch {
    return iso.slice(0, 16);
  }
}

// Значение input[type=datetime-local] (местное время часового пояса) → серверная UTC-метка
export function fromDateTimeLocalValue(
  value: string | null | undefined,
  timezone?: string | null,
): string | undefined {
  if (!value) return undefined;
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
  if (!m) return undefined;
  const asUTC = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]));
  return new Date(asUTC.getTime() - tzOffsetMinutes(getEffectiveTimezone(timezone), asUTC) * 60000).toISOString();
}

// Текущие дата/время браузера в формате input[type=datetime-local]
export function nowDateTimeLocalValue(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}
