// ARCHITECTURAL TRACE: Frontend — tipos espejo de los DTOs del backend
// (co.edu.univalle.demo.dto / .model). Backend ya completo: Eventos,
// Usuarios, Tareas logísticas, Hoy, Configuración y Auth (US-01 a US-12).

export type TipoEvento = 'boda' | 'social' | 'corporativo' | 'cumpleanos' | 'otro';
export type EstadoTarea = 'Pendiente' | 'Completada' | 'Pospuesta';

export interface Evento {
  id: number;
  usuarioId: number;
  nombre: string;
  tipo: TipoEvento | null;
  clienteContacto: string | null;
  descripcion: string | null;
  fechaEvento: string; // ISO date (yyyy-MM-dd)
  lugar: string | null;
  plazoLimite: string | null; // ISO date
  estado: string | null;
  fechaCreacion: string | null;
}

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  passwordHash: string;
  limiteHorasDiarias: number | null;
  fechaCreacion: string | null;
}

export interface TareaLogistica {
  id: number;
  eventoId: number;
  usuarioId: number;
  titulo: string;
  descripcion: string | null;
  fechaLimite: string; // ISO date
  horasEstimadas: number;
  estado: EstadoTarea;
  fechaEjecucion: string | null;
  notaEjecucion: string | null;
  fechaCreacion: string | null;
}

export interface Progreso {
  total: number;
  completadas: number;
  porcentaje: number;
}

export interface HoyResponse {
  regla: string;
  vencidas: TareaLogistica[];
  paraHoy: TareaLogistica[];
  proximas: TareaLogistica[];
}

export interface LimiteDiario {
  limiteHorasDiarias: number;
}

export interface UsuarioResumen {
  id: number;
  nombre: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  usuario: UsuarioResumen;
}

/** Detalle de un conflicto de sobrecarga diaria (US-07/US-08), adjunto a un ApiError. */
export interface ConflictoSobrecarga {
  horasTotales: number;
  limite: number;
  opciones: string[];
}

/** Error enriquecido: si el backend respondió 409 con detalle de sobrecarga, viene en `conflicto`. */
export class ApiError extends Error {
  conflicto: ConflictoSobrecarga | null;

  constructor(mensaje: string, conflicto: ConflictoSobrecarga | null = null) {
    super(mensaje);
    this.conflicto = conflicto;
  }
}
