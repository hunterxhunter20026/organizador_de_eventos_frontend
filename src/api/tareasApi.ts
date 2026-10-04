import { httpRequest } from './httpClient';
import type { EstadoTarea, TareaLogistica } from '../domain/types';

// ARCHITECTURAL TRACE: Frontend — cliente tipado de tareas logísticas
// (subtareas de un evento). US-02, US-03, US-06, US-07, US-08, US-09.

export interface DatosTarea {
  titulo: string;
  descripcion?: string;
  fechaLimite: string;
  horasEstimadas: number;
}

export const tareasApi = {
  listarPorEvento: (eventoId: number) =>
    httpRequest<TareaLogistica[]>(`/api/eventos/${eventoId}/tareas`),

  crear: (eventoId: number, datos: DatosTarea) =>
    httpRequest<TareaLogistica>(`/api/eventos/${eventoId}/tareas`, {
      method: 'POST',
      body: JSON.stringify(datos)
    }),

  actualizar: (id: number, datos: DatosTarea) =>
    httpRequest<TareaLogistica>(`/api/tareas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos)
    }),

  eliminar: (id: number) =>
    httpRequest<void>(`/api/tareas/${id}`, { method: 'DELETE' }),

  // Lanza ApiError con `conflicto` poblado si el backend responde 409 (US-07).
  marcarEstado: (id: number, estado: EstadoTarea, nota?: string) =>
    httpRequest<TareaLogistica>(`/api/tareas/${id}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, nota })
    }),

  // Lanza ApiError con `conflicto` poblado si el nuevo plazo supera el límite diario (US-07/US-08).
  reprogramar: (id: number, nuevoPlazo: string) =>
    httpRequest<TareaLogistica>(`/api/tareas/${id}/reprogramar`, {
      method: 'PUT',
      body: JSON.stringify({ nuevoPlazo })
    })
};
