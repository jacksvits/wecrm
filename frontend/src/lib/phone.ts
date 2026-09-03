/**
 * Применяет маску ввода +7 (XXX) XXX-XX-XX по мере набора
 */
export function formatPhoneInput(value: string): string {
  if (!value) return '';
  // Удаляем всё кроме цифр и +
  let digits = value.replace(/[^\d+]/g, '');

  // Нормализуем начало: +7, 7, 8 → одна логика
  if (digits.startsWith('+7')) {
    digits = digits.slice(2);
  } else if (digits.startsWith('7') || digits.startsWith('8')) {
    digits = digits.slice(1);
  }

  const match = digits.match(/^(\d{0,3})(\d{0,3})(\d{0,2})(\d{0,2})$/);
  if (!match) return value;

  const [, g1, g2, g3, g4] = match;
  let result = '+7';
  if (g1) result += ` (${g1}`;
  if (g1.length === 3) result += ')';
  if (g2) {
    if (g1.length === 3) result += ` ${g2}`;
    else result += g2;
  }
  if (g3) {
    if (g2.length === 3) result += `-${g3}`;
    else result += g3;
  }
  if (g4) result += `-${g4}`;

  return result;
}

/**
 * Нормализует телефон для хранения: +79876543221
 */
export function normalizePhone(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 0) return '';
  if (digits.startsWith('8')) return '+7' + digits.slice(1);
  if (digits.startsWith('7')) return '+7' + digits.slice(1);
  return '+7' + digits;
}

/**
 * Форматирует для отображения: +7 (987) 654-32-21
 */
export function displayPhone(value: string): string {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  const match = digits.match(/^7?(\d{3})(\d{3})(\d{2})(\d{2})$/);
  if (match) {
    return `+7 (${match[1]}) ${match[2]}-${match[3]}-${match[4]}`;
  }
  return value;
}
