// ARCHITECTURAL TRACE: Frontend — Adaptador de salida (consumo de la API REST)

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

function tokenActual(): string | null {
  return localStorage.getItem('token');
}

export async function httpRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenActual();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {})
  };

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    const cuerpo = await response.json().catch(() => ({ mensaje: response.statusText }));
    throw new Error(cuerpo.mensaje ?? `Error HTTP ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
