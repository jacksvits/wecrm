import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { useRealtime } from '../hooks/useRealtime';
import { Deal, Contact, Status, Project } from '../types';

export function DealBoard() {
  const [searchParams] = useSearchParams();
  const contactFilter = searchParams.get('contactId') || '';
  const [deals, setDeals] = useState<Deal[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [contactSearch, setContactSearch] = useState('');
  const [showContactDropdown, setShowContactDropdown] = useState(false);
  const contactDropdownRef = useRef<HTMLDivElement>(null);
  // Mobile kanban states — как на странице «Задачи»
  const [isMobile, setIsMobile] = useState(false);
  const [mobileColumnIndex, setMobileColumnIndex] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const defaultStage = statuses.find(s => s.isDefault)?.name || statuses[0]?.name || 'lead';
  const [form, setForm] = useState({ title: '', value: 0, stage: defaultStage, probability: 10, contactId: '', projectId: '' });

  useEffect(() => {
    loadDeals();
    api.contacts.list().then(setContacts);
    api.projects.list().then(setProjects);
    api.statuses.list('deal').then(setStatuses);
  }, [contactFilter]);

  // Закрывать выпадающий список при клике вне его
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (contactDropdownRef.current && !contactDropdownRef.current.contains(event.target as Node)) {
        setShowContactDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const loadDeals = () => {
    let params = new URLSearchParams();
    if (contactFilter) params.set('contactId', contactFilter);
    api.deals.list(params.toString()).then(setDeals);
  };

  useRealtime(['deals'], (data) => {
    if (data.entity === 'deal') loadDeals();
  });

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: '', value: 0, stage: defaultStage, probability: 10, contactId: '', projectId: '' });
    setContactSearch('');
    setShowModal(true);
  };

  const openEdit = (deal: Deal) => {
    setEditingId(deal.id);
    setForm({ title: deal.title, value: deal.value, stage: deal.stage, probability: deal.probability, contactId: deal.contactId || '', projectId: deal.projectId || '' });
    const contact = deal.contact || contacts.find(c => c.id === deal.contactId);
    setContactSearch(contact?.name || '');
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      // при редактировании пустое значение снимает привязку (null), иначе Prisma проигнорирует поле
      await api.deals.update(editingId, { ...form, contactId: form.contactId || null, projectId: form.projectId || null });
    } else {
      // при создании пустые строки заменяем на undefined, чтобы не ловить нарушение внешнего ключа
      await api.deals.create({ ...form, contactId: form.contactId || undefined, projectId: form.projectId || undefined });
    }
    setShowModal(false);
    loadDeals();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить сделку?')) return;
    await api.deals.delete(id);
    loadDeals();
  };

  const dealsByStage = (stage: string) => deals.filter(d => {
    if (contactFilter && d.contactId !== contactFilter) return false;
    return d.stage === stage;
  });

  const getStageLabel = (name: string) => statuses.find(s => s.name === name)?.label || name;

  const getStatusStyle = (name: string) => {
    const s = statuses.find(st => st.name === name);
    return s ? { bg: s.color, text: s.textColor } : { bg: '#f0f0f0', text: '#666' };
  };

  const getDealBackground = (statusColor: string) => {
    const hex = statusColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, 0.08)`;
  };

  const getDealBorderLeft = (statusColor: string) => {
    return `3px solid ${statusColor}`;
  };

  // Группировка сделок по проектам — как группировка задач на странице «Задачи»
  const groupDealsByProject = (stageDeals: Deal[]) => {
    const groups = new Map<string, { name: string; deals: Deal[] }>();
    const noProjectKey = '__no_project__';
    groups.set(noProjectKey, { name: 'Без проекта', deals: [] });
    for (const d of stageDeals) {
      if (d.projectId) {
        const p = projects.find(pr => pr.id === d.projectId);
        const key = d.projectId;
        if (!groups.has(key)) {
          groups.set(key, { name: p?.name || 'Проект', deals: [] });
        }
        groups.get(key)!.deals.push(d);
      } else {
        groups.get(noProjectKey)!.deals.push(d);
      }
    }
    // Пустую группу «Без проекта» не показываем
    if (groups.get(noProjectKey)?.deals.length === 0) {
      groups.delete(noProjectKey);
    }
    return Array.from(groups.entries()).map(([id, g]) => ({ id, ...g }));
  };

  const filteredContacts = contacts.filter(c => {
    if (!contactSearch.trim()) return true;
    const q = contactSearch.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q) ||
      (c.emails || []).some((e: string) => e.toLowerCase().includes(q)) ||
      (c.phones || []).some((p: string) => p.toLowerCase().includes(q))
    );
  });

  const selectedContactName = form.contactId
    ? contacts.find(c => c.id === form.contactId)?.name || '— Контакт —'
    : '— Контакт —';

  // Статусы воронки в порядке сортировки
  const dealStatuses = [...statuses].sort((a, b) => a.sortOrder - b.sortOrder);

  // Mobile: фильтруем пустые колонки и показываем по одной со свайпом
  const nonEmptyStatuses = isMobile
    ? dealStatuses.filter(s => dealsByStage(s.name).length > 0)
    : dealStatuses;

  // Если текущая мобильная колонка исчезла (сделки изменились) — возвращаемся на первую
  useEffect(() => {
    if (mobileColumnIndex >= nonEmptyStatuses.length) {
      setMobileColumnIndex(Math.max(0, nonEmptyStatuses.length - 1));
    }
  }, [nonEmptyStatuses.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchMove = (_e: React.TouchEvent) => {
    // Swipe detection handled in handleTouchEnd
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    const threshold = 50;
    if (diff > threshold && mobileColumnIndex < nonEmptyStatuses.length - 1) {
      setMobileColumnIndex((prev) => prev + 1);
    } else if (diff < -threshold && mobileColumnIndex > 0) {
      setMobileColumnIndex((prev) => prev - 1);
    }
    setTouchStartX(null);
  };

  // Mobile column indicator dots
  const renderMobileIndicator = () => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
        padding: '8px 0',
        width: '100%',
        alignSelf: 'center',
      }}
    >
      {nonEmptyStatuses.map((status, idx) => (
        <button
          key={status.name}
          onClick={() => setMobileColumnIndex(idx)}
          style={{
            width: idx === mobileColumnIndex ? 24 : 8,
            height: 8,
            borderRadius: 4,
            border: 'none',
            background:
              idx === mobileColumnIndex ? status.color : '#d1d5db',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title={status.label}
        />
      ))}
    </div>
  );

  // Mobile current status header
  const renderMobileHeader = () => {
    const status = nonEmptyStatuses[mobileColumnIndex];
    if (!status) return null;
    const count = dealsByStage(status.name).length;
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 12px',
          background: status.color,
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <span style={{ fontSize: 14, fontWeight: 600, color: status.textColor }}>
          {status.label}
        </span>
        <span
          style={{
            fontSize: 12,
            padding: '2px 8px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.25)',
            color: status.textColor,
          }}
        >
          {count}
        </span>
      </div>
    );
  };

  // Карточка сделки в едином стиле со страницей «Задачи»
  const renderDealCard = (deal: Deal) => {
    const st = getStatusStyle(deal.stage);
    return (
      <div key={deal.id} style={{ padding: 14, borderRadius: 14, border: '1px solid var(--border-color)', background: getDealBackground(st.bg), borderLeft: getDealBorderLeft(st.bg), cursor: 'pointer', position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
          <button
            onClick={() => openEdit(deal)}
            title='Изменить'
            style={{
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)',
              color: 'var(--text-color)', cursor: 'pointer',
            }}
          >
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z' />
            </svg>
          </button>
          <button
            onClick={() => handleDelete(deal.id)}
            title='Удалить'
            style={{
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              borderRadius: 8, border: '1px solid var(--border-color)', background: 'var(--bg-card)',
              color: '#dc2626', cursor: 'pointer',
            }}
          >
            <svg width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round' strokeLinejoin='round'>
              <path d='M3 6h18' />
              <path d='M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6' />
              <path d='M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2' />
              <line x1='10' y1='11' x2='10' y2='17' />
              <line x1='14' y1='11' x2='14' y2='17' />
            </svg>
          </button>
        </div>
        <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, paddingRight: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.title}</div>
        <div style={{ fontSize: 14, fontWeight: 500 }}>₽{deal.value.toLocaleString()}</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{deal.project?.name ? `📁 ${deal.project.name} · ` : ''}{deal.contact?.name} · {deal.probability}%</div>
      </div>
    );
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <h2 style={{ margin: 0, fontSize: 18 }}>Воронка продаж</h2>
        <button className="btn-action" onClick={openCreate} title="Создать сделку">+</button>
      </div>
      <div
        style={{ display: 'flex', gap: 12, overflowX: isMobile ? 'hidden' : 'auto', paddingBottom: 8, WebkitOverflowScrolling: 'touch', minHeight: 400, alignItems: 'flex-start', flexDirection: isMobile ? 'column' : 'row' }}
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchMove={isMobile ? handleTouchMove : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
      >
        {isMobile && renderMobileIndicator()}
        {isMobile && renderMobileHeader()}
        {dealStatuses.map(stage => {
          const stageDeals = dealsByStage(stage.name);
          const isEmpty = stageDeals.length === 0;
          const st = getStatusStyle(stage.name);

          // On mobile: skip empty columns entirely
          if (isMobile && isEmpty) return null;

          // On mobile: show only current column
          if (isMobile && stage.name !== nonEmptyStatuses[mobileColumnIndex]?.name)
            return null;

          return (
            <div key={stage.name} style={{ minWidth: isMobile ? '100%' : isEmpty ? 48 : 280, flex: isMobile ? 'none' : isEmpty ? '0 0 auto' : 1, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.2s ease' }}>
              {!isMobile && (
                <div style={{ display: 'flex', justifyContent: isEmpty ? 'center' : 'space-between', alignItems: 'center', padding: isEmpty ? '12px 4px' : '8px 0', background: isEmpty ? stage.color : 'transparent', borderRadius: isEmpty ? 12 : 0, writingMode: isEmpty ? 'vertical-rl' : 'horizontal-tb', textOrientation: isEmpty ? 'mixed' : 'initial', minHeight: isEmpty ? 120 : 'auto' }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: isEmpty ? stage.textColor : 'inherit', letterSpacing: isEmpty ? '0.05em' : 'normal' }}>{stage.label}</span>
                  {!isEmpty && (
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 10, background: stage.color, color: stage.textColor }}>{stageDeals.length}</span>
                  )}
                </div>
              )}
              {!isEmpty && (
                isMobile ? (
                  // На мобильном сделки группируются по проектам — как задачи
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {groupDealsByProject(stageDeals).map((group) => (
                      <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', padding: '4px 8px', background: 'var(--bg-input)', borderRadius: 8 }}>
                          {group.name} ({group.deals.length})
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {group.deals.map(renderDealCard)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {stageDeals.map(renderDealCard)}
                  </div>
                )
              )}
            </div>
          );
        })}
      </div>
      {isMobile && deals.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 14 }}>
          Сделки не найдены
        </div>
      )}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'max(16px, env(safe-area-inset-top, 0)) max(16px, env(safe-area-inset-right, 0)) max(16px, env(safe-area-inset-bottom, 0)) max(16px, env(safe-area-inset-left, 0))' }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, maxHeight: '90vh', overflow: 'auto' }}>
            <h3 style={{ margin: '0 0 16px' }}>{editingId ? 'Редактировать сделку' : 'Новая сделка'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder='Название' value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
              <input type='number' placeholder='Сумма' value={form.value || ''} onChange={e => setForm({ ...form, value: Number(e.target.value) })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
              <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }}>
                {statuses.map(s => <option key={s.name} value={s.name}>{s.label}</option>)}
              </select>
              <input type='number' placeholder='Вероятность %' min={0} max={100} value={form.probability} onChange={e => setForm({ ...form, probability: Number(e.target.value) })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14 }} />
              {/* Поле поиска контакта с выпадающим списком */}
              <div ref={contactDropdownRef} style={{ position: 'relative' }}>
                <input
                  placeholder='Поиск контакта...'
                  value={contactSearch}
                  onChange={e => {
                    setContactSearch(e.target.value);
                    setShowContactDropdown(true);
                    if (!e.target.value) setForm({ ...form, contactId: '' });
                  }}
                  onFocus={() => setShowContactDropdown(true)}
                  style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14, width: '100%', boxSizing: 'border-box' }}
                />
                {form.contactId && (
                  <div style={{ marginTop: 4, fontSize: 12, color: 'var(--text-muted)' }}>
                    Выбрано: {selectedContactName}
                  </div>
                )}
                {showContactDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: 'calc(100% + 4px)',
                    left: 0,
                    right: 0,
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 12,
                    maxHeight: 200,
                    overflow: 'auto',
                    zIndex: 300,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                  }}>
                    {filteredContacts.length === 0 ? (
                      <div style={{ padding: 10, fontSize: 13, color: 'var(--text-muted)' }}>Ничего не найдено</div>
                    ) : (
                      filteredContacts.map(c => (
                        <div
                          key={c.id}
                          onClick={() => {
                            setForm({ ...form, contactId: c.id });
                            setContactSearch(c.name);
                            setShowContactDropdown(false);
                          }}
                          style={{
                            padding: '8px 10px',
                            cursor: 'pointer',
                            fontSize: 13,
                            borderBottom: '1px solid var(--border-color)',
                            background: form.contactId === c.id ? 'rgba(0,0,0,0.05)' : undefined
                          }}
                        >
                          <div style={{ fontWeight: 500 }}>{c.name}</div>
                          {(c.phone || c.email) && (
                            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{[c.phone, c.email].filter(Boolean).join(' · ')}</div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
              {/* Выбор проекта — только доступные для выбора (не заблокированные) */}
              <select value={form.projectId} onChange={e => setForm({ ...form, projectId: e.target.value })} style={{ padding: 10, borderRadius: 12, border: '1px solid var(--border-color)', fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                <option value="">— Проект —</option>
                {projects.filter(p => p.isLocked !== true).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type='button' onClick={() => setShowModal(false)} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>Отмена</button>
                <button type='submit' style={{ padding: '8px 16px', borderRadius: 12, border: 'none', background: '#1a1a1a', color: '#fff', cursor: 'pointer' }}>{editingId ? 'Сохранить' : 'Создать'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
