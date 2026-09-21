import { User, Task, Contact, Deal, Project, Activity, DashboardStats, DashboardMetricSetting, Role, Status, Comment, EmailSettings, EmailFilter, EmailFilterLog, ChatMessage, FileAttachment, TelephonySettings, Call, WebCall, NovofonEmployee, TaskFinances, TaskTransaction, SmsMessage, Note, Reminder, AutoReplyTrigger, Product, ProductCategory, ProductImage, Warehouse, PriceType, StockMovement, PriceHistory, FinanceDocument, BankPayment, AccountingRule, AccountingEmailSettings, AccountingAnalytics, ReconciliationResponse } from '../types'; const API_URL = ''; function getToken() { return localStorage.getItem('token'); } async function downloadBlob(url: string, filename: string) { const res = await fetch(`${API_URL}${url}`, { headers: { ...(getToken() ? { 'X-Auth-Token': getToken()! } : {}) } }); if (res.status === 401) { localStorage.removeItem('token'); window.location.reload(); throw new Error('Unauthorized'); } if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `HTTP ${res.status}`); } const blob = await res.blob(); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = filename; document.body.appendChild(link); link.click(); document.body.removeChild(link); URL.revokeObjectURL(link.href); } async function fetchApi(path: string, options?: RequestInit) { const res = await fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(getToken() ? { 'X-Auth-Token': getToken()! } : {}), ...options?.headers, }, }); if (res.status === 401) { localStorage.removeItem('token'); window.location.reload(); throw new Error('Unauthorized'); } if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `HTTP ${res.status}`); } return res.json(); } export const api = { auth: { login: (login: string, password: string) => fetchApi('/api/auth/login', { method: 'POST', body: JSON.stringify({ login, password }) }), register: (email: string, password: string, name: string, username?: string) => fetchApi('/api/auth/register', { method: 'POST', body: JSON.stringify({ email, password, name, username }) }), me: (): Promise<User> => fetchApi('/api/auth/me'), impersonate: (userId: string) => fetchApi('/api/auth/impersonate', { method: 'POST', body: JSON.stringify({ userId }) }), stopImpersonation: () => fetchApi('/api/auth/stop-impersonation', { method: 'POST' }), }, tasks: {
    markSpam: (id: string): Promise<{ filterCreated: boolean; message?: string }> => fetchApi(`/api/tasks/${id}/mark-spam`, { method: 'POST' }), list: (params?: string): Promise<Task[]> => fetchApi(`/api/tasks${params ? `?${params}` : ''}`), get: (id: string): Promise<Task> => fetchApi(`/api/tasks/${id}`), history: (id: string) => fetchApi(`/api/tasks/${id}/history`), exportPdf: (id: string) => downloadBlob(`/api/tasks/${id}/export/pdf`, `wecrm-zadacha-${id}.pdf`), create: (data: Partial<Task>) => fetchApi('/api/tasks', { method: 'POST', body: JSON.stringify(data) }), update: (id: string, data: Partial<Task>) => fetchApi(`/api/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), delete: (id: string) => fetchApi(`/api/tasks/${id}`, { method: 'DELETE' }), files: { list: (id: string, path?: string): Promise<{name: string; size: number; createdAt: string; isDirectory?: boolean}[]> => fetchApi(`/api/tasks/${id}/files${path ? `?path=${encodeURIComponent(path)}` : ''}`), upload: (id: string, formData: FormData) => fetch(`/api/tasks/${id}/files`, { method: 'POST', headers: { 'X-Auth-Token': getToken()! }, body: formData }).then(r => r.json()), delete: (id: string, filename: string) => fetchApi(`/api/tasks/${id}/files/${encodeURIComponent(filename)}`, { method: 'DELETE' }), download: (id: string, filename: string) => fetch(`${API_URL}/api/tasks/${id}/files/${encodeURIComponent(filename)}/download`, { headers: { 'X-Auth-Token': getToken()! } }), }, }, yandex: { getSettings: () => fetchApi('/api/yandex/settings'), saveSettings: (data: { apiKey: string }) => fetchApi('/api/yandex/settings', { method: 'POST', body: JSON.stringify(data) }) }, dgis: { getSettings: () => fetchApi('/api/dgis/settings'), saveSettings: (data: { apiKey?: string; isActive?: boolean }) => fetchApi('/api/dgis/settings', { method: 'POST', body: JSON.stringify(data) }) }, reservations: { list: () => fetchApi('/api/reservations'), create: (data: any) => fetchApi('/api/reservations', { method: 'POST', body: JSON.stringify(data) }), update: (id: string, data: any) => fetchApi(`/api/reservations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), delete: (id: string) => fetchApi(`/api/reservations/${id}`, { method: 'DELETE' }), issue: (id: string) => fetchApi(`/api/reservations/${id}/issue`, { method: 'POST' }), downloadPdf: (id: string, number: number) => downloadBlob(`/api/reservations/${id}/pdf`, `rezerv-${String(number).padStart(6, '0')}.pdf`), share: (id: string, taskId: string) => fetchApi(`/api/reservations/${id}/share`, { method: 'POST', body: JSON.stringify({ taskId }) }), },
  sales: { list: () => fetchApi('/api/sales'), create: (data: any) => fetchApi('/api/sales', { method: 'POST', body: JSON.stringify(data) }), update: (id: string, data: any) => fetchApi(`/api/sales/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), downloadPdf: (id: string, number: number) => downloadBlob(`/api/sales/${id}/pdf`, `nakladnaya-${String(number).padStart(6, '0')}.pdf`) }, contacts: { list: (params?: string): Promise<Contact[]> => fetchApi(`/api/contacts${params ? `?${params}` : ''}`),
    get: (id: string): Promise<Contact> => fetchApi(`/api/contacts/${id}`), create: (data: Partial<Contact>) => fetchApi('/api/contacts', { method: 'POST', body: JSON.stringify(data) }), update: (id: string, data: Partial<Contact>) => fetchApi(`/api/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), delete: (id: string) => fetchApi(`/api/contacts/${id}`, { method: 'DELETE' }),
    merge: (targetId: string, sourceIds: string[]) => fetchApi('/api/contacts/merge', { method: 'POST', body: JSON.stringify({ targetId, sourceIds }) }),
    changeKind: (ids: string[], kind: 'contact' | 'organization'): Promise<{ success: boolean; updated: number }> => fetchApi('/api/contacts/bulk-kind', { method: 'POST', body: JSON.stringify({ ids, kind }) }),
    checkDuplicates: (data: any): Promise<{ duplicates: any[] }> => fetchApi('/api/contacts/check-duplicates', { method: 'POST', body: JSON.stringify(data) }),
    mergeNew: (targetId: string, data: any): Promise<Contact> => fetchApi('/api/contacts/merge-new', { method: 'POST', body: JSON.stringify({ targetId, data }) }),
    import: (format: 'vcf' | 'csv' | 'xlsx', data: string) => fetchApi('/api/contacts/import', { method: 'POST', body: JSON.stringify({ format, data }) }),
}, deals: { list: (params?: string): Promise<Deal[]> => fetchApi(`/api/deals${params ? `?${params}` : ''}`), create: (data: Partial<Deal>) => fetchApi('/api/deals', { method: 'POST', body: JSON.stringify(data) }), update: (id: string, data: Partial<Deal>) => fetchApi(`/api/deals/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), delete: (id: string) => fetchApi(`/api/deals/${id}`, { method: 'DELETE' }), }, projects: { list: (params?: string): Promise<Project[]> => fetchApi(`/api/projects${params ? `?${params}` : ''}`), get: (id: string): Promise<Project> => fetchApi(`/api/projects/${id}`), create: (data: Partial<Project>) => fetchApi('/api/projects', { method: 'POST', body: JSON.stringify(data) }), update: (id: string, data: Partial<Project>) => fetchApi(`/api/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), delete: (id: string) => fetchApi(`/api/projects/${id}`, { method: 'DELETE' }), }, dashboard: { stats: (): Promise<DashboardStats> => fetchApi('/api/dashboard/stats'), activities: (): Promise<Activity[]> => fetchApi('/api/dashboard/activities'), layout: (): Promise<DashboardMetricSetting[]> => fetchApi('/api/dashboard/layout'), saveLayout: (items: Array<{ metricKey: string; visible: boolean }>) => fetchApi('/api/dashboard/layout', { method: 'PUT', body: JSON.stringify({ items }) }), }, users: { list: (): Promise<User[]> => fetchApi('/api/users'), create: (data: { email: string; password: string; name: string; roleId?: string }) => fetchApi('/api/users', { method: 'POST', body: JSON.stringify(data) }), update: (id: string, data: Partial<User>) => fetchApi(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), delete: (id: string) => fetchApi(`/api/users/${id}`, { method: 'DELETE' }), resetPassword: (id: string, password: string) => fetchApi(`/api/users/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) }),
    online: () => fetchApi('/api/users/online'),
    heartbeat: () => fetchApi('/api/users/heartbeat', { method: 'POST' }),
    uploadAvatar: (image: string) => fetchApi('/api/users/avatar', { method: 'POST', body: JSON.stringify({ image }) }),
    deleteAvatar: () => fetchApi('/api/users/avatar', { method: 'DELETE' }), }, roles: { list: (): Promise<Role[]> => fetchApi('/api/roles'), create: (data: Partial<Role>) => fetchApi('/api/roles', { method: 'POST', body: JSON.stringify(data) }), update: (id: string, data: Partial<Role>) => fetchApi(`/api/roles/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), delete: (id: string) => fetchApi(`/api/roles/${id}`, { method: 'DELETE' }), }, statuses: { list: (entityType?: string): Promise<Status[]> => fetchApi(`/api/statuses${entityType ? `?entityType=${entityType}` : ''}`), create: (data: Partial<Status>) => fetchApi('/api/statuses', { method: 'POST', body: JSON.stringify(data) }), update: (id: string, data: Partial<Status>) => fetchApi(`/api/statuses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }), delete: (id: string) => fetchApi(`/api/statuses/${id}`, { method: 'DELETE' }), }, profile: { get: (): Promise<User> => fetchApi('/api/profile'), update: (data: Partial<User>) => fetchApi('/api/profile', { method: 'PATCH', body: JSON.stringify(data) }), changePassword: (currentPassword: string, newPassword: string) => fetchApi('/api/profile/change-password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }), }, comments: { list: (taskId: string): Promise<Comment[]> => fetchApi(`/api/tasks/${taskId}/comments`), create: (taskId: string, content: string, attachmentIds?: string[], isInternal?: boolean) => fetchApi(`/api/tasks/${taskId}/comments`, { method: 'POST', body: JSON.stringify({ content, attachmentIds, isInternal }) }), delete: (taskId: string, commentId: string) => fetchApi(`/api/tasks/${taskId}/comments/${commentId}`, { method: 'DELETE' }), }, push: { vapidKey: () => fetchApi('/api/push/vapid-public-key'), subscribe: (data: any) => fetchApi('/api/push/subscribe', { method: 'POST', body: JSON.stringify(data) }), unsubscribe: (data: any) => fetchApi('/api/push/unsubscribe', { method: 'POST', body: JSON.stringify(data) }), }, emailSettings: { get: (): Promise<EmailSettings | null> => fetchApi('/api/email-settings'), save: (data: Partial<EmailSettings> & { imapPass?: string }) => fetchApi('/api/email-settings', { method: 'POST', body: JSON.stringify(data) }), delete: () => fetchApi('/api/email-settings', { method: 'DELETE' }), }, chat: { list: (afterId?: string): Promise<ChatMessage[]> => fetchApi(`/api/chat${afterId ? `?afterId=${afterId}` : ''}`), listPage: async (beforeId?: string): Promise<{ messages: ChatMessage[]; hasMore: boolean }> => { const res = await fetch(`/api/chat${beforeId ? `?beforeId=${encodeURIComponent(beforeId)}` : ''}`, { headers: { ...(getToken() ? { 'X-Auth-Token': getToken()! } : {}) } }); if (res.status === 401) { localStorage.removeItem('token'); window.location.reload(); throw new Error('Unauthorized'); } if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || `HTTP ${res.status}`); } const messages = await res.json(); return { messages, hasMore: res.headers.get('X-Chat-Has-More') === 'true' }; }, send: (content: string, replyToId?: string, recipientIds?: string[], attachmentIds?: string[]) => fetchApi('/api/chat', { method: 'POST', body: JSON.stringify({ content, replyToId, recipientIds, attachmentIds }) }), markAsRead: (messageId: string) => fetchApi(`/api/chat/${messageId}/read`, { method: 'POST' }), delete: (id: string) => fetchApi(`/api/chat/${id}`, { method: 'DELETE' }), react: (messageId: string, emoji: string) => fetchApi(`/api/chat/${messageId}/react`, { method: 'POST', body: JSON.stringify({ emoji }) }), }, uploads: { list: (entityType: string, entityId: string): Promise<FileAttachment[]> => fetchApi(`/api/uploads?entityType=${entityType}&entityId=${entityId}`), upload: (file: File, entityType: string, entityId: string, kind?: string) => { const form = new FormData(); form.append('file', file); form.append('entityType', entityType); form.append('entityId', entityId); if (kind) form.append('kind', kind); return fetch(`${API_URL}/api/uploads`, { method: 'POST', headers: { ...(getToken() ? { 'X-Auth-Token': getToken()! } : {}) }, body: form, }).then(r => { if (!r.ok) throw new Error('Upload failed'); return r.json(); }); }, delete: (id: string) => fetchApi(`/api/uploads/${id}`, { method: 'DELETE' }), },
  telephony: {
    getSettings: (): Promise<TelephonySettings | null> => fetchApi('/api/telephony/settings'),
    saveSettings: (data: Partial<TelephonySettings>) => fetchApi('/api/telephony/settings', { method: 'POST', body: JSON.stringify(data) }),
    getCalls: (params?: string): Promise<{ calls: Call[]; total: number }> => fetchApi(`/api/telephony/calls${params ? `?${params}` : ''}`),
    updateCall: (id: string, data: Partial<Call>) => fetchApi(`/api/telephony/calls/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    callback: (phone: string, employeeId?: number) => fetchApi('/api/telephony/callback', { method: 'POST', body: JSON.stringify({ phone, employeeId }) }),
    getEmployees: (): Promise<NovofonEmployee[]> => fetchApi('/api/telephony/employees'),
    downloadRecord: (callId: string) => `${API_URL}/api/telephony/records/${callId}/download`,
    getSms: (params?: string): Promise<{ items: SmsMessage[]; total: number }> => fetchApi(`/api/telephony/sms${params ? `?${params}` : ''}`),
    getWebRtcKey: (): Promise<{ key: string; sip: string }> => fetchApi('/api/telephony/webrtc/key'),
    testConnection: (): Promise<{ ok: boolean; employees?: number; error?: string }> => fetchApi('/api/telephony/test', { method: 'POST' }),
  },
  notifications: {
    list: (limit?: number): Promise<{ items: any[]; unreadCount: number }> => fetchApi(`/api/notifications?limit=${limit || 5}`),
    markRead: (id: string) => fetchApi(`/api/notifications/${id}/read`, { method: 'PATCH' }),
    markAllRead: () => fetchApi('/api/notifications/read-all', { method: 'POST' }),
    deleteAll: () => fetchApi('/api/notifications', { method: 'DELETE' }),
  },
  max: {
    getSettings: () => fetchApi('/api/max/settings'),
    saveSettings: (data: any) => fetchApi('/api/max/settings', { method: 'POST', body: JSON.stringify(data) }),
    sendMessage: (chatId: string, text: string) => fetchApi('/api/max/send', { method: 'POST', body: JSON.stringify({ chatId, text }) }),
    getMyChat: () => fetchApi('/api/max/my-chat'),
    linkChat: (chatId: string) => fetchApi('/api/max/link-chat', { method: 'POST', body: JSON.stringify({ chatId }) }),
  },
  telegram: {
    getSettings: () => fetchApi('/api/telegram/settings'),
    saveSettings: (data: any) => fetchApi('/api/telegram/settings', { method: 'POST', body: JSON.stringify(data) }),
    sendMessage: (chatId: string, text: string) => fetchApi('/api/telegram/send', { method: 'POST', body: JSON.stringify({ chatId, text }) }),
    getMyChat: () => fetchApi('/api/telegram/my-chat'),
    getChats: () => fetchApi('/api/telegram/chats'),
    linkChat: (chatId: string) => fetchApi('/api/telegram/link-chat', { method: 'POST', body: JSON.stringify({ chatId }) }),
  },
  vpn: {
    getSettings: () => fetchApi('/api/vpn/settings'),
    saveSettings: (data: { isActive: boolean; subscriptionUrl?: string }) => fetchApi('/api/vpn/settings', { method: 'POST', body: JSON.stringify(data) }),
    test: (): Promise<{ ok: boolean; servers: number; telegramReachable: boolean }> => fetchApi('/api/vpn/test', { method: 'POST' }),
  },
  beget: {
    account: () => fetchApi('/api/beget/account'),
    domains: () => fetchApi('/api/beget/domains'),
  },
  tochkaPlugin: {
    get: () => fetchApi('/api/tochka-plugin'),
    save: (data: { updateIntervalMinutes?: number }) => fetchApi('/api/tochka-plugin', { method: 'POST', body: JSON.stringify(data) }),
  },
  oneCPlugin: {
    get: () => fetchApi('/api/onec-plugin'),
    save: (data: any) => fetchApi('/api/onec-plugin', { method: 'POST', body: JSON.stringify(data) }),
    test: (data?: any) => fetchApi('/api/onec-plugin/test', { method: 'POST', body: JSON.stringify(data ?? {}) }),
    sync: () => fetchApi('/api/onec-plugin/sync', { method: 'POST' }),
    pruneCategories: () => fetchApi('/api/onec-plugin/prune-categories', { method: 'POST' }),
  },
  pskovlinePlugin: {
    get: () => fetchApi('/api/pskovline-plugin'),
    save: (data: any) => fetchApi('/api/pskovline-plugin', { method: 'POST', body: JSON.stringify(data) }),
  },
  diadocPlugin: {
    get: (): Promise<any> => fetchApi('/api/diadoc-plugin'),
    save: (data: any) => fetchApi('/api/diadoc-plugin', { method: 'POST', body: JSON.stringify(data) }),
    test: (data?: any) => fetchApi('/api/diadoc-plugin/test', { method: 'POST', body: JSON.stringify(data ?? {}) }),
    selectBox: (boxId: string) => fetchApi('/api/diadoc-plugin/box', { method: 'POST', body: JSON.stringify({ boxId }) }),
    documents: (type: 'inbound' | 'outbound' | 'requireSignature'): Promise<{ items: any[] }> =>
      fetchApi(`/api/diadoc-plugin/documents?type=${type}`),
    downloadDocument: (messageId: string, entityId: string, fileName: string) =>
      downloadBlob(`/api/diadoc-plugin/documents/${messageId}/${entityId}/content`, fileName || 'document'),
    counteragents: (): Promise<{ items: any[] }> => fetchApi('/api/diadoc-plugin/counteragents'),
    send: (data: { toBoxId?: string; inn?: string; kpp?: string; fileName: string; contentBase64: string }) =>
      fetchApi('/api/diadoc-plugin/send', { method: 'POST', body: JSON.stringify(data) }),
    sign: (data: { messageId: string; entityId: string; confirmCode?: string }): Promise<any> =>
      fetchApi('/api/diadoc-plugin/sign', { method: 'POST', body: JSON.stringify(data) }),
  },
  begetSettings: {
    get: () => fetchApi('/api/beget-settings'),
    save: (data: { login?: string; password?: string; isActive: boolean; isPartner?: boolean; updateTime?: string }) =>
      fetchApi('/api/beget-settings', { method: 'POST', body: JSON.stringify(data) }),
  },
  news: {
    list: (query?: string) => fetchApi(`/api/news${query ? '?' + query : ''}`),
    get: (id: string) => fetchApi(`/api/news/${id}`),
    create: (data: any) => fetchApi('/api/news', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`/api/news/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/api/news/${id}`, { method: 'DELETE' }),
    drafts: () => fetchApi('/api/news/drafts'),
    pinned: () => fetchApi('/api/news/pinned'),
    categories: () => fetchApi('/api/news/categories/list'),
    createCategory: (data: any) => fetchApi('/api/news/categories', { method: 'POST', body: JSON.stringify(data) }),
    updateCategory: (id: string, data: any) => fetchApi(`/api/news/categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteCategory: (id: string) => fetchApi(`/api/news/categories/${id}`, { method: 'DELETE' }),
    createSubcategory: (data: any) => fetchApi('/api/news/subcategories', { method: 'POST', body: JSON.stringify(data) }),
    updateSubcategory: (id: string, data: any) => fetchApi(`/api/news/subcategories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteSubcategory: (id: string) => fetchApi(`/api/news/subcategories/${id}`, { method: 'DELETE' }),
    tags: () => fetchApi('/api/news/tags/list'),
    createTag: (data: any) => fetchApi('/api/news/tags', { method: 'POST', body: JSON.stringify(data) }),
    updateTag: (id: string, data: any) => fetchApi(`/api/news/tags/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteTag: (id: string) => fetchApi(`/api/news/tags/${id}`, { method: 'DELETE' }),
    history: (id: string) => fetchApi(`/api/news/${id}/history`),
    restoreHistory: (id: string, historyId: string) => fetchApi(`/api/news/${id}/history/${historyId}/restore`, { method: 'POST' }),
    setReaction: (id: string, type: 'like' | 'dislike' | null) => fetchApi(`/api/news/${id}/reaction`, { method: 'POST', body: JSON.stringify({ type }) }),
    comments: (id: string) => fetchApi(`/api/news/${id}/comments`),
    addComment: (id: string, content: string) => fetchApi(`/api/news/${id}/comments`, { method: 'POST', body: JSON.stringify({ content }) }),
    deleteComment: (id: string, commentId: string) => fetchApi(`/api/news/${id}/comments/${commentId}`, { method: 'DELETE' }),
  },
  tochka: {
    accounts: () => fetchApi('/api/tochka/accounts'),
    customer: () => fetchApi('/api/tochka/customer'),
    status: () => fetchApi('/api/tochka/status'),
    authUrl: () => fetchApi('/api/tochka/auth-url'),
  },
  vkGroupSettings: { get: () => fetchApi('/api/vk-group-settings'), save: (data: any) => fetchApi('/api/vk-group-settings', { method: 'POST', body: JSON.stringify(data) }), delete: () => fetchApi('/api/vk-group-settings', { method: 'DELETE' }), }, camera: {
    getSettings: () => fetchApi('/api/camera/settings'),
    getCamera: (id: string) => fetchApi(`/api/camera/settings/${id}`),
    createCamera: (data: any) => fetchApi('/api/camera/settings', { method: 'POST', body: JSON.stringify(data) }),
    saveCamera: (id: string, data: any) => fetchApi(`/api/camera/settings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteCamera: (id: string) => fetchApi(`/api/camera/settings/${id}`, { method: 'DELETE' }),
  },
  taskFinances: {
    get: (taskId: string): Promise<TaskFinances> => fetchApi(`/api/tasks/${taskId}/finances`),
    update: (taskId: string, data: { budget?: number; price?: number }) => fetchApi(`/api/tasks/${taskId}/finances`, { method: 'PATCH', body: JSON.stringify(data) }),
    createTransaction: (taskId: string, data: Partial<TaskTransaction>) => fetchApi(`/api/tasks/${taskId}/transactions`, { method: 'POST', body: JSON.stringify(data) }),
    updateTransaction: (taskId: string, txId: string, data: Partial<TaskTransaction>) => fetchApi(`/api/tasks/${taskId}/transactions/${txId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteTransaction: (taskId: string, txId: string) => fetchApi(`/api/tasks/${taskId}/transactions/${txId}`, { method: 'DELETE' }),
  },
  contactTypes: {
    list: (): Promise<any[]> => fetchApi('/api/contact-types'),
    create: (data: any) => fetchApi('/api/contact-types', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: any) => fetchApi(`/api/contact-types/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/api/contact-types/${id}`, { method: 'DELETE' }),
  },
  notes: {
    list: (q?: string): Promise<Note[]> => fetchApi(`/api/notes${q ? `?q=${encodeURIComponent(q)}` : ''}`),
    get: (id: string): Promise<Note> => fetchApi(`/api/notes/${id}`),
    create: (data: Partial<Note>) => fetchApi('/api/notes', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Note>) => fetchApi(`/api/notes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/api/notes/${id}`, { method: 'DELETE' }),
  },
  reminders: {
    list: (params?: { q?: string; statusId?: string; filter?: string }): Promise<Reminder[]> => {
      const qs = new URLSearchParams();
      if (params?.q) qs.set('q', params.q);
      if (params?.statusId) qs.set('statusId', params.statusId);
      if (params?.filter) qs.set('filter', params.filter);
      const str = qs.toString();
      return fetchApi(`/api/reminders${str ? `?${str}` : ''}`);
    },
    get: (id: string): Promise<Reminder> => fetchApi(`/api/reminders/${id}`),
    create: (data: Partial<Reminder>) => fetchApi('/api/reminders', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Reminder>) => fetchApi(`/api/reminders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/api/reminders/${id}`, { method: 'DELETE' }),
    complete: (id: string) => fetchApi(`/api/reminders/${id}/complete`, { method: 'POST' }),
    reopen: (id: string) => fetchApi(`/api/reminders/${id}/reopen`, { method: 'POST' }),
  },
  handlerSettings: {
    get: (): Promise<{ greeting: string; completion: string; userId: string | null; user?: { id: string; name: string } | null }> => fetchApi("/api/handler-settings"),
    save: (data: { greeting: string; completion: string; userId: string | null }) => fetchApi("/api/handler-settings", { method: "PUT", body: JSON.stringify(data) }),
  },
  autoReplySettings: {
    get: (): Promise<{ userId: string | null; user?: { id: string; name: string } | null; triggers: AutoReplyTrigger[] }> => fetchApi("/api/auto-reply-settings"),
    saveUser: (userId: string | null) => fetchApi("/api/auto-reply-settings", { method: "PUT", body: JSON.stringify({ userId }) }),
    addTrigger: (data: { word: string; answer: string }) => fetchApi("/api/auto-reply-settings/triggers", { method: "POST", body: JSON.stringify(data) }),
    updateTrigger: (id: string, data: Partial<{ word: string; answer: string; isActive: boolean }>) => fetchApi(`/api/auto-reply-settings/triggers/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    deleteTrigger: (id: string) => fetchApi(`/api/auto-reply-settings/triggers/${id}`, { method: "DELETE" }),
  },
  files: {
    tabs: () => fetchApi("/api/files/tabs"),
    updateTab: (tabKey: string, url: string, path: string) => fetchApi(`/api/files/tabs/${tabKey}`, { method: "POST", body: JSON.stringify({ url, path }) }),
    browse: (tab: string, filePath: string) => fetchApi(`/api/files/browse?tab=${encodeURIComponent(tab)}&path=${encodeURIComponent(filePath)}`),
    downloadFile: (tab: string, filePath: string) => downloadBlob(`/api/files/download?tab=${encodeURIComponent(tab)}&path=${encodeURIComponent(filePath)}`, filePath.split("/").pop() || "file"),
    downloadFolder: (tab: string, folderPath: string) => downloadBlob(`/api/files/download-folder?tab=${encodeURIComponent(tab)}&path=${encodeURIComponent(folderPath)}`, `${folderPath.split("/").pop() || "folder"}.zip`),
    downloadGameFile: (path: string) => downloadBlob(`/api/files/games/download?path=${encodeURIComponent(path)}`, path.split("/").pop() || "file"),
    downloadGameFolder: (path: string) => downloadBlob(`/api/files/games/download-folder?path=${encodeURIComponent(path)}`, `${path.split("/").pop() || "folder"}.zip`),
  },
  products: {
    list: (params?: string | { q?: string; categoryId?: string; noCategory?: boolean; kind?: string }): Promise<Product[]> => {
      const p = typeof params === 'string' ? { q: params } : (params ?? {});
      const qs = new URLSearchParams();
      if (p.q) qs.set('q', p.q);
      if (p.categoryId) qs.set('categoryId', p.categoryId);
      if (p.noCategory) qs.set('noCategory', '1');
      if (p.kind) qs.set('kind', p.kind);
      const str = qs.toString();
      return fetchApi(`/api/products${str ? `?${str}` : ''}`);
    },
    categories: {
      list: (): Promise<ProductCategory[]> => fetchApi('/api/products/meta/categories'),
    },
    vitrine: (): Promise<Product[]> => fetchApi('/api/products/vitrine'),
    vitrineCategories: (): Promise<ProductCategory[]> => fetchApi('/api/products/vitrine/categories'),
    get: (id: string): Promise<Product> => fetchApi(`/api/products/${id}`),
    create: (data: Partial<Product>) => fetchApi('/api/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>) => fetchApi(`/api/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/api/products/${id}`, { method: 'DELETE' }),
    bulkDelete: (ids: string[]) => fetchApi('/api/products/bulk-delete', { method: 'POST', body: JSON.stringify({ ids }) }),
    bulkCategory: (ids: string[], categoryId: string | null) => fetchApi('/api/products/bulk-category', { method: 'POST', body: JSON.stringify({ ids, categoryId }) }),
    createMovement: (id: string, data: Partial<StockMovement>) => fetchApi(`/api/products/${id}/movements`, { method: 'POST', body: JSON.stringify(data) }),
    setPrice: (id: string, priceTypeId: string, price: number) => fetchApi(`/api/products/${id}/prices`, { method: 'PUT', body: JSON.stringify({ priceTypeId, price }) }),
    priceHistory: (id: string): Promise<PriceHistory[]> => fetchApi(`/api/products/${id}/history`),
    vkStatus: (): Promise<{ configured: boolean; groupId: number | null; hasMarketToken: boolean }> => fetchApi('/api/products/meta/vk-status'),
    vkImport: (): Promise<{ created: number; linked: number; skipped: number; errors: string[] }> => fetchApi('/api/products/meta/vk-import', { method: 'POST' }),
    vkSync: (): Promise<{ created: number; updated: number; failed: number; errors: string[] }> => fetchApi('/api/products/meta/vk-sync', { method: 'POST' }),
    addImage: (id: string, attachmentId: string): Promise<ProductImage> => fetchApi(`/api/products/${id}/images`, { method: 'POST', body: JSON.stringify({ attachmentId }) }),
    deleteImage: (id: string, imageId: string) => fetchApi(`/api/products/${id}/images/${imageId}`, { method: 'DELETE' }),
    movements: (params?: { productId?: string; warehouseId?: string }): Promise<StockMovement[]> => {
      const qs = new URLSearchParams();
      if (params?.productId) qs.set('productId', params.productId);
      if (params?.warehouseId) qs.set('warehouseId', params.warehouseId);
      const str = qs.toString();
      return fetchApi(`/api/products/meta/movements${str ? `?${str}` : ''}`);
    },
    warehouses: {
      list: (): Promise<Warehouse[]> => fetchApi('/api/products/meta/warehouses'),
      create: (data: Partial<Warehouse>) => fetchApi('/api/products/meta/warehouses', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: Partial<Warehouse>) => fetchApi(`/api/products/meta/warehouses/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => fetchApi(`/api/products/meta/warehouses/${id}`, { method: 'DELETE' }),
    },
    priceTypes: {
      list: (): Promise<PriceType[]> => fetchApi('/api/products/meta/price-types'),
      create: (data: Partial<PriceType>) => fetchApi('/api/products/meta/price-types', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: Partial<PriceType>) => fetchApi(`/api/products/meta/price-types/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => fetchApi(`/api/products/meta/price-types/${id}`, { method: 'DELETE' }),
    },
  },
  emailFilters: {
    list: (spam?: boolean): Promise<EmailFilter[]> => fetchApi(`/api/email-filters${spam ? '?spam=1' : ''}`),
    logs: (): Promise<EmailFilterLog[]> => fetchApi('/api/email-filters/logs'),
    create: (data: Partial<EmailFilter>) => fetchApi('/api/email-filters', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<EmailFilter>) => fetchApi(`/api/email-filters/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (id: string) => fetchApi(`/api/email-filters/${id}`, { method: 'DELETE' }),
  },
  calls: {
    list: (limit?: number): Promise<WebCall[]> => fetchApi(`/api/calls${limit ? `?limit=${limit}` : ''}`),
    active: (): Promise<{ call: WebCall; role: 'caller' | 'callee' } | null> => fetchApi('/api/calls/active'),
    initiate: (calleeId: string, type: 'audio' | 'video'): Promise<WebCall> => fetchApi('/api/calls', { method: 'POST', body: JSON.stringify({ calleeId, type }) }),
    accept: (id: string): Promise<WebCall> => fetchApi(`/api/calls/${id}/accept`, { method: 'POST' }),
    reject: (id: string): Promise<WebCall> => fetchApi(`/api/calls/${id}/reject`, { method: 'POST' }),
    cancel: (id: string): Promise<WebCall> => fetchApi(`/api/calls/${id}/cancel`, { method: 'POST' }),
    end: (id: string): Promise<WebCall> => fetchApi(`/api/calls/${id}/end`, { method: 'POST' }),
  },
  get: (path: string): Promise<any> => fetchApi(path),
  // === Модуль «Бухгалтерия по почте» ===
  accounting: {
    getSettings: (): Promise<AccountingEmailSettings | null> => fetchApi('/api/accounting/settings'),
    saveSettings: (data: Partial<AccountingEmailSettings>) => fetchApi('/api/accounting/settings', { method: 'PUT', body: JSON.stringify(data) }),
    testSettings: (): Promise<{ ok?: boolean; error?: string }> => fetchApi('/api/accounting/settings/test', { method: 'POST', body: JSON.stringify({}) }),
    rules: {
      list: (): Promise<AccountingRule[]> => fetchApi('/api/accounting/rules'),
      create: (data: Partial<AccountingRule>) => fetchApi('/api/accounting/rules', { method: 'POST', body: JSON.stringify(data) }),
      update: (id: string, data: Partial<AccountingRule>) => fetchApi(`/api/accounting/rules/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
      delete: (id: string) => fetchApi(`/api/accounting/rules/${id}`, { method: 'DELETE' }),
    },
    documents: (params?: { type?: string; direction?: string; status?: string; matchStatus?: string; contactId?: string; taskId?: string; dealId?: string; from?: string; to?: string; search?: string; page?: number; limit?: number }): Promise<{ items: FinanceDocument[]; total: number; page: number; limit: number }> => {
      const qs = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
      const str = qs.toString();
      return fetchApi(`/api/accounting/documents${str ? `?${str}` : ''}`);
    },
    getDocument: (id: string): Promise<FinanceDocument> => fetchApi(`/api/accounting/documents/${id}`),
    createDocument: (data: Partial<FinanceDocument>): Promise<FinanceDocument> => fetchApi('/api/accounting/documents', { method: 'POST', body: JSON.stringify(data) }),
    updateDocument: (id: string, data: Partial<FinanceDocument>): Promise<FinanceDocument> => fetchApi(`/api/accounting/documents/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteDocument: (id: string) => fetchApi(`/api/accounting/documents/${id}`, { method: 'DELETE' }),
    analytics: (params?: { from?: string; to?: string }): Promise<AccountingAnalytics> => {
      const qs = new URLSearchParams();
      if (params?.from) qs.set('from', params.from);
      if (params?.to) qs.set('to', params.to);
      const str = qs.toString();
      return fetchApi(`/api/accounting/analytics${str ? `?${str}` : ''}`);
    },
    // Экспорт Excel: скачивание через fetch→blob с заголовком X-Auth-Token
    exportExcel: (params?: { from?: string; to?: string }) => {
      const qs = new URLSearchParams();
      if (params?.from) qs.set('from', params.from);
      if (params?.to) qs.set('to', params.to);
      const str = qs.toString();
      return downloadBlob(`/api/accounting/analytics/export${str ? `?${str}` : ''}`, `accounting_${new Date().toISOString().slice(0, 10)}.xlsx`);
    },
    bankSync: (): Promise<{ synced: number; new: number }> => fetchApi('/api/accounting/bank/sync', { method: 'POST', body: JSON.stringify({}) }),
    bankPayments: (params?: { matched?: 'all' | 'yes' | 'no'; from?: string; to?: string; page?: number; limit?: number }): Promise<{ items: BankPayment[]; total: number }> => {
      const qs = new URLSearchParams();
      if (params) Object.entries(params).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, String(v)); });
      const str = qs.toString();
      return fetchApi(`/api/accounting/bank/payments${str ? `?${str}` : ''}`);
    },
    reconciliation: (): Promise<ReconciliationResponse> => fetchApi('/api/accounting/reconciliation'),
    reconciliationAuto: (): Promise<{ matched: number }> => fetchApi('/api/accounting/reconciliation/auto', { method: 'POST', body: JSON.stringify({}) }),
    reconciliationMatch: (documentId: string, paymentId: string) => fetchApi('/api/accounting/reconciliation/match', { method: 'POST', body: JSON.stringify({ documentId, paymentId }) }),
    reconciliationUnmatch: (documentId: string) => fetchApi('/api/accounting/reconciliation/unmatch', { method: 'POST', body: JSON.stringify({ documentId }) }),
  },

};