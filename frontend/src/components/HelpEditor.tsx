import { useEffect, useState } from 'react' ;
import { useNavigate, useParams } from 'react-router-dom' ;
import ReactQuill from 'react-quill' ;
import 'react-quill/dist/quill.snow.css' ;
import { useAuth } from '../hooks/useAuth' ;
import { api } from '../api/client' ;
import { HelpBlock } from '../lib/helpContent' ;
import { isMainPlatformHost } from './TenantSwitcher' ;

// WYSIWYG-редактор — та же конфигурация, что и в остальных текстовых полях проекта
const quillModules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
} ;
const quillFormats = ['bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link'] ;

const SECTIONS = ['Начало работы', 'Функции', 'Интеграции'] ;
const MASCOTS = [
  { value: '', label: 'Без маскота' },
  { value: '/mascot/mascot.png', label: 'Стоит' },
  { value: '/mascot/mascot_hero.png', label: 'Герой' },
  { value: '/mascot/mascot_point.png', label: 'Указывает' },
  { value: '/mascot/mascot_shield.png', label: 'Со щитом' },
  { value: '/mascot/mascot_wave.png', label: 'Машет' },
] ;

const BLOCK_TYPES: { value: HelpBlock['type'] ; label: string }[] = [
  { value: 'p', label: 'Параграф' },
  { value: 'h', label: 'Подзаголовок' },
  { value: 'steps', label: 'Шаги' },
  { value: 'ul', label: 'Список' },
  { value: 'tip', label: 'Совет' },
] ;

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--border-color)',
  fontSize: 14, outline: 'none', background: 'var(--bg-card)', color: 'var(--text-primary)', boxSizing: 'border-box',
} ;
const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 4, display: 'block',
} ;
const btn = (bg: string): React.CSSProperties => ({
  padding: '8px 16px', borderRadius: 10, border: 'none', background: bg, color: '#fff',
  fontSize: 14, cursor: 'pointer',
}) ;

function emptyBlock(type: HelpBlock['type']): HelpBlock {
  if (type === 'steps' || type === 'ul') return { type, items: [''] } ;
  return { type, text: '' } as HelpBlock ;
}

// === Редактор статьи справки — только для главного администратора платформы ===
export function HelpEditor() {
  const { slug } = useParams() ;
  const isNew = !slug ;
  const navigate = useNavigate() ;
  const { user } = useAuth() as any ;

  const [loading, setLoading] = useState(!isNew) ;
  const [saving, setSaving] = useState(false) ;
  const [error, setError] = useState('') ;
  const [form, setForm] = useState({ slug: '', title: '', section: SECTIONS[1], descr: '', mascot: '/mascot/mascot.png', position: 99 }) ;
  const [blocks, setBlocks] = useState<HelpBlock[]>([{ type: 'p', text: '' }]) ;
  // Текстовое представление пунктов списков (по строке на пункт) для блоков steps/ul
  const [itemDrafts, setItemDrafts] = useState<Record<number, string>>({}) ;

  const canEdit = !!user && user.role === 'admin' && isMainPlatformHost() ;

  useEffect(() => {
    if (isNew) return ;
    api.help.list()
      .then((list) => {
        const a = (list as any[]).find(x => x.slug === slug) ;
        if (!a) { setError('Статья не найдена') ; return ; }
        setForm({ slug: a.slug, title: a.title, section: a.group, descr: a.desc || '', mascot: a.mascot || '', position: a.position ?? 99 }) ;
        setBlocks(a.blocks || []) ;
        const drafts: Record<number, string> = {} ;
        (a.blocks || []).forEach((b: HelpBlock, i: number) => {
          if (b.type === 'steps' || b.type === 'ul') drafts[i] = b.items.join('\n') ;
        }) ;
        setItemDrafts(drafts) ;
      })
      .catch((e) => setError('Ошибка загрузки: ' + e.message))
      .finally(() => setLoading(false)) ;
  }, [slug]) ;

  if (!canEdit) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 16px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Редактирование справки доступно только главному администратору платформы.
      </div>
    ) ;
  }

  const setBlock = (i: number, b: HelpBlock) => {
    const next = [...blocks] ; next[i] = b ; setBlocks(next) ;
  } ;
  const moveBlock = (i: number, dir: -1 | 1) => {
    const j = i + dir ;
    if (j < 0 || j >= blocks.length) return ;
    const next = [...blocks] ; [next[i], next[j]] = [next[j], next[i]] ;
    setBlocks(next) ;
    const d = { ...itemDrafts } ; [d[i], d[j]] = [d[j] ?? '', d[i] ?? ''] ; setItemDrafts(d) ;
  } ;
  const removeBlock = (i: number) => {
    setBlocks(blocks.filter((_, x) => x !== i)) ;
    const d: Record<number, string> = {} ;
    Object.entries(itemDrafts).forEach(([k, v]) => {
      const n = Number(k) ;
      if (n < i) d[n] = v ; else if (n > i) d[n - 1] = v ;
    }) ;
    setItemDrafts(d) ;
  } ;
  const changeType = (i: number, type: HelpBlock['type']) => {
    const prev = blocks[i] as any ;
    let nb: HelpBlock ;
    if (type === 'steps' || type === 'ul') {
      const text = prev.text || itemDrafts[i] || '' ;
      nb = { type, items: text.split('\n').map((s: string) => s.trim()).filter(Boolean) } ;
      if ((nb as any).items.length === 0) (nb as any).items = [''] ;
      setItemDrafts({ ...itemDrafts, [i]: (nb as any).items.join('\n') }) ;
    } else {
      const text = prev.text ?? itemDrafts[i]?.replace(/\n/g, '<br>') ?? '' ;
      nb = { type, text } as HelpBlock ;
    }
    setBlock(i, nb) ;
  } ;

  const collectBlocks = (): HelpBlock[] => blocks.map((b, i) => {
    if (b.type === 'steps' || b.type === 'ul') {
      const items = (itemDrafts[i] ?? b.items.join('\n')).split('\n').map(s => s.trim()).filter(Boolean) ;
      return { type: b.type, items } ;
    }
    return b ;
  }).filter(b => {
    if (b.type === 'steps' || b.type === 'ul') return b.items.length > 0 ;
    return (((b as { text?: string }).text) || '').replace(/<[^>]*>/g, '').trim().length > 0 ;
  }) ;

  const save = async () => {
    setError('') ;
    const payload = { ...form, mascot: form.mascot || null, position: Number(form.position) || 0, blocks: collectBlocks() } ;
    if (!payload.slug || !/^[a-z0-9][a-z0-9-]{1,60}$/.test(payload.slug)) { setError('Адрес: строчные латинские буквы, цифры и дефис (минимум 2 символа)') ; return ; }
    if (payload.title.trim().length < 2) { setError('Укажите заголовок статьи') ; return ; }
    if (payload.blocks.length === 0) { setError('Добавьте хотя один блок с содержимым') ; return ; }
    setSaving(true) ;
    try {
      const res = isNew ? await api.help.create(payload) : await api.help.update(slug!, payload) ;
      navigate(`/help/${res.slug}`) ;
    } catch (e: any) {
      setError(e.message || 'Ошибка сохранения') ;
    } finally {
      setSaving(false) ;
    }
  } ;

  const remove = async () => {
    if (!confirm('Удалить статью безвозвратно?')) return ;
    try {
      await api.help.remove(slug!) ;
      navigate('/help') ;
    } catch (e: any) {
      setError(e.message || 'Ошибка удаления') ;
    }
  } ;

  const reset = async () => {
    if (!confirm('Вернуть исходный текст статьи? Ваши правки будут потеряны.')) return ;
    try {
      const a = await api.help.reset(slug!) ;
      setForm({ slug: a.slug, title: a.title, section: a.group, descr: a.desc || '', mascot: a.mascot || '', position: a.position ?? 99 }) ;
      setBlocks(a.blocks || []) ;
      const drafts: Record<number, string> = {} ;
      (a.blocks || []).forEach((b: HelpBlock, i: number) => {
        if (b.type === 'steps' || b.type === 'ul') drafts[i] = b.items.join('\n') ;
      }) ;
      setItemDrafts(drafts) ;
      setError('') ;
      alert('Статья возвращена к исходному тексту') ;
    } catch (e: any) {
      setError(e.message || 'Ошибка сброса') ;
    }
  } ;

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>Загрузка...</div> ;

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 16px' }}>
      <button
        onClick={() => navigate(isNew ? '/help' : `/help/${slug}`)}
        style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', padding: 0, marginBottom: 14 }}
      >
        ← {isNew ? 'Все статьи справки' : 'К статье'}
      </button>

      <h1 style={{ margin: '0 0 16px', fontSize: 22 }}>{isNew ? 'Новая статья справки' : 'Редактирование статьи'}</h1>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: '#fee2e2', color: '#b91c1c', fontSize: 13, marginBottom: 14 }}>{error}</div>
      )}

      {/* Основные поля */}
      <div style={{
        padding: '16px 20px', borderRadius: 16, border: '1px solid var(--border-color)',
        background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 16,
      }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label style={labelStyle}>Заголовок</label>
            <input style={inputStyle} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Например: Задачи" />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Адрес (slug)</label>
            <input style={inputStyle} value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase() })} placeholder="tasks" />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={labelStyle}>Раздел</label>
            <select style={inputStyle} value={form.section} onChange={e => setForm({ ...form, section: e.target.value })}>
              {SECTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ width: 110 }}>
            <label style={labelStyle}>Порядок</label>
            <input style={inputStyle} type="number" min={0} max={9999} value={form.position} onChange={e => setForm({ ...form, position: Number(e.target.value) })} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Короткое описание (в карточке оглавления)</label>
          <input style={inputStyle} value={form.descr} onChange={e => setForm({ ...form, descr: e.target.value })} placeholder="О чём эта статья, одним предложением" />
        </div>
        <div>
          <label style={labelStyle}>Маскот в шапке статьи</label>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {MASCOTS.map(m => (
              <button
                key={m.value}
                type="button"
                onClick={() => setForm({ ...form, mascot: m.value })}
                title={m.label}
                style={{
                  width: 64, height: 64, borderRadius: 12, cursor: 'pointer', background: 'var(--bg-color, var(--bg-card))',
                  border: form.mascot === m.value ? '2px solid var(--accent-color, #16a34a)' : '1px solid var(--border-color)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                  color: 'var(--text-secondary)', fontSize: 11,
                }}
              >
                {m.value ? <img src={m.value} alt={m.label} style={{ height: 56, objectFit: 'contain' }} /> : '—'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Блоки содержимого */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
        {blocks.map((b, i) => (
          <div key={i} style={{
            padding: '14px 16px', borderRadius: 14, border: '1px solid var(--border-color)', background: 'var(--bg-card)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <select
                value={b.type}
                onChange={e => changeType(i, e.target.value as HelpBlock['type'])}
                style={{ ...inputStyle, width: 'auto', padding: '6px 10px', fontSize: 13 }}
              >
                {BLOCK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <span style={{ flex: 1 }} />
              <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} title="Выше" style={{ ...btn('transparent'), color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '4px 10px' }}>↑</button>
              <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} title="Ниже" style={{ ...btn('transparent'), color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '4px 10px' }}>↓</button>
              <button type="button" onClick={() => removeBlock(i)} title="Удалить блок" style={{ ...btn('transparent'), color: '#dc2626', border: '1px solid var(--border-color)', padding: '4px 10px' }}>✕</button>
            </div>

            {(b.type === 'p' || b.type === 'tip') && (
              <ReactQuill
                theme="snow"
                value={b.text}
                onChange={(html) => setBlock(i, { type: b.type, text: html } as HelpBlock)}
                modules={quillModules}
                formats={quillFormats}
                placeholder={b.type === 'tip' ? 'Текст совета...' : 'Текст параграфа...'}
              />
            )}
            {b.type === 'h' && (
              <input
                style={inputStyle}
                value={b.text}
                onChange={e => setBlock(i, { type: 'h', text: e.target.value })}
                placeholder="Текст подзаголовка"
              />
            )}
            {(b.type === 'steps' || b.type === 'ul') && (
              <textarea
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical', fontFamily: 'inherit' }}
                value={itemDrafts[i] ?? b.items.join('\n')}
                onChange={e => setItemDrafts({ ...itemDrafts, [i]: e.target.value })}
                placeholder={'По одному пункту на строку' + (b.type === 'steps' ? ' — будут пронумерованы' : '')}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {BLOCK_TYPES.map(t => (
          <button
            key={t.value}
            type="button"
            onClick={() => setBlocks([...blocks, emptyBlock(t.value)])}
            style={{ ...btn('transparent'), color: 'var(--text-primary)', border: '1px dashed var(--border-color)' }}
          >+ {t.label}</button>
        ))}
      </div>

      {/* Действия */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button onClick={save} disabled={saving} style={{ ...btn('#16a34a'), opacity: saving ? 0.6 : 1 }}>
          {saving ? 'Сохранение...' : 'Сохранить статью'}
        </button>
        {!isNew && (
          <>
            <button onClick={reset} style={{ ...btn('transparent'), color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
              Вернуть по умолчанию
            </button>
            <button onClick={remove} style={{ ...btn('transparent'), color: '#dc2626', border: '1px solid var(--border-color)' }}>
              Удалить статью
            </button>
          </>
        )}
      </div>
    </div>
  ) ;
}
