export interface Tarea {
  id: number;
  eventoId: number;
  usuarioId: number;
  titulo: string;
  descripcion?: string | null;
  fechaLimite: string;
  horasEstimadas: number;
  estado?: string | null;
  fechaEjecucion?: string | null;
  notaEjecucion?: string | null;
}

export interface HoyRespuesta {
  regla?: string;
  vencidas: Tarea[];
  paraHoy: Tarea[];
  proximas: Tarea[];
}

// Si el back usa otros textos para el estado, cámbialos solo aquí.
export const ESTADO = {
  pendiente: 'Pendiente',
  ejecutada: 'Ejecutada',
  pospuesta: 'Pospuesta'
} as const;