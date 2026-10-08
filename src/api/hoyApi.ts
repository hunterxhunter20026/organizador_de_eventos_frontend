import { httpRequest } from './httpClient';
import type { HoyResponse } from '../domain/types';

// ARCHITECTURAL TRACE: Frontend — vista "Hoy" (US-04, US-05).

export const hoyApi = {
  obtener: (filtros?: { eventoId?: number; estado?: string }) => {
    const params = new URLSearchParams();
    if (filtros?.eventoId != null) params.set('eventoId', String(filtros.eventoId));
    if (filtros?.estado) params.set('estado', filtros.estado);
    const query = params.toString();
    return httpRequest<HoyResponse>(`/api/hoy${query ? `?${query}` : ''}`);
  }
};
