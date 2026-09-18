import { httpRequest } from './httpClient';
import type { Evento, ReprogramarResultado, VistaHoyItem } from '../domain/types';

// ARCHITECTURAL TRACE: Frontend — cliente tipado del backend (un método por endpoint)

export const authApi = {
  login: (email: string, password: string) =>
    httpRequest<{ token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
};

export const eventosApi = {
  listar: () => httpRequest<Evento[]>('/api/eventos'),

  crear: (nombre: string, fecha: string, ubicacion: string) =>
    httpRequest<Evento>('/api/eventos', {
      method: 'POST',
      body: JSON.stringify({ nombre, fecha, ubicacion })
    }),

  agregarSubtarea: (eventoId: string, nombre: string, categoria: string, plazo: string,
                     horasEstimadas: number, criticidadProveedorAlta: boolean) =>
    httpRequest<Evento>(`/api/eventos/${eventoId}/subtareas`, {
      method: 'POST',
      body: JSON.stringify({ nombre, categoria, plazo, horasEstimadas, criticidadProveedorAlta })
    }),

  editarSubtarea: (eventoId: string, subtareaId: string, nombre: string, categoria: string, horasEstimadas: number) =>
    httpRequest<Evento>(`/api/eventos/${eventoId}/subtareas/${subtareaId}`, {
      method: 'PUT',
      body: JSON.stringify({ nombre, categoria, horasEstimadas })
    }),

  reprogramarSubtarea: (eventoId: string, subtareaId: string, nuevaFecha: string) =>
    httpRequest<ReprogramarResultado>(`/api/eventos/${eventoId}/subtareas/${subtareaId}/reprogramar`, {
      method: 'POST',
      body: JSON.stringify({ nuevaFecha })
    }),

  marcarProgreso: (eventoId: string, subtareaId: string, estado: string, nota?: string) =>
    httpRequest<Evento>(`/api/eventos/${eventoId}/subtareas/${subtareaId}/progreso`, {
      method: 'PATCH',
      body: JSON.stringify({ estado, nota })
    })
};

export const vistaHoyApi = {
  obtener: () => httpRequest<{ items: VistaHoyItem[] }>('/api/vista-hoy')
};

export const configuracionApi = {
  configurarLimiteDiario: (horas: number) =>
    httpRequest<void>('/api/configuracion/limite-diario', {
      method: 'PUT',
      body: JSON.stringify({ horas })
    })
};
