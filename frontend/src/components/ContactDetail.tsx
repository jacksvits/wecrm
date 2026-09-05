import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { Contact, Task, Deal } from '../types';
import { useAuth } from '../context/AuthContext';
import { displayPhone } from '../lib/phone';

interface ContactType {
  id: string;
  name: string;
  label: string;
  color: string;
  textColor: string;
  sortOrder: number;
  isActive: boolean;
}

const kindLabels: Record<string, string> = {
  contact: 'Контакт',
  organization: 'Организация',
};

const kindColors: Record<string, { bg: string; text: string }> = {
  contact: { bg: '#e3f2fd', text: '#1565c0' },
  organization: { bg: '#e8f5e9', text: '#2e7d32' },
};

export function ContactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [contact, setContact] = useState<Contact | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'tasks' | 'deals' | 'projects'>('info');
  const [loading, setLoading] = useState(true);
  const [contactTypes, setContactTypes] = useState<ContactType[]>([]);

  useEffect(() => {
    api.contactTypes.list().then(setContactTypes).catch(() => {});
  }, []);

  const getTypeLabel = (name: string) => contactTypes.find(t => t.name === name)?.label || name;
  const getTypeColor = (name: string) => {
    const t = contactTypes.find(t => t.name === name);
    return t ? { bg: t.color, text: t.textColor } : { bg: '#f5f5f5', text: '#999' };
  };
  const canEdit = user?.role === 'admin' || user?.role === 'manager';

  useEffect(() => {
    if (!id) return;
    api.contacts.get(id).then((data) => {
      setContact(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div style={{ padding: 40, textAlign: 'center' }}>Загрузка...</div>;
  if (!contact) return <div style={{ padding: 40, textAlign: 'center' }}>Контакт не найден</div>;

  const tc = getTypeColor(contact.type);
  const kc = kindColors[contact.kind] || kindColors.contact;

  const contactTasks = (contact as any).tasks as Task[] || [];
  const contactDeals = (contact as any).deals as Deal[] || [];
  const employees = (contact as any).employees as Contact[] || [];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {contact.avatarUrl ? <img src={contact.avatarUrl} alt={contact.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} onError={(e) => { e.currentTarget.style.display = 'none'; }} /> : <div style={{ width: 48, height: 48, borderRadius: '50%', background: tc.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 600, color: tc.text }}>{contact.name.charAt(0)}</div>}
          <div>
            <h2 style={{ margin: 0, fontSize: 20 }}>{contact.name}</h2>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{ padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 500, background: kc.bg, color: kc.text }}>{kindLabels[contact.kind] || contact.kind}</span>
              <span>{contact.company || '—'}</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {canEdit && (
            <button onClick={() => navigate(`/contacts`, { state: { editingId: id } })} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 14 }}>✏️ Редактировать</button>
          )}
          <button onClick={() => navigate('/contacts')} style={{ padding: '8px 16px', borderRadius: 12, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer', fontSize: 14 }}>← Назад</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border-color)' }}>
        {[{ key: 'info' as const, label: 'Основная информация' }, { key: 'tasks' as const, label: `Задачи (${contact._count?.tasks || 0})` }, { key: 'deals' as const, label: `Сделки (${contact._count?.deals || 0})` }, { key: 'projects' as const, label: `Проекты (${contact.projects?.length || 0})` }].map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{ padding: '10px 20px', border: 'none', borderBottom: activeTab === tab.key ? '2px solid #1565c0' : '2px solid transparent', background: 'transparent', color: activeTab === tab.key ? '#1565c0' : 'var(--text-muted)', fontWeight: activeTab === tab.key ? 600 : 400, cursor: 'pointer', fontSize: 14, transition: 'all 0.15s' }}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'info' && (
        <div style={{ display: 'grid', gap: 12, maxWidth: 600 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Вид</span>
            <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500, background: kc.bg, color: kc.text, justifySelf: 'start' }}>{kindLabels[contact.kind] || contact.kind}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Тип</span>
            <span style={{ padding: '2px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500, background: tc.bg, color: tc.text, justifySelf: 'start' }}>{getTypeLabel(contact.type)}</span>
          </div>

          {contact.kind === 'organization' && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>ИНН</span>
                <span style={{ fontSize: 14 }}>{contact.inn || '—'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>ОГРН</span>
                <span style={{ fontSize: 14 }}>{contact.ogrn || '—'}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Юр. адрес</span>
                <span style={{ fontSize: 14 }}>{contact.legalAddress || '—'}</span>
              </div>
            </>
          )}

          {contact.kind === 'contact' && contact.position && (
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Должность</span>
              <span style={{ fontSize: 14 }}>{contact.position}</span>
            </div>
          )}

          {contact.kind === 'contact' && contact.organization && (
            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Организация</span>
              <span onClick={() => navigate(`/contacts/${contact.organization!.id}`)} style={{ fontSize: 14, color: '#1565c0', cursor: 'pointer', fontWeight: 500 }}>{contact.organization.name}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Компания</span>
            <span style={{ fontSize: 14 }}>{contact.company || '—'}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Телефоны</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {contact.phones?.filter(Boolean).map((p, i) => <span key={i} style={{ fontSize: 14 }}>{displayPhone(p)}</span>) || <span style={{ fontSize: 14 }}>{displayPhone(contact.phone || '') || '—'}</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Email</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {contact.emails?.filter(Boolean).map((e, i) => <span key={i} style={{ fontSize: 14 }}>{e}</span>) || <span style={{ fontSize: 14 }}>{contact.email || '—'}</span>}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f0f0f0' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Теги</span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {contact.tags?.length > 0 ? contact.tags.map(tag => <span key={tag} style={{ padding: '3px 10px', borderRadius: 10, fontSize: 11, background: 'var(--bg-body)', color: 'var(--text-muted)' }}>{tag}</span>) : <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>—</span>}
            </div>
          </div>

          {contact.kind === 'organization' && employees.length > 0 && (
            <div style={{ marginTop: 8, padding: 16, background: 'var(--bg-body)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, marginBottom: 12, fontSize: 14 }}>Контакты в организации ({employees.length})</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {employees.map(emp => (
                  <div key={emp.id} onClick={() => navigate(`/contacts/${emp.id}`)} style={{ padding: 10, borderRadius: 10, border: '1px solid var(--border-color)', cursor: 'pointer', background: 'var(--bg-card)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 500, fontSize: 14 }}>{emp.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{emp.position || '—'} {emp.phone ? '· ' + displayPhone(emp.phone) : ''}</div>
                    </div>
                    <span style={{ fontSize: 12, color: '#1565c0' }}>→</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {contact.notes && (
            <div style={{ marginTop: 8, padding: 16, background: 'var(--bg-body)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Примечания</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }} dangerouslySetInnerHTML={{ __html: contact.notes }} />
            </div>
          )}
          {contact.description && (
            <div style={{ marginTop: 8, padding: 16, background: 'var(--bg-body)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Описание из MAX</div>
              <div style={{ fontSize: 14, lineHeight: 1.6 }}>{contact.description}</div>
            </div>
          )}
          {contact.maxUserId && (
            <div style={{ marginTop: 8, padding: 16, background: 'var(--bg-body)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>MAX ID</div>
              <div style={{ fontSize: 14 }}>{contact.maxUserId}</div>
            </div>
          )}
          {contact.lastActivityTime && (
            <div style={{ marginTop: 8, padding: 16, background: 'var(--bg-body)', borderRadius: 12, border: '1px solid var(--border-color)' }}>
              <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 14 }}>Последний раз в MAX</div>
              <div style={{ fontSize: 14 }}>{new Date(contact.lastActivityTime).toLocaleString('ru-RU')}</div>
            </div>
          )}
      </div>
      )}

      {activeTab === 'tasks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contactTasks.length > 0 ? contactTasks.map((task) => (
            <div key={task.id} onClick={() => navigate(`/tasks/${task.id}`)} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--border-color)', cursor: 'pointer', background: 'var(--bg-card)', transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{task.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>Статус: {task.status}</span>
                <span>Приоритет: {task.priority}</span>
                {task.dueDate && <span>Срок: {new Date(task.dueDate).toLocaleString('ru-RU', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' })}</span>}
              </div>
            </div>
          )) : <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Нет задач</div>}
        </div>
      )}

      {activeTab === 'deals' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contactDeals.length > 0 ? contactDeals.map((deal) => (
            <div key={deal.id} onClick={() => navigate(`/deals?contactId=${contact.id}`)} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--border-color)', cursor: 'pointer', background: 'var(--bg-card)', transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{deal.title}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <span>Сумма: ₽{(deal.value || 0).toLocaleString()}</span>
                <span>Этап: {deal.stage}</span>
              </div>
            </div>
          )) : <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Нет сделок</div>}
        </div>
      )}

      {activeTab === 'projects' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contact.projects && contact.projects.length > 0 ? contact.projects.map((cp) => (
            <div key={cp.project.id} onClick={() => navigate(`/projects?highlight=${cp.project.id}`)} style={{ padding: 14, borderRadius: 12, border: '1px solid var(--border-color)', cursor: 'pointer', background: 'var(--bg-card)', transition: 'background 0.15s' }} onMouseEnter={(e) => e.currentTarget.style.background = '#fafafa'} onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-card)'}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{cp.project.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Статус: {cp.project.status}</div>
            </div>
          )) : <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>Нет проектов</div>}
        </div>
      )}
    </div>
  );
}
