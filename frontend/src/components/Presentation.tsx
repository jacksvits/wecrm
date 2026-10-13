import { useCallback, useEffect, useState, type TouchEvent } from 'react'
import { useBrandLogo } from '../lib/branding'

/* Публичная страница презентации возможностей WeLANS CRM.
   Слайды лежат в public/pres-slides/slide-N.png (рендер из .pptd).
   Открывается без авторизации по ссылке «Презентация» на странице входа. */
const SLIDE_COUNT = 7
const SLIDES = Array.from({ length: SLIDE_COUNT }, (_, i) => `/pres-slides/slide-${i + 1}.png`)

export function Presentation() {
  const brandLogo = useBrandLogo(true)
  const [index, setIndex] = useState(0)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const prev = useCallback(() => setIndex(i => (i - 1 + SLIDE_COUNT) % SLIDE_COUNT), [])
  const next = useCallback(() => setIndex(i => (i + 1) % SLIDE_COUNT), [])

  useEffect(() => {
    document.title = 'Презентация — WeLANS CRM'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [prev, next])

  // Предзагрузка соседних слайдов, чтобы переключение было мгновенным
  useEffect(() => {
    ;[index + 1, index - 1].forEach(i => {
      const img = new Image()
      img.src = SLIDES[(i + SLIDE_COUNT) % SLIDE_COUNT]
    })
  }, [index])

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX === null) return
    const dx = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(dx) > 50) (dx > 0 ? prev : next)()
    setTouchStartX(null)
  }

  return (
    <div className="pres-page">
      <header className="pres-header">
        <a href="/" className="pres-brand">
          <img src={brandLogo} alt="WeLANS CRM" className="pres-logo" />
        </a>
        <nav className="pres-nav">
          <a href="/" className="pres-nav-link">Вход</a>
          <a href="/register" className="pres-nav-cta">Регистрация организации</a>
        </nav>
      </header>

      <main
        className="pres-stage"
        onTouchStart={e => setTouchStartX(e.changedTouches[0].clientX)}
        onTouchEnd={onTouchEnd}
      >
        <button className="pres-arrow pres-arrow-left" onClick={prev} aria-label="Предыдущий слайд">‹</button>
        <img src={SLIDES[index]} alt={`Слайд ${index + 1}`} className="pres-slide" draggable={false} />
        <button className="pres-arrow pres-arrow-right" onClick={next} aria-label="Следующий слайд">›</button>
      </main>

      <footer className="pres-footer">
        <div className="pres-dots">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              className={`pres-dot${i === index ? ' active' : ''}`}
              onClick={() => setIndex(i)}
              aria-label={`Слайд ${i + 1}`}
            />
          ))}
        </div>
        <span className="pres-counter">{index + 1} / {SLIDE_COUNT}</span>
        <a href="/register" className="pres-cta">Подключить организацию</a>
      </footer>
    </div>
  )
}
