/**
 * Novofon API integration service
 * Supports Call API and Data API via JSON-RPC 2.0
 * Docs: https://novofon.github.io/call_api/ | https://novofon.github.io/data_api/
 */

const DATA_API_URL = 'https://dataapi-jsonrpc.novofon.ru/v2.0';
const CALL_API_URL = 'https://callapi-jsonrpc.novofon.ru/v4.0';

export interface NovofonCredentials {
  apiKey: string;
  apiSecret: string;
}

export interface NovofonEmployee {
  id: number;
  name: string;
  email: string;
  phone_numbers: { number: string; status: string; sip_login?: string }[];
  virtual_phone_number?: string;
}

export interface NovofonCallResult {
  call_session_id: number;
}

export interface NovofonRecordInfo {
  url: string;
  data: {
    file_name: string;
    file_size: number;
    duration: number;
    created: string;
  };
  // true, если ссылка получена media-фолбэком без Data API (метаданные неизвестны)
  viaMediaFallback?: boolean;
}

// Параметры авторизации: если заполнен apiSecret — старая схема key/secret
// (auth.login/password), иначе apiKey трактуется как постоянный access_token
// (актуальная схема Novofon 2.0: params.access_token)
function authParams(credentials: NovofonCredentials): Record<string, any> {
  if (credentials.apiSecret) {
    return { auth: { login: credentials.apiKey, password: credentials.apiSecret } };
  }
  return { access_token: credentials.apiKey };
}

async function jsonRpcRequest<T = any>(
  url: string,
  method: string,
  params: Record<string, any>,
  credentials: NovofonCredentials
): Promise<T> {
  const body = {
    jsonrpc: '2.0',
    id: `req_${Date.now()}`,
    method,
    params: {
      ...authParams(credentials),
      ...params,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data: any = await res.json();

  if (data.error) {
    throw new Error(`Novofon API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  const result = data.result?.data ?? data.result;
  // API может вернуть ответ без result (и без error) — не отдаём undefined,
  // чтобы вызывающий код не падал на .find()/.length() и т.п.
  if (result === undefined || result === null) {
    throw new Error(`Novofon API: пустой result для ${method}: ${JSON.stringify(data).slice(0, 300)}`);
  }

  return result as T;
}

export async function getEmployees(credentials: NovofonCredentials): Promise<NovofonEmployee[]> {
  const data = await jsonRpcRequest<any>(DATA_API_URL, 'get.employees', {}, credentials);
  // API иногда оборачивает список объектом/строкой вместо массива — нормализуем,
  // чтобы вызывающий код всегда получал массив
  if (Array.isArray(data)) return data as NovofonEmployee[];
  if (data && typeof data === 'object') {
    const values = Object.values(data);
    if (values.length && values.every((v) => v && typeof v === 'object')) {
      return values as NovofonEmployee[];
    }
  }
  return [];
}

export async function getSipLines(credentials: NovofonCredentials) {
  return jsonRpcRequest(DATA_API_URL, 'get.sip_lines', {}, credentials);
}

export async function getVirtualPhoneNumbers(credentials: NovofonCredentials) {
  return jsonRpcRequest(DATA_API_URL, 'get.virtual_phone_numbers', {}, credentials);
}

export async function startEmployeeCall(
  credentials: NovofonCredentials,
  options: {
    virtualPhoneNumber: string;
    employeeId: number;
    contactPhone: string;
    showVirtualPhoneNumber?: boolean;
  }
): Promise<NovofonCallResult> {
  return jsonRpcRequest(
    CALL_API_URL,
    'start.employee_call',
    {
      virtual_phone_number: options.virtualPhoneNumber,
      first_call: 'employee',
      employee: { id: options.employeeId },
      contact: options.contactPhone,
      show_virtual_phone_number: options.showVirtualPhoneNumber ?? true,
    },
    credentials
  );
}

export async function getCallRecord(
  credentials: NovofonCredentials,
  callIdWithRec: string
): Promise<NovofonRecordInfo> {
  // Фолбэк: прямая ссылка на media.novofon.ru/<session_id>/<rec_hash>
  // (call_id_with_rec приходит в формате <session_id>.<rec_hash>)
  const mediaFallback = (): NovofonRecordInfo | null => {
    const mediaPath = String(callIdWithRec).replace('.', '/');
    if (!mediaPath.includes('/')) return null;
    return {
      url: `https://media.novofon.ru/${mediaPath}`,
      data: {
        file_name: `record_${String(callIdWithRec).replace('.', '_')}.mp3`,
        file_size: 0,
        duration: 0,
        created: new Date().toISOString(),
      },
      viaMediaFallback: true,
    };
  };
  let data: any = null;
  try {
    const res = await fetch(DATA_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: `req_${Date.now()}`,
        method: 'get.call_record',
        params: {
          ...authParams(credentials),
          call_id_with_rec: callIdWithRec,
        },
      }),
    });
    data = await res.json();
  } catch (err: any) {
    console.warn('[Novofon] get.call_record: ошибка запроса, используем media-фолбэк:', err.message);
  }
  if (data?.error) {
    // Ошибка авторизации/API не должна рвать прикрепление записи — пробуем media-фолбэк
    console.warn('[Novofon] get.call_record: ошибка API, используем media-фолбэк:', data.error.message || JSON.stringify(data.error).slice(0, 300));
    data = null;
  }
  // get.call_record может вернуть result.data объектом, массивом либо отдать поля сразу в result
  let record: any = data?.result?.data ?? data?.result;
  if (Array.isArray(record)) record = record[0];
  if (record && record.url) return record as NovofonRecordInfo;
  const fallback = mediaFallback();
  if (fallback) return fallback;
  throw new Error(`Novofon get.call_record: неожиданный ответ: ${JSON.stringify(data).slice(0, 300)}`);
}

// === New methods for full integration ===

export async function sendSms(
  credentials: NovofonCredentials,
  options: { from: string; to: string; text: string }
) {
  return jsonRpcRequest(
    CALL_API_URL,
    'send.sms',
    { from: options.from, to: options.to, text: options.text },
    credentials
  );
}

export async function getCallsReport(
  credentials: NovofonCredentials,
  options: { dateFrom: string; dateTo: string; limit?: number; offset?: number }
) {
  return jsonRpcRequest(
    DATA_API_URL,
    'get.calls_report',
    {
      date_from: options.dateFrom,
      date_to: options.dateTo,
      limit: options.limit || 100,
      offset: options.offset || 0,
    },
    credentials
  );
}
