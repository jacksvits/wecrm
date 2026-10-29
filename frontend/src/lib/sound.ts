// Единый плеер звуковых уведомлений (колокольчик, общий чат).
// Раньше каждый компонент создавал свой Audio и молча глотал ошибки play() —
// из-за политики autoplay мобильных браузеров звуки не воспроизводились вообще.
// Разблокировка: первый клик/касание «прогревает» аудио внутри пользовательского
// жеста — после этого браузер разрешает play() и на SSE-событиях.

let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio('/icq-message.mp3');
    audio.preload = 'auto';
    audio.volume = 0.5;
  }
  return audio;
}

// Разблокировка autoplay первым жестом пользователя (iOS Safari / PWA и др.)
export function initSoundUnlock() {
  const unlock = () => {
    const a = getAudio();
    a.play()
      .then(() => { a.pause(); a.currentTime = 0; })
      .catch(() => {});
    window.removeEventListener('pointerdown', unlock);
    window.removeEventListener('keydown', unlock);
    window.removeEventListener('touchstart', unlock);
  };
  window.addEventListener('pointerdown', unlock);
  window.addEventListener('keydown', unlock);
  window.addEventListener('touchstart', unlock);
}

// Звук уведомления. Звенит, пока звук не выключен явно (enabled === false).
export function playNotificationSound(enabled: boolean | undefined) {
  if (enabled === false) return;
  const a = getAudio();
  a.currentTime = 0;
  a.play().catch((e) => console.warn('[sound] play blocked:', e?.name || e));
}
