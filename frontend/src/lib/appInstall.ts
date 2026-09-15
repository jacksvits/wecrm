// Определение контекста запуска и Google-сервисов для предложения установки APK.
// Три состояния: нативное приложение (Capacitor), TWA (Chrome Custom Tab) или браузер.
// Google-сервисы напрямую из JS не проверяются — используем косвенный признак:
// Web Push на Android-Chrome работает только через FCM, поэтому факт живая подписка
// = сервисы есть, а ошибка «push service» при подписке = сервисов нет.
import { Capacitor } from '@capacitor/core';

export const APK_TWA_URL = '/app-downloads/wecrm-twa.apk';
export const APK_NOGOGLE_URL = '/app-downloads/wecrm-nogoogle.apk';

// Нативное приложение (Capacitor APK без Google-сервисов)
export function isNativeApp(): boolean {
  try { return Capacitor.isNativePlatform(); } catch { return false; }
}

// TWA передаёт referrer вида android-app://<package-name>
export function isTwa(): boolean {
  return document.referrer.startsWith('android-app://cc.welans.wecrm');
}

export function isAndroid(): boolean {
  return /Android/i.test(navigator.userAgent);
}

// Web Push (FCM) работает → Google-сервисы на устройстве есть
export function hasGoogleServices(): boolean {
  return localStorage.getItem('wecrm_push_works') === '1';
}

// Подписка на push падала именно из-за недоступного push-сервиса
export function googleServicesMissing(): boolean {
  return localStorage.getItem('wecrm_push_missing') === '1';
}

export function markPushWorks(): void {
  localStorage.setItem('wecrm_push_works', '1');
  localStorage.removeItem('wecrm_push_missing');
}

export function markPushMissing(): void {
  localStorage.setItem('wecrm_push_missing', '1');
  localStorage.removeItem('wecrm_push_works');
}
