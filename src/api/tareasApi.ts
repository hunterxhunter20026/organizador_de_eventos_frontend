import { httpRequest } from './httpClient';
import type { HoyRespuesta, Tarea } from '../domain/tarea';

export const hoyApi = {
  obtener: (filtros: { eventoId?: number; estado?: string } = {}) => {
    const q = new URLSearchParams();
    if (filtros.eventoId) q.set('eventoId', String(filtros.eventoId));
    if (filtros.estado) q.set('estado', filtros.estado);
    const s = q.toString();
    return httpRequest<HoyRespuesta>(`/api/hoy${s ? `?${s}` : ''}`);
  }
};

export const tareasApi = {
  listarPorEvento: (eventoId: number) => httpRequest<Tarea[]>(`/api/eventos/${eventoId}/tareas`),

  crear: (
    eventoId: number,
    datos: { usuarioId: number; titulo: string; descripcion?: string; fechaLimite: string; horasEstimadas: number; estado?: string }
  ) => httpRequest<Tarea>(`/api/eventos/${eventoId}/tareas`, { method: 'POST', body: JSON.stringify(datos) }),

  eliminar: (id: number) => httpRequest<void>(`/api/tareas/${id}`, { method: 'DELETE' }),

  reprogramar: (id: number, nuevoPlazo: string) =>
    httpRequest<Tarea>(`/api/tareas/${id}/reprogramar`, { method: 'PUT', body: JSON.stringify({ nuevoPlazo }) }),

  marcarEstado: (id: number, estado: string, nota?: string) =>
    httpRequest<Tarea>(`/api/tareas/${id}/estado`, { method: 'PATCH', body: JSON.stringify({ estado, nota }) })
};