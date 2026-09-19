// === Клиент HTTP API Контур.Диадок (https://diadoc-api.kontur.ru) ===
// Только встроенный fetch (Node 20+), без внешних зависимостей.
// Авторизация: POST /V3/Authenticate?type=password → plain-text токен, кэшируется в памяти.

export const DIADOC_BASE_URL = 'https://diadoc-api.kontur.ru';

// Токен живёт сутки; держим запас (TTL ~20 часов), переавторизуемся при 401
const TOKEN_TTL_MS = 20 * 60 * 60 * 1000;

export interface DiadocBox {
  boxId: string;
  title: string;
  inn: string;
  kpp: string;
  orgId: string;
  orgName: string;
  isActive: boolean;
}

export interface DiadocDocument {
  documentId: string; // MessageId + EntityId (удобен для ссылок)
  messageId: string;
  entityId: string;
  title: string;
  fileName: string;
  senderTitle: string;
  recipientTitle: string;
  docDate: string;
  docNumber: string;
  status: string;
  total: string;
  direction: 'Inbound' | 'Outbound' | 'Internal' | string;
  isRead: boolean;
  requiresSignature: boolean;
  isTest: boolean;
  documentType: string;
}

export interface DiadocCounteragent {
  boxId: string;
  inn: string;
  kpp: string;
  fullName: string;
}

export interface DiadocSignResult {
  signed: boolean;
  confirmationRequired?: boolean;
  requestId?: string;
}

export class DiadocError extends Error {}

interface TokenCacheEntry {
  token: string;
  expiresAt: number;
  credentialsKey: string; // логин+apiKey, чтобы сбрасывать кэш при смене настроек
}

const tokenCache = new Map<string, TokenCacheEntry>();

function credentialsKey(login: string, apiKey: string) {
  return `${apiKey}:${login}`;
}

/** Сброс кэша токенов (при смене настроек подключения) */
export function invalidateDiadocTokenCache() {
  tokenCache.clear();
}

function parseErrorText(status: number, text: string): string {
  const t = (text || '').trim();
  if (status === 401) {
    if (/Invalid credentials/i.test(t)) return 'Неверный логин или пароль Диадока';
    if (/api client id/i.test(t)) return 'Некорректный API-ключ разработчика (ddauth_api_client_id)';
    return 'Ошибка авторизации в Диадоке (401): ' + (t || 'проверьте API-ключ, логин и пароль');
  }
  if (status === 402) return 'У ящика закончилась подписка на API Диадока (402 Payment Required)';
  if (status === 403) return 'Доступ запрещён (403): нет прав на ящик или операцию. ' + t;
  if (status === 404) return 'Не найдено (404): проверьте идентификаторы ящика/документа. ' + t;
  if (status === 400) return 'Некорректный запрос к API Диадока (400): ' + t;
  return `Ошибка API Диадока (HTTP ${status}): ${t || 'без описания'}`;
}

/** Аутентификация по логину и паролю. Возвращает токен (кэшируется ~20 ч). */
export async function authenticate(login: string, password: string, apiKey: string): Promise<string> {
  if (!apiKey) throw new DiadocError('Не указан API-ключ разработчика Диадока (получить: https://developer.kontur.ru/diadoc)');
  if (!login || !password) throw new DiadocError('Не указаны логин и пароль Диадока');

  const key = credentialsKey(login, apiKey);
  const cached = tokenCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.token;

  let res: Response;
  try {
    res = await fetch(`${DIADOC_BASE_URL}/V3/Authenticate?type=password`, {
      method: 'POST',
      headers: {
        Authorization: `DiadocAuth ddauth_api_client_id=${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ login, password }),
    });
  } catch (e: any) {
    throw new DiadocError('Не удалось подключиться к API Диадока: ' + e.message);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new DiadocError(parseErrorText(res.status, text));
  }
  const token = (await res.text()).trim();
  if (!token) throw new DiadocError('Диадок вернул пустой авторизационный токен');
  tokenCache.set(key, { token, expiresAt: Date.now() + TOKEN_TTL_MS, credentialsKey: key });
  return token;
}

function authHeader(apiKey: string, token: string) {
  return {
    Authorization: `DiadocAuth ddauth_api_client_id=${apiKey},ddauth_token=${token}`,
    Accept: 'application/json; charset=utf-8',
  };
}

/** Авторизованный JSON-запрос к API Диадока с одной переавторизацией при 401 */
export class DiadocClient {
  constructor(
    public login: string,
    public password: string,
    public apiKey: string,
  ) {}

  private async token(forceRefresh = false): Promise<string> {
    if (forceRefresh) invalidateDiadocTokenCache();
    return authenticate(this.login, this.password, this.apiKey);
  }

  async request<T = any>(method: string, path: string, body?: any, retried = false): Promise<T> {
    const token = await this.token();
    const url = path.startsWith('http') ? path : `${DIADOC_BASE_URL}${path}`;
    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers: { ...authHeader(this.apiKey, token), ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}) },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (e: any) {
      throw new DiadocError('Не удалось подключиться к API Диадока: ' + e.message);
    }
    if (res.status === 401 && !retried) {
      // протухший токен — переавторизуемся и повторим
      await this.token(true);
      return this.request<T>(method, path, body, true);
    }
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new DiadocError(parseErrorText(res.status, text));
    }
    const text = await res.text();
    if (!text) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return text as unknown as T;
    }
  }

  get<T = any>(path: string) {
    return this.request<T>('GET', path);
  }

  post<T = any>(path: string, body?: any) {
    return this.request<T>('POST', path, body);
  }

  /** Список организаций и ящиков пользователя: GET /GetMyOrganizations?autoRegister=false */
  async getBoxes(): Promise<DiadocBox[]> {
    const data = await this.get<{ Organizations?: any[] }>('/GetMyOrganizations?autoRegister=false');
    const boxes: DiadocBox[] = [];
    for (const org of data?.Organizations || []) {
      for (const box of org.Boxes || []) {
        boxes.push({
          boxId: box.BoxId || box.BoxIdGuid || '',
          title: box.Title || org.ShortName || org.FullName || '',
          inn: org.Inn || '',
          kpp: org.Kpp || '',
          orgId: org.OrgId || org.OrgIdGuid || '',
          orgName: org.ShortName || org.FullName || '',
          isActive: !!org.IsActive,
        });
      }
    }
    return boxes.filter((b) => b.boxId);
  }

  /** Список контрагентов ящика: GET /V2/GetCounteragents (с пагинацией по afterIndexKey, макс. 500) */
  async getCounteragents(boxId: string): Promise<DiadocCounteragent[]> {
    const result: DiadocCounteragent[] = [];
    let afterIndexKey: string | undefined;
    for (let page = 0; page < 5; page++) {
      const qs = new URLSearchParams({ boxId, counteragentStatus: 'IsMyCounteragent', count: '100' });
      if (afterIndexKey) qs.set('afterIndexKey', afterIndexKey);
      const data = await this.get<{ TotalCount?: number; Counteragents?: any[] }>(`/V2/GetCounteragents?${qs}`);
      const items = data?.Counteragents || [];
      for (const item of items) {
        const ca = item.Counteragent || item;
        const inn = ca.Inn || '';
        const kpp = ca.Kpp || '';
        const fullName = ca.FullName || ca.ShortName || inn;
        const cBoxId = ca.BoxId || '';
        if (inn || cBoxId) result.push({ boxId: cBoxId, inn, kpp, fullName });
      }
      const last = items[items.length - 1];
      afterIndexKey = last?.IndexKey;
      if (!afterIndexKey || items.length < 100) break;
    }
    return result;
  }

  /**
   * Список документов ящика: GET /V3/GetDocuments
   * type: inbound | outbound | requireSignature (входящие, ожидающие ответной подписи)
   */
  async getDocuments(boxId: string, type: 'inbound' | 'outbound' | 'requireSignature' = 'inbound'): Promise<DiadocDocument[]> {
    const filterCategory =
      type === 'outbound'
        ? 'Any.OutboundNotRevoked'
        : type === 'requireSignature'
          ? 'Any.InboundWaitingForRecipientSignature'
          : 'Any.InboundNotRevoked';
    const fmt = (d: Date) => `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
    const to = new Date();
    const from = new Date(to.getTime() - 93 * 24 * 60 * 60 * 1000); // ~3 месяца назад

    const docs: DiadocDocument[] = [];
    let afterIndexKey: string | undefined;
    for (let page = 0; page < 5; page++) {
      const qs = new URLSearchParams({
        boxId,
        filterCategory,
        fromDocumentDate: fmt(from),
        toDocumentDate: fmt(to),
        count: '100',
        sortDirection: 'Descending',
      });
      if (afterIndexKey) qs.set('afterIndexKey', afterIndexKey);
      const data = await this.get<{ TotalCount?: number; Documents?: any[] }>(`/V3/GetDocuments?${qs}`);
      const items = data?.Documents || [];
      for (const d of items) docs.push(normalizeDocument(d, type === 'requireSignature'));
      const last = items[items.length - 1];
      afterIndexKey = last?.IndexKey;
      if (!afterIndexKey || items.length < 100) break;
    }
    return docs;
  }

  /** Счётчики документов по категориям (для карточки состояния) */
  async getDocumentCounts(boxId: string): Promise<{ inbound: number; outbound: number; requireSignature: number }> {
    const count = async (filterCategory: string) => {
      const qs = new URLSearchParams({ boxId, filterCategory, count: '1' });
      const data = await this.get<{ TotalCount?: number }>(`/V3/GetDocuments?${qs}`);
      return data?.TotalCount ?? 0;
    };
    const [inbound, outbound, requireSignature] = await Promise.all([
      count('Any.InboundNotRevoked'),
      count('Any.OutboundNotRevoked'),
      count('Any.InboundWaitingForRecipientSignature'),
    ]);
    return { inbound, outbound, requireSignature };
  }

  /** Скачивание содержимого документа: GET /V4/GetEntityContent → Buffer + имя файла */
  async getDocumentContent(boxId: string, messageId: string, entityId: string): Promise<{ content: Buffer; fileName: string }> {
    const token = await this.token();
    const qs = new URLSearchParams({ boxId, messageId, entityId });
    const res = await fetch(`${DIADOC_BASE_URL}/V4/GetEntityContent?${qs}`, {
      headers: authHeader(this.apiKey, token),
    });
    if (res.status === 401) {
      await this.token(true);
      const res2 = await fetch(`${DIADOC_BASE_URL}/V4/GetEntityContent?${qs}`, {
        headers: authHeader(this.apiKey, await this.token()),
      });
      if (!res2.ok) throw new DiadocError(parseErrorText(res2.status, await res2.text().catch(() => '')));
      return { content: Buffer.from(await res2.arrayBuffer()), fileName: extractFileName(res2.headers, entityId) };
    }
    if (!res.ok) throw new DiadocError(parseErrorText(res.status, await res.text().catch(() => '')));
    return { content: Buffer.from(await res.arrayBuffer()), fileName: extractFileName(res.headers, entityId) };
  }

  /**
   * Отправка неформализованного документа контрагенту: POST /V2/PostMessage (MessageToPost).
   * Получателя можно указать либо toBoxId, либо inn/kpp (ящик ищем в списке контрагентов).
   */
  async sendDocument(opts: {
    boxId: string;
    toBoxId?: string;
    inn?: string;
    kpp?: string;
    fileName: string;
    contentBase64: string;
  }): Promise<{ messageId: string }> {
    let toBoxId = (opts.toBoxId || '').trim();
    if (!toBoxId) {
      const inn = (opts.inn || '').replace(/\D/g, '');
      const kpp = (opts.kpp || '').replace(/\D/g, '');
      if (!inn) throw new DiadocError('Укажите ящик получателя (toBoxId) или ИНН контрагента');
      const list = await this.getCounteragents(opts.boxId);
      const found = list.find((c) => c.inn === inn && (!kpp || !c.kpp || c.kpp === kpp));
      if (!found?.boxId) {
        throw new DiadocError(
          `Контрагент с ИНН ${inn}${kpp ? ` и КПП ${kpp}` : ''} не найден в списке контрагентов ящика. ` +
            'Добавьте его в контрагенты в Диадоке или укажите boxId получателя вручную',
        );
      }
      toBoxId = found.boxId;
    }

    const messageToPost = {
      FromBoxId: opts.boxId,
      ToBoxId: toBoxId,
      DocumentAttachments: [
        {
          TypeNamedId: 'Nonformalized',
          SignedContent: { Content: opts.contentBase64 },
          Metadata: [{ Key: 'FileName', Value: opts.fileName }],
        },
      ],
    };
    const qs = new URLSearchParams({ boxId: opts.boxId });
    const message = await this.post<{ MessageId?: string }>(`/V2/PostMessage?${qs}`, messageToPost);
    return { messageId: message?.MessageId || '' };
  }

  /**
   * Подписание входящего документа облачной подписью.
   * Шаг 1: POST /V2/CloudSign { SignaturesToCreate: [{ ParentEntityId, Content: "" }] }.
   * Если требуется подтверждение по SMS — вернёт confirmationRequired + requestId,
   * тогда нужен шаг 2: signConfirm(requestId, code) → POST /V2/CloudSignConfirm.
   * Полученная подпись прикладывается к документу через POST /V2/PatchEntities (SignedContent с пустым Content).
   */
  async signDocument(boxId: string, messageId: string, entityId: string, confirmCode?: string): Promise<DiadocSignResult> {
    let signResult: any;
    if (confirmCode) {
      const pending = pendingSignRequests.get(pendingKey(boxId, messageId, entityId));
      if (!pending) {
        throw new DiadocError('Запрос на подписание не найден или истёк — нажмите «Подписать» ещё раз, чтобы получить новый код');
      }
      const qs = new URLSearchParams({ boxId, requestId: pending.requestId, code: String(confirmCode).trim() });
      signResult = await this.post(`/V2/CloudSignConfirm?${qs}`, {});
      pendingSignRequests.delete(pendingKey(boxId, messageId, entityId));
    } else {
      const qs = new URLSearchParams({ boxId });
      signResult = await this.post(`/V2/CloudSign?${qs}`, {
        SignaturesToCreate: [{ ParentEntityId: entityId, Content: '' }],
      });
    }

    // Требуется код подтверждения из SMS
    if (signResult?.RequestId && !signResult?.Signatures?.length) {
      pendingSignRequests.set(pendingKey(boxId, messageId, entityId), {
        requestId: signResult.RequestId,
        expiresAt: Date.now() + 10 * 60 * 1000,
      });
      return { signed: false, confirmationRequired: true, requestId: signResult.RequestId };
    }

    const signatures: { EntityId?: string; Signature?: string }[] = signResult?.Signatures || [];
    const sig = signatures.find((s) => s.EntityId === entityId) || signatures[0];
    if (!sig?.Signature) {
      throw new DiadocError(
        'Диадок не вернул подпись. Возможно, у пользователя нет облачного сертификата — ' +
          'подписание доступно только для облачных сертификатов (Контур.Диадок → настройки сертификата)',
      );
    }

    // Прикладываем подпись к входящему документу (ответная подпись получателя)
    await this.post(`/V2/PatchEntities?${new URLSearchParams({ boxId })}`, {
      MessageId: messageId,
      Entities: [
        {
          EntityId: entityId,
          Attachment: { SignedContent: { Content: '', Signature: sig.Signature } },
        },
      ],
    });
    return { signed: true };
  }
}

// Незавершённые запросы облачного подписания (ожидают кода из SMS), TTL 10 минут
const pendingSignRequests = new Map<string, { requestId: string; expiresAt: number }>();

function pendingKey(boxId: string, messageId: string, entityId: string) {
  // заодно подчищаем просроченные заявки
  for (const [k, v] of pendingSignRequests) if (v.expiresAt < Date.now()) pendingSignRequests.delete(k);
  return `${boxId}:${messageId}:${entityId}`;
}

function extractFileName(headers: Headers, fallback: string): string {
  // Диадок отдаёт имя файла в заголовке X-Diadoc-FileName (base64) или в Content-Disposition
  const dd = headers.get('X-Diadoc-FileName');
  if (dd) {
    try {
      return Buffer.from(dd, 'base64').toString('utf8');
    } catch {
      try {
        return decodeURIComponent(dd);
      } catch {
        /* ignore */
      }
    }
  }
  const cd = headers.get('Content-Disposition') || '';
  const m = cd.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  return `${fallback}.bin`;
}

function normalizeDocument(d: any, forceRequiresSignature = false): DiadocDocument {
  const meta: { Key?: string; Value?: string }[] = d.Metadata || [];
  const metaVal = (key: string) => meta.find((m) => m.Key === key)?.Value || '';
  // Статус документа лежит в <Тип>Metadata.DocumentStatus (UniversalTransferDocumentMetadata и т.п.)
  let status = '';
  for (const k of Object.keys(d)) {
    if (k.endsWith('Metadata') && d[k] && typeof d[k] === 'object' && typeof d[k].DocumentStatus === 'string') {
      status = d[k].DocumentStatus;
      break;
    }
  }
  if (!status) status = d.DocflowStatus?.PrimaryStatus?.StatusText || '';
  const direction: string = d.DocumentDirection || d.Direction || '';
  const recipientResponse = d.RecipientResponseStatus || '';
  return {
    documentId: `${d.MessageId || ''}${d.EntityId || ''}`,
    messageId: d.MessageId || '',
    entityId: d.EntityId || '',
    title: d.Title || metaVal('FileName') || '',
    fileName: d.FileName || metaVal('FileName') || '',
    senderTitle: d.SenderTitle || metaVal('SellerName') || '',
    recipientTitle: d.RecipientTitle || metaVal('BuyerName') || '',
    docDate: d.DocumentDate || metaVal('DocumentDate') || '',
    docNumber: d.DocumentNumber || metaVal('DocumentNumber') || '',
    status,
    total: d.UniversalTransferDocumentMetadata?.Total || metaVal('TotalSum') || metaVal('Total') || '',
    direction,
    isRead: !!d.IsRead,
    requiresSignature: forceRequiresSignature || (direction === 'Inbound' && recipientResponse === 'WaitingForRecipientSignature'),
    isTest: !!d.IsTest,
    documentType: d.TypeNamedId || d.DocumentType || '',
  };
}
