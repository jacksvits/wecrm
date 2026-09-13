// Клиент 1С УТ 8.3 через стандартный OData-интерфейс (odata/standard.odata, Basic Auth).
// Публикация: https://host/<base>/ -> OData: https://host/<base>/odata/standard.odata
// Локаль веб-клиента (/ru, /en) из базового URL отсекается автоматически.
//
// Особенности платформы:
// - чтение: Accept application/json;odata=verbose, ответ {d:{results:[...]}} или {value:[...]}
// - запись: Accept application/json (verbose-вид на запись 1С не поддерживает -> HTTP 406),
//   ответ — созданная сущность с Ref_Key на верхнем уровне.

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
  categoryPath?: string[];          // путь категорий: [категория, подкатегория, ...]
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
  private kindKeyCache: { service?: string; product?: string } = {};

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
      const msg = data?.error?.message?.value || data?.error?.message || data?.message || `Ошибка 1С: HTTP ${res.status}`;
      throw new Error(msg);
    }
    return data;
  }

  // Запись: Accept только application/json (verbose -> 406)
  private async writeRequest(path: string, method: string, body: Record<string, any>): Promise<any> {
    return this.request(path, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json;odata=verbose',
      },
      body: JSON.stringify(body),
    });
  }

  // Строки коллекции в любом из форматов ответа 1С
  private rowsOf(data: any): any[] {
    return data?.d?.results ?? data?.value ?? [];
  }

  // Записи регистров: 1С группирует их по регистратору — {Recorder, Recorder_Type, RecordSet: [...]}
  private recordsOf(data: any): any[] {
    const out: any[] = [];
    for (const r of this.rowsOf(data)) {
      if (Array.isArray(r.RecordSet)) out.push(...r.RecordSet);
      else out.push(r);
    }
    return out;
  }

  // Чтение коллекции с постраничностью ($top/$skip).
  // skipDeletionFilter — для регистров (у записей регистров нет DeletionMark)
  private async readCollection(entitySet: string, select?: string, skipDeletionFilter = false): Promise<any[]> {
    const items: any[] = [];
    const top = 200;
    let skip = 0;
    for (;;) {
      const params = [`$format=json`, `$top=${top}`, `$skip=${skip}`];
      if (!skipDeletionFilter) params.push(`$filter=DeletionMark eq false`);
      if (select) params.push(`$select=${select}`);
      const data = await this.request(`${entitySet}?${params.join('&')}`);
      const rows = this.rowsOf(data);
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
    const res = await this.writeRequest(entitySet, 'POST', body);
    return res?.d?.Ref_Key ?? res?.Ref_Key;
  }

  // Обновление: PATCH, при неудаче — MERGE (OData v3)
  private async updateEntity(entitySet: string, id: string, body: Record<string, any>): Promise<void> {
    const url = this.entityUrl(entitySet, id);
    try {
      await this.writeRequest(url, 'PATCH', body);
    } catch (e: any) {
      await this.request(url, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json;odata=verbose',
          'X-HTTP-Method': 'MERGE',
        },
        body: JSON.stringify(body),
      });
    }
  }

  // Виды номенклатуры: Ref_Key -> ТипНоменклатуры ('Товар'/'Услуга'/'' — пусто у групп и видов без типа)
  private kindsCache: Map<string, string> | null = null;

  private async kindsMap(): Promise<Map<string, string>> {
    if (this.kindsCache) return this.kindsCache;
    const rows = await this.readCollection(encodeURI('Catalog_ВидыНоменклатуры'), 'Ref_Key,ТипНоменклатуры,DeletionMark');
    this.kindsCache = new Map(rows.map((r) => [r.Ref_Key, r['ТипНоменклатуры'] || '']));
    return this.kindsCache;
  }

  // Ключ вида номенклатуры по умолчанию (для создания товаров/услуг в 1С)
  private async defaultKindKey(kind?: 'product' | 'service'): Promise<string | undefined> {
    const cacheKey = kind === 'service' ? 'service' : 'product';
    const cached = this.kindKeyCache[cacheKey];
    if (cached) return cached;
    try {
      const kinds = await this.kindsMap();
      const byType = (t: string) => [...kinds.entries()].find(([, type]) => type === t)?.[0];
      let key: string | undefined;
      if (kind === 'service') key = byType('Услуга') || byType('Работа');
      // для товара: сначала тип «Товар», иначе любой вид (у части видов тип не заполнен)
      key = key || byType('Товар') || [...kinds.keys()][0];
      if (key) this.kindKeyCache[cacheKey] = key;
      return key;
    } catch {
      return undefined;
    }
  }

  // --- Группы номенклатуры (категории) ---
  private folderCache: { folders: Map<string, { name: string; parent?: string }>; loaded: boolean } = {
    folders: new Map(),
    loaded: false,
  };

  private async loadFolders(): Promise<Map<string, { name: string; parent?: string }>> {
    if (this.folderCache.loaded) return this.folderCache.folders;
    const rows = await this.readCollection(
      encodeURI('Catalog_Номенклатура'),
      'Ref_Key,Description,Parent_Key,IsFolder,DeletionMark'
    );
    for (const r of rows) {
      if (r.IsFolder) this.folderCache.folders.set(r.Ref_Key, { name: r.Description || '', parent: r.Parent_Key || undefined });
    }
    this.folderCache.loaded = true;
    return this.folderCache.folders;
  }

  // Путь категорий элемента по Parent_Key (сверху вниз: [категория, подкатегория, ...])
  private async categoryPathOf(parentKey?: string): Promise<string[] | undefined> {
    if (!parentKey) return undefined;
    const folders = await this.loadFolders();
    const path: string[] = [];
    let cur: string | undefined = parentKey;
    const guard = new Set<string>();
    while (cur && folders.has(cur) && !guard.has(cur)) {
      guard.add(cur);
      const f: { name: string; parent?: string } = folders.get(cur)!;
      path.unshift(f.name);
      cur = f.parent;
    }
    return path.length ? path : undefined;
  }

  // Найти или создать группу по пути; возвращает Ref_Key группы
  async ensureFolder(path: string[]): Promise<string | undefined> {
    if (!path.length) return undefined;
    const folders = await this.loadFolders();
    let parentKey: string | undefined;
    for (const name of path) {
      const found = [...folders.entries()].find(([, f]) => f.name === name && f.parent === parentKey);
      if (found) {
        parentKey = found[0];
        continue;
      }
      // создаём недостающий уровень
      const body: Record<string, any> = { Description: name, IsFolder: true };
      if (parentKey) body['Parent_Key'] = parentKey;
      const key = await this.createEntity(encodeURI('Catalog_Номенклатура'), body);
      if (!key) return undefined;
      folders.set(key, { name, parent: parentKey });
      parentKey = key;
    }
    return parentKey;
  }

  // Единицы измерения: Ref_Key -> наименование
  private unitsCache: Map<string, string> | null = null;

  private async unitsMap(): Promise<Map<string, string>> {
    if (this.unitsCache) return this.unitsCache;
    try {
      const rows = await this.readCollection(encodeURI('Catalog_ЕдиницыИзмерения'), 'Ref_Key,Description,DeletionMark');
      this.unitsCache = new Map(rows.map((r) => [r.Ref_Key, r.Description || '']));
    } catch {
      this.unitsCache = new Map();
    }
    return this.unitsCache;
  }

  // --- Номенклатура ---
  async getNomenclature(): Promise<{ items: OneCNomenclature[] }> {
    const entitySet = encodeURI('Catalog_Номенклатура');
    const rows = await this.readCollection(entitySet, 'Ref_Key,Description,Артикул,ЕдиницаИзмерения_Key,ВидНоменклатуры_Key,Parent_Key,IsFolder,Описание,DeletionMark');

    // Штрихкоды из регистра сведений (best-effort — регистр может отсутствовать)
    const barcodes = new Map<string, string>();
    try {
      const bcRows = await this.readCollection(encodeURI('InformationRegister_ШтрихкодыНоменклатуры'), 'Номенклатура_Key,Штрихкод', true);
      for (const r of bcRows) {
        if (r.Номенклатура_Key && r.Штрихкод) barcodes.set(r.Номенклатура_Key, r.Штрихкод);
      }
    } catch { /* регистр недоступен — штрихкоды пропускаем */ }

    const items: OneCNomenclature[] = [];
    const kinds = await this.kindsMap();
    const units = await this.unitsMap();
    for (const r of rows) {
      if (r.IsFolder) continue; // группы — это категории, обрабатываются отдельно
      const vidKey = typeof r.ВидНоменклатуры === 'object'
        ? r.ВидНоменклатуры?.Ref_Key
        : (r.ВидНоменклатуры_Key ?? r.ВидНоменклатуры);
      const typeName = vidKey ? kinds.get(vidKey) : undefined;
      const unitKey = typeof r.ЕдиницаИзмерения === 'object'
        ? r.ЕдиницаИзмерения?.Ref_Key
        : (r.ЕдиницаИзмерения_Key ?? r.ЕдиницаИзмерения);
      items.push({
        id: r.Ref_Key,
        name: r.Description || '',
        sku: r['Артикул'] || undefined,
        barcode: barcodes.get(r.Ref_Key),
        unit: (unitKey ? units.get(unitKey) : undefined) || undefined,
        kind: typeName === 'Услуга' || typeName === 'Работа' ? 'service' : 'product',
        description: r['Описание'] || undefined,
        isActive: !r.DeletionMark,
        categoryPath: await this.categoryPathOf(r.Parent_Key || undefined),
      });
    }
    return { items };
  }

  async createNomenclature(item: Partial<OneCNomenclature>): Promise<{ id: string }> {
    const body: Record<string, any> = {
      Description: item.name,
      Артикул: item.sku || '',
    };
    const kindKey = await this.defaultKindKey(item.kind);
    if (kindKey) body['ВидНоменклатуры_Key'] = kindKey;
    body['Описание'] = item.description || '';
    const folderKey = await this.ensureFolder(item.categoryPath ?? []);
    if (folderKey) body['Parent_Key'] = folderKey;
    const id = await this.createEntity(encodeURI('Catalog_Номенклатура'), body);
    return { id };
  }

  async updateNomenclature(id: string, item: Partial<OneCNomenclature>): Promise<void> {
    const body: Record<string, any> = {
      Description: item.name,
      Артикул: item.sku || '',
      Описание: item.description || '',
    };
    if (item.categoryPath) {
      const folderKey = await this.ensureFolder(item.categoryPath);
      if (folderKey) body['Parent_Key'] = folderKey;
    }
    await this.updateEntity(encodeURI('Catalog_Номенклатура'), id, body);
  }

  // --- Склады ---
  async getWarehouses(): Promise<{ id: string; name: string }[]> {
    const rows = await this.readCollection(encodeURI('Catalog_Склады'), 'Ref_Key,Description,DeletionMark');
    return rows.map((r) => ({ id: r.Ref_Key, name: r.Description || '' }));
  }

  // --- Остатки (AccumulationRegister_ТоварыНаСкладах), свёртка по номенклатуре+складу ---
  async getStock(): Promise<{ nomenclatureKey: string; warehouseKey: string; quantity: number }[]> {
    // полные записи без $select — состав ресурсов варьируется по версиям УТ
    const rows = await this.readCollection(encodeURI('AccumulationRegister_ТоварыНаСкладах'), undefined, true);
    const sums = new Map<string, number>();
    for (const r of this.recordsOf({ value: rows })) {
      if (!r.Номенклатура_Key || !r.Склад_Key) continue;
      const q = Number(r['ВНаличии'] ?? r['Количество'] ?? 0) || 0;
      const sign = r.RecordType === 'Expense' || r.ВидДвижения === 'Расход' ? -1 : 1;
      const k = `${r.Номенклатура_Key}|${r.Склад_Key}`;
      sums.set(k, (sums.get(k) ?? 0) + q * sign);
    }
    return [...sums.entries()].map(([k, quantity]) => {
      const [nomenclatureKey, warehouseKey] = k.split('|');
      return { nomenclatureKey, warehouseKey, quantity };
    });
  }

  // --- Цены: виды цен и актуальные цены (последний период по каждой паре) ---
  async getPriceKinds(): Promise<Map<string, string>> {
    const rows = await this.readCollection(encodeURI('Catalog_ВидыЦен'), 'Ref_Key,Description,DeletionMark');
    return new Map(rows.map((r) => [r.Ref_Key, r.Description || '']));
  }

  async getPrices(): Promise<{ nomenclatureKey: string; priceKindKey: string; price: number }[]> {
    const rows = await this.readCollection(encodeURI('InformationRegister_ЦеныНоменклатуры'), undefined, true);
    const latest = new Map<string, { nomenclatureKey: string; priceKindKey: string; price: number; period: number }>();
    for (const r of this.recordsOf({ value: rows })) {
      if (!r.Номенклатура_Key || !r.ВидЦены_Key) continue;
      const period = r.Period ? new Date(r.Period).getTime() : 0;
      const k = `${r.Номенклатура_Key}|${r.ВидЦены_Key}`;
      const cur = latest.get(k);
      if (!cur || period > cur.period) {
        latest.set(k, { nomenclatureKey: r.Номенклатура_Key, priceKindKey: r.ВидЦены_Key, price: Number(r.Цена) || 0, period });
      }
    }
    return [...latest.values()].map(({ period, ...rest }) => rest);
  }

  // --- Контрагенты / контакты ---
  async getCounterparties(): Promise<{ items: OneCCounterparty[] }> {
    const rows = await this.readCollection(
      encodeURI('Catalog_Контрагенты'),
      'Ref_Key,Description,ИНН,ЮридическоеФизическоеЛицо,DeletionMark'
    );
    const items: OneCCounterparty[] = rows.map((r) => {
      const jf = r['ЮридическоеФизическоеЛицо'];
      const isOrg = jf === 'ЮридическоеЛицо' || jf === 'ИндивидуальныйПредприниматель';
      return {
        id: r.Ref_Key,
        name: r.Description || '',
        kind: isOrg ? 'organization' : 'contact',
        inn: r['ИНН'] || undefined,
        isActive: !r.DeletionMark,
      };
    });
    return { items };
  }

  async createCounterparty(item: Partial<OneCCounterparty>): Promise<{ id: string }> {
    // Дедупликация: если контрагент с таким именем уже есть в 1С — привязываемся к нему
    const existingId = await this.findCounterpartyByName(item.name || '');
    if (existingId) return { id: existingId };
    // УТ 11: Контрагент без Партнёра не записывается (обработчик ПриЗаписи -> HTTP 500)
    let partnerKey = await this.findByName(encodeURI('Catalog_Партнеры'), item.name || '');
    if (!partnerKey) {
      try {
        partnerKey = await this.createEntity(encodeURI('Catalog_Партнеры'), { Description: item.name });
      } catch { /* если партнёры недоступны — пробуем создать контрагента без них */ }
    }
    const body: Record<string, any> = {
      Description: item.name,
      ИНН: item.inn || '',
      ЮридическоеФизическоеЛицо: item.kind === 'contact' ? 'ФизическоеЛицо' : 'ЮридическоеЛицо',
    };
    if (partnerKey) body['Партнер_Key'] = partnerKey;
    const id = await this.createEntity(encodeURI('Catalog_Контрагенты'), body);
    return { id };
  }

  // Поиск контрагента/партнёра по точному имени (дедупликация при выгрузке)
  private async findByName(entitySet: string, name: string): Promise<string | undefined> {
    try {
      const filter = encodeURIComponent(`Description eq '${name.replace(/'/g, "''")}' and DeletionMark eq false`);
      const data = await this.request(`${entitySet}?$format=json&$top=1&$select=Ref_Key&$filter=${filter}`);
      return this.rowsOf(data)[0]?.Ref_Key;
    } catch {
      return undefined;
    }
  }

  async findCounterpartyByName(name: string): Promise<string | undefined> {
    return this.findByName(encodeURI('Catalog_Контрагенты'), name);
  }

  async updateCounterparty(id: string, item: Partial<OneCCounterparty>): Promise<void> {
    // Вид (ЮрЛицо/ФизЛицо) при обновлении НЕ меняем — только при создании
    await this.updateEntity(encodeURI('Catalog_Контрагенты'), id, {
      Description: item.name,
      ИНН: item.inn || '',
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
