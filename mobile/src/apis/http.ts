const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';
let accessToken: string | undefined;

export function getApiUrl() {
  return API_URL;
}

export function setAccessToken(token: string | undefined) {
  accessToken = token;
}

function buildHeaders(headers?: HeadersInit) {
  return {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...headers,
  };
}

async function buildRequestError(response: Response) {
  let message = `Request failed: ${response.status}`;
  try {
    const data = await response.json();
    const detail =
      typeof data?.message === 'string'
        ? data.message
        : typeof data?.error === 'string'
          ? data.error
          : undefined;
    if (detail) message = detail;
  } catch {
    try {
      const text = await response.text();
      if (text) message = text;
    } catch {
      // Keep the status-based fallback.
    }
  }
  return new Error(message);
}

export async function apiGet<T>(path: string): Promise<T> {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    headers: buildHeaders(),
  });
  if (!response.ok) {
    throw await buildRequestError(response);
  }
  return response.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw await buildRequestError(response);
  }
  return response.json() as Promise<T>;
}

export async function apiPostVoid(path: string, body?: unknown): Promise<void> {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(),
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw await buildRequestError(response);
  }
}

export async function apiDelete<T>(path: string): Promise<T> {
  const url = `${API_URL}${path}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  if (!response.ok) {
    throw await buildRequestError(response);
  }
  return response.json() as Promise<T>;
}
