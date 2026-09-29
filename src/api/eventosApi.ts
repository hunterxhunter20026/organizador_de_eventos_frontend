import { httpRequest } from './httpClient';
import type { Evento, Usuario } from '../domain/types';

// ARCHITECTURAL TRACE: Frontend — cliente tipado del backend, un método por
// endpoint REALMENTE existente en organizador_de_eventos_backend.
// Los métodos de subtareas / vista-hoy / configuración se retiraron de aquí
// porque esos endpoints no existen todavía en el backend — se agregarán en
// el sprint en que se implementen, en vez de dejar llamadas que siempre
// fallarían con 404.

export const eventosApi = {
  listar: () => httpRequest<Evento[]>('/api/eventos'),

  obtenerPorId: (id: number) => httpRequest<Evento>(`/api/eventos/${id}`),

  crear: (datos: { usuarioId: number; nombre: string; descripcion?: string; fechaEvento: string; estado?: string }) =>
    httpRequest<Evento>('/api/eventos', {
      method: 'POST',
      body: JSON.stringify(datos)
    }),

  actualizar: (id: number, datos: { usuarioId: number; nombre: string; descripcion?: string; fechaEvento: string; estado?: string }) =>
    httpRequest<Evento>(`/api/eventos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(datos)
    }),

  eliminar: (id: number) =>
    httpRequest<void>(`/api/eventos/${id}`, { method: 'DELETE' }),

  buscarPorNombre: (nombre: string) =>
    httpRequest<Evento[]>(`/api/eventos/buscar?nombre=${encodeURIComponent(nombre)}`),

  buscarPorUsuarioId: (usuarioId: number) =>
    httpRequest<Evento[]>(`/api/eventos/usuario/${usuarioId}`),

  buscarPorEstado: (estado: string) =>
    httpRequest<Evento[]>(`/api/eventos/estado?estado=${encodeURIComponent(estado)}`)
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
