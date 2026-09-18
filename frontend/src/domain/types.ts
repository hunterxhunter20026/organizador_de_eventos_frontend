// ARCHITECTURAL TRACE: Frontend — tipos espejo de los DTOs del backend
// (application.dto.*). Mantener sincronizados manualmente con el contrato REST.

export type EstadoSubtarea = 'PENDIENTE' | 'HECHO' | 'POSPUESTA';
export type Urgencia = 'ALTO' | 'MEDIO' | 'BAJO';
export type Severidad = 'ALTA' | 'MEDIA' | 'BAJA';

export interface Subtarea {
  id: string;
  nombre: string;
  categoria: string | null;
  plazo: string | null; // ISO date
  horasEstimadas: number;
  criticidadProveedorAlta: boolean;
  estado: EstadoSubtarea;
  nota: string | null;
}

export interface Evento {
  id: string;
  nombre: string;
  fecha: string;
  ubicacion: string;
  progreso: number; // 0..1
  subtareas: Subtarea[];
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
