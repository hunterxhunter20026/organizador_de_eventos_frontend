// ARCHITECTURAL TRACE: Frontend — Adaptador de salida (consumo de la API REST)

import { ApiError } from '../domain/types';

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
    const cuerpo = await response.json().catch(() => ({ message: response.statusText }));
    const mensaje = cuerpo.message ?? cuerpo.mensaje ?? `Error HTTP ${response.status}`;
    // 409 con horasTotales/limite/opciones = conflicto de sobrecarga diaria (US-07/US-08).
    const esConflictoSobrecarga = response.status === 409 && cuerpo.horasTotales != null;
    throw new ApiError(
      mensaje,
      esConflictoSobrecarga
        ? { horasTotales: cuerpo.horasTotales, limite: cuerpo.limite, opciones: cuerpo.opciones ?? [] }
        : null
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
