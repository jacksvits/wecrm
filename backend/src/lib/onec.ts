// Клиент опубликованного веб-сервиса 1С УТ 8.3 (HTTP-сервис hs/wecrm, JSON + Basic Auth).
// Протокол: GET/POST/PUT <serviceUrl>/hs/wecrm/<resource>

export interface OneCNomenclature {
  id: string;                       // GUID номенклатуры в 1С
  name: string;
  sku?: string;                     // артикул
  barcode?: string;                 // штрихкод
  unit?: string;                    // ед. измерения
  kind?: 'product' | 'service';
  price?: number;
  description?: string;
  isActive?: boolean;
}

export interface OneCCounterparty {
  id: string;                       // GUID контрагента в 1С
  name: string;
  kind: 'organization' | 'contact'; // ЮрЛицо/ИП | ФизЛицо
  inn?: string;
  ogrn?: string;
  legalAddress?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export class OneCClient {
  constructor(
    private baseUrl: string,
    private login: string,
    private password: string
  ) {}

  private url(path: string): string {
    const base = this.baseUrl.replace(/\/+$/, '');
    return `${base}/hs/wecrm/${path}`;
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      Authorization: 'Basic ' + Buffer.from(`${this.login}:${this.password}`).toString('base64'),
      'Content-Type': 'application/json; charset=utf-8',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };
    const res = await fetch(this.url(path), { ...options, headers });
    if (res.status === 401 || res.status === 403) throw new Error('Неверный логин или пароль 1С');
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* 1С может вернуть не-JSON */ }
    if (!res.ok) throw new Error((data && data.error) || `Ошибка 1С: HTTP ${res.status}`);
    return data;
  }

  // --- Номенклатура ---
  getNomenclature(after?: string) {
    return this.request(`nomenclature${after ? `?after=${encodeURIComponent(after)}` : ''}`) as Promise<{ items: OneCNomenclature[]; hasMore?: boolean }>;
  }
  createNomenclature(item: Partial<OneCNomenclature>) {
    return this.request('nomenclature', { method: 'POST', body: JSON.stringify(item) }) as Promise<{ id: string }>;
  }
  updateNomenclature(id: string, item: Partial<OneCNomenclature>) {
    return this.request(`nomenclature/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(item) });
  }

  // --- Контрагенты / контакты ---
  getCounterparties(after?: string) {
    return this.request(`counterparties${after ? `?after=${encodeURIComponent(after)}` : ''}`) as Promise<{ items: OneCCounterparty[]; hasMore?: boolean }>;
  }
  createCounterparty(item: Partial<OneCCounterparty>) {
    return this.request('counterparties', { method: 'POST', body: JSON.stringify(item) }) as Promise<{ id: string }>;
  }
  updateCounterparty(id: string, item: Partial<OneCCounterparty>) {
    return this.request(`counterparties/${encodeURIComponent(id)}`, { method: 'PUT', body: JSON.stringify(item) });
  }

  async ping(): Promise<boolean> {
    try { await this.request('ping'); return true; } catch { return false; }
  }
}
