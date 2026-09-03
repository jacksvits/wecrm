/**
 * Novofon API integration service
 * Supports Call API and Data API via JSON-RPC 2.0
 * Docs: https://novofon.github.io/call_api/ | https://novofon.github.io/data_api/
 */

const DATA_API_URL = 'https://dataapi.novofon.com/v1';
const CALL_API_URL = 'https://callapi.novofon.com/v1';

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
      access_token: credentials.apiSecret,
      ...params,
    },
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (data.error) {
    throw new Error(`Novofon API error: ${data.error.message || JSON.stringify(data.error)}`);
  }

  return data.result?.data as T;
}

export async function getEmployees(credentials: NovofonCredentials): Promise<NovofonEmployee[]> {
  return jsonRpcRequest(DATA_API_URL, 'get.employees', {}, credentials);
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
  return jsonRpcRequest(
    DATA_API_URL,
    'get.call_record',
    { call_id_with_rec: callIdWithRec },
    credentials
  );
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
