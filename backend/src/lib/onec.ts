// Клиент 1С УТ 8.3 через стандартный OData-интерфейс (odata/standard.odata, JSON verbose + Basic Auth).
// Публикация: https://host/<base>/ -> OData: https://host/<base>/odata/standard.odata
// Локаль веб-клиента (/ru, /en) из базового URL отсекается автоматически.

export interface OneCNomenclature {
  id: string;                       // GUID (Ref_Key) номенклатуры в 1С
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
  id: string;                       // GUID (Ref_Key) контрагента в 1С
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

  // https://host/welans/ru -> https://host/welans/odata/standard.odata
  private odataBase(): string {
    let u = this.baseUrl.trim().replace(/\/+$/, '');
    u = u.replace(/\/(ru|en|uk|de|fr|it)(?=\/|$)/i, ''); // отрезать локаль веб-клиента
    return `${u}/odata/standard.odata`;
  }

  private authHeader(): string {
    return 'Basic ' + Buffer.from(`${this.login}:${this.password}`).toString('base64');
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      Authorization: this.authHeader(),
      Accept: 'application/json;odata=verbose',
      ...(options.headers as Record<string, string>),
    };
    const res = await fetch(`${this.odataBase()}/${path}`, { ...options, headers });
    if (res.status === 401 || res.status === 403) throw new Error('Неверный логин или пароль 1С');
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { /* 1С может вернуть не-JSON */ }
    if (!res.ok) {
      const msg = data?.error?.message?.value || data?.message || `Ошибка 1С: HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  // Чтение коллекции с постраничностью ($top/$skip; __next не используется — надежнее счётчик)
  private async readCollection(entitySet: string, select?: string): Promise<any[]> {
    const items: any[] = [];
    const top = 200;
    let skip = 0;
    for (;;) {
      const params = [`$format=json`, `$top=${top}`, `$skip=${skip}`, `$filter=DeletionMark eq false`];
      if (select) params.push(`$select=${select}`);
      const data = await this.request(`${entitySet}?${params.join('&')}`);
      const rows = data?.d?.results ?? [];
      items.push(...rows);
      if (rows.length < top) break;
      skip += top;
    }
    return items;
  }

  private entityUrl(entitySet: string, id: string): string {
    return `${entitySet}(guid'${id}')`;
  }

  // Создание сущности; возвращает Ref_Key созданной записи
  private async createEntity(entitySet: string, body: Record<string, any>): Promise<string> {
    const res = await this.request(entitySet, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json;odata=verbose' },
      body: JSON.stringify(body),
    });
    return res?.d?.Ref_Key;
  }

  // Обновление: PATCH, при неудаче — MERGE (OData v3)
  private async updateEntity(entitySet: string, id: string, body: Record<string, any>): Promise<void> {
    const url = this.entityUrl(entitySet, id);
    try {
      await this.request(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json;odata=verbose' },
        body: JSON.stringify(body),
      });
    } catch (e: any) {
      await this.request(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json;odata=verbose', 'X-HTTP-Method': 'MERGE' },
        body: JSON.stringify(body),
      });
    }
  }

  // --- Номенклатура ---
  async getNomenclature(): Promise<{ items: OneCNomenclature[] }> {
    const entitySet = encodeURI('Catalog_Номенклатура');
    const rows = await this.readCollection(entitySet, 'Ref_Key,Description,Артикул,ЕдиницаИзмерения,ВидНоменклатуры,DeletionMark');

    // Штрихкоды из регистра сведений (лучшее усилие — регистр может отсутствовать в конфигурации)
    const barcodes = new Map<string, string>();
    try {
      const bcRows = await this.readCollection(encodeURI('InformationRegister_ШтрихкодыНоменклатуры'), 'Номенклатура_Key,Штрихкод');
      for (const r of bcRows) {
        if (r.Номенклатура_Key && r.Штрихкод) barcodes.set(r.Номенклатура_Key, r.Штрихкод);
      }
    } catch { /* регистр недоступен — штрихкоды пропускаем */ }

    const items: OneCNomenclature[] = rows.map((r) => {
      const vid = r.ВидНоменклатуры;
      const typeName = typeof vid === 'object' ? vid?.ТипНоменклатуры : undefined;
      return {
        id: r.Ref_Key,
        name: r.Description || '',
        sku: r['Артикул'] || undefined,
        barcode: barcodes.get(r.Ref_Key),
        unit: typeof r.ЕдиницаИзмерения === 'object' ? r.ЕдиницаИзмерения?.Description : undefined,
        kind: typeName === 'Услуга' || typeName === 'Работа' ? 'service' : 'product',
        isActive: !r.DeletionMark,
      };
    });
    return { items };
  }

  async createNomenclature(item: Partial<OneCNomenclature>): Promise<{ id: string }> {
    const id = await this.createEntity(encodeURI('Catalog_Номенклатура'), {
      Description: item.name,
      Артикул: item.sku || '',
    });
    return { id };
  }

  async updateNomenclature(id: string, item: Partial<OneCNomenclature>): Promise<void> {
    await this.updateEntity(encodeURI('Catalog_Номенклатура'), id, {
      Description: item.name,
      Артикул: item.sku || '',
    });
  }

  // --- Контрагенты / контакты ---
  async getCounterparties(): Promise<{ items: OneCCounterparty[] }> {
    const rows = await this.readCollection(
      encodeURI('Catalog_Контрагенты'),
      'Ref_Key,Description,ИНН,ОГРН,ЮридическоеФизическоеЛицо,DeletionMark'
    );
    const items: OneCCounterparty[] = rows.map((r) => {
      const jf = r['ЮридическоеФизическоеЛицо'];
      const isOrg = jf === 'ЮридическоеЛицо' || jf === 'ИндивидуальныйПредприниматель';
      return {
        id: r.Ref_Key,
        name: r.Description || '',
        kind: isOrg ? 'organization' : 'contact',
        inn: r['ИНН'] || undefined,
        ogrn: r['ОГРН'] || undefined,
        isActive: !r.DeletionMark,
      };
    });
    return { items };
  }

  async createCounterparty(item: Partial<OneCCounterparty>): Promise<{ id: string }> {
    const id = await this.createEntity(encodeURI('Catalog_Контрагенты'), {
      Description: item.name,
      ИНН: item.inn || '',
      ОГРН: item.ogrn || '',
      ЮридическоеФизическоеЛицо: item.kind === 'contact' ? 'ФизическоеЛицо' : 'ЮридическоеЛицо',
    });
    return { id };
  }

  async updateCounterparty(id: string, item: Partial<OneCCounterparty>): Promise<void> {
    await this.updateEntity(encodeURI('Catalog_Контрагенты'), id, {
      Description: item.name,
      ИНН: item.inn || '',
      ОГРН: item.ogrn || '',
      ЮридическоеФизическоеЛицо: item.kind === 'contact' ? 'ФизическоеЛицо' : 'ЮридическоеЛицо',
    });
  }

  async ping(): Promise<boolean> {
    try {
      await this.request(`${encodeURI('Catalog_Номенклатура')}?$format=json&$top=1`);
      return true;
    } catch {
      return false;
    }
  }
}
