import { useState } from 'react';

// Плашка согласия на обработку cookie — показывается неавторизованным
// посетителям на всех страницах (вход, витрина, публичные новости).
// Одно согласие на сессию браузера (sessionStorage), стили — .cookie-consent* в index.css.
export function CookieConsent() {
  const [visible, setVisible] = useState(() => {
    try { return sessionStorage.getItem('cookieConsent') !== '1' } catch { return true }
  })

  const dismiss = () => {
    try { sessionStorage.setItem('cookieConsent', '1') } catch { /* ignore */ }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="cookie-consent" role="dialog" aria-label="Согласие на использование cookie">
      <button type="button" className="cookie-consent-close" aria-label="Закрыть" onClick={dismiss}>×</button>
      <p className="cookie-consent-text">
        Используя сайт, вы соглашаетесь на обработку данных в Cookies для корректной работы сайта.{' '}
        <a href="/cookies" className="cookie-consent-more">Подробнее.</a>
      </p>
      <button type="button" className="cookie-consent-btn" onClick={dismiss}>Понятно</button>
    </div>
  )
}
