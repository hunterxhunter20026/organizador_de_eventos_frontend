import { httpRequest } from './httpClient';
import type { Evento, Progreso, TipoEvento, Usuario } from '../domain/types';

// ARCHITECTURAL TRACE: Frontend — cliente tipado del backend, un método por
// endpoint existente en organizador_de_eventos_backend (ya completo).
// El usuarioId ya NO se envía desde el cliente: EventoService lo asigna
// siempre a partir del token de sesión (AuthContext), nunca del body.

export interface DatosEvento {
  nombre: string;
  tipo?: TipoEvento;
  clienteContacto?: string;
  descripcion?: string;
  fechaEvento: string;
  lugar?: string;
  plazoLimite?: string;
  // Solo relevante al actualizar: EventoService guarda el objeto tal cual llega
  // (no hace merge parcial), así que si se omite aquí el backend lo pondría en null.
  estado?: string;
}

export const eventosApi = {
  listar: () => httpRequest<Evento[]>('/api/eventos'),

  obtenerPorId: (id: number) => httpRequest<Evento>(`/api/eventos/${id}`),

  crear: (datos: DatosEvento) =>
    httpRequest<Evento>('/api/eventos', {
      method: 'POST',
      body: JSON.stringify(datos)
    }),

  actualizar: (id: number, datos: DatosEvento) =>
    httpRequest<Evento>(`/api/eventos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos)
    }),

  eliminar: (id: number) =>
    httpRequest<void>(`/api/eventos/${id}`, { method: 'DELETE' }),

  buscarPorNombre: (nombre: string) =>
    httpRequest<Evento[]>(`/api/eventos/buscar?nombre=${encodeURIComponent(nombre)}`),

  buscarPorEstado: (estado: string) =>
    httpRequest<Evento[]>(`/api/eventos/estado?estado=${encodeURIComponent(estado)}`),

  progreso: (id: number) => httpRequest<Progreso>(`/api/eventos/${id}/progreso`)
};

export const usuariosApi = {
  listar: () => httpRequest<Usuario[]>('/api/usuarios'),

  obtenerPorId: (id: number) => httpRequest<Usuario>(`/api/usuarios/${id}`),

  crear: (datos: { nombre: string; email: string; passwordHash: string; limiteHorasDiarias?: number }) =>
    httpRequest<Usuario>('/api/usuarios', {
      method: 'POST',
      body: JSON.stringify(datos)
    }),

  actualizar: (id: number, datos: { nombre: string; email: string; passwordHash: string; limiteHorasDiarias?: number }) =>
    httpRequest<Usuario>(`/api/usuarios/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos)
    }),

  eliminar: (id: number) =>
    httpRequest<void>(`/api/usuarios/${id}`, { method: 'DELETE' }),

  buscarPorNombre: (nombre: string) =>
    httpRequest<Usuario[]>(`/api/usuarios/buscar?nombre=${encodeURIComponent(nombre)}`),

  buscarPorEmail: (email: string) =>
    httpRequest<Usuario>(`/api/usuarios/email?email=${encodeURIComponent(email)}`)
};
