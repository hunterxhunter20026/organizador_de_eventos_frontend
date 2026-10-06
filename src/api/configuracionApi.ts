import { httpRequest } from './httpClient';
import type { LimiteDiario } from '../domain/types';

// ARCHITECTURAL TRACE: Frontend — configuración de límite diario (US-12).

export const configuracionApi = {
  obtener: () => httpRequest<LimiteDiario>('/api/configuracion/limite-diario'),

  actualizar: (limiteHorasDiarias: number) =>
    httpRequest<LimiteDiario>('/api/configuracion/limite-diario', {
      method: 'PUT',
      body: JSON.stringify({ limiteHorasDiarias })
    })
};
