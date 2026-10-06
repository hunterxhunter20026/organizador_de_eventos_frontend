// ARCHITECTURAL TRACE: Frontend — utilidades de presentación (sin lógica de negocio)

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic'];

export function formatearFechaCorta(iso: string): string {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return `${dia} de ${MESES[mes - 1]}`;
}

export function formatearFechaLarga(iso: string): string {
  const [anio, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return `${dia} ${MESES[mes - 1]}. ${anio}`;
}

export function hoyIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Deriva la etiqueta/color visual de urgencia comparando el plazo contra
 * hoy — puramente cosmético. El orden real de la lista ya viene calculado
 * por VistaHoyService en el backend (US-010); esto solo distingue
 * "vencida" de "vence hoy" para el color del borde, ambos ALTO en el
 * modelo de urgencia del backend.
 */
export function clasificarParaVistaHoy(plazoIso: string | null, criticidadProveedorAlta: boolean) {
  const hoy = hoyIso();
  if (plazoIso && plazoIso < hoy) return { etiqueta: 'Vencida', claseModificadora: 'vista-hoy-item--vencida' };
  if (plazoIso && plazoIso === hoy) return { etiqueta: 'Vence hoy', claseModificadora: 'vista-hoy-item--vence-hoy' };
  if (criticidadProveedorAlta) return { etiqueta: 'Alta criticidad', claseModificadora: '' };
  return { etiqueta: 'Próxima', claseModificadora: '' };
}
