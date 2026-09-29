// ARCHITECTURAL TRACE: Frontend — tipos espejo de los DTOs del backend
// (application.dto.*). Mantener sincronizados manualmente con el contrato REST.
//
// NOTA DE ALCANCE: el backend actual (organizador_de_eventos_backend) solo
// implementa CRUD de Eventos y Usuarios. Los tipos de subtareas/vista-hoy/
// configuración se dejan declarados para no romper las pantallas que ya
// existían, pero esas pantallas NO llaman al backend todavía — se
// conectarán en un próximo sprint cuando esos endpoints existan.

export type EstadoSubtarea = 'PENDIENTE' | 'HECHO' | 'POSPUESTA';
export type Urgencia = 'ALTO' | 'MEDIO' | 'BAJO';
export type Severidad = 'ALTA' | 'MEDIA' | 'BAJA';

// --- Conectado al backend actual ---

export interface Evento {
  id: number;
  usuarioId: number;
  nombre: string;
  descripcion: string | null;
  fechaEvento: string; // ISO date (yyyy-MM-dd)
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

// --- Todavía NO implementado en el backend (fuera de alcance de este sprint) ---

export interface Subtarea {
  id: string;
  nombre: string;
  categoria: string | null;
  plazo: string | null;
  horasEstimadas: number;
  criticidadProveedorAlta: boolean;
  estado: EstadoSubtarea;
  nota: string | null;
}

export interface Conflicto {
  fecha: string;
  horasTotales: number;
  horasExcedentes: number;
  subtareasInvolucradas: Subtarea[];
  severidad: Severidad;
}

export interface VistaHoyItem {
  subtarea: Subtarea;
  urgencia: Urgencia;
}

export interface ReprogramarResultado {
  evento: Evento;
  conflicto: Conflicto | null;
}
