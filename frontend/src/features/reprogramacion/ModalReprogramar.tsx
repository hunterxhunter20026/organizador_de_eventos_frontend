import { useState } from 'react';
import { eventosApi } from '../../api/eventosApi';
import type { Conflicto, Evento } from '../../domain/types';
import { formatearFechaCorta } from '../../ui/format';

// ARCHITECTURAL TRACE: Frontend feature — reprogramación. Traza: US-012, US-013, US-014, R-02
// Diseño: Imagen 2 ("Reprogramar gestión")
export function ModalReprogramar({
  evento, subtareaIdInicial, onCerrar, onActualizado
}: {
  evento: Evento;
  subtareaIdInicial: string;
  onCerrar: () => void;
  onActualizado: (evento: Evento) => void;
}) {
  const subtareaInicial = evento.subtareas.find(s => s.id === subtareaIdInicial) ?? evento.subtareas[0];
  const [subtareaId, setSubtareaId] = useState(subtareaInicial.id);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [conflicto, setConflicto] = useState<Conflicto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const subtareaSeleccionada = evento.subtareas.find(s => s.id === subtareaId)!;

  async function confirmar(fechaObjetivo: string) {
    if (!fechaObjetivo) return;
    setCargando(true);
    setError(null);
    try {
      const resultado = await eventosApi.reprogramarSubtarea(evento.id, subtareaId, fechaObjetivo);
      onActualizado(resultado.evento);
      setConflicto(resultado.conflicto);
      if (!resultado.conflicto) onCerrar();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos reprogramar la subtarea.');
    } finally {
      setCargando(false);
    }
  }

  async function reducirHorasEstimadas() {
    const nuevasHoras = window.prompt('Nuevas horas estimadas:', String(subtareaSeleccionada.horasEstimadas));
    if (!nuevasHoras) return;
    const horas = Number(nuevasHoras);
    if (Number.isNaN(horas) || horas <= 0) return;
    const eventoActualizado = await eventosApi.editarSubtarea(
      evento.id, subtareaId, subtareaSeleccionada.nombre, subtareaSeleccionada.categoria ?? '', horas);
    onActualizado(eventoActualizado);
    setConflicto(null);
    onCerrar();
  }

  function moverUnDiaDespues() {
    if (!conflicto) return;
    const [a, m, d] = conflicto.fecha.split('-').map(Number);
    const siguiente = new Date(Date.UTC(a, m - 1, d + 1)).toISOString().slice(0, 10);
    setNuevaFecha(siguiente);
    confirmar(siguiente);
  }

  return (
    <div className="card" role="dialog" aria-modal="true">
      <button className="link-back" onClick={onCerrar}>← Volver al evento</button>
      <h2 className="title">Reprogramar gestión</h2>
      <p className="subtitle">Retrasaste la búsqueda de un proveedor. Elige la nueva fecha.</p>

      <div className="field">
        <label htmlFor="select-subtarea">Subtarea a reprogramar</label>
        <select id="select-subtarea" value={subtareaId} onChange={e => { setSubtareaId(e.target.value); setConflicto(null); }}>
          {evento.subtareas.map(s => (
            <option key={s.id} value={s.id}>
              {s.nombre}{s.plazo ? ` — vence ${formatearFechaCorta(s.plazo)}` : ''}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="nueva-fecha">Nueva fecha</label>
        <input id="nueva-fecha" type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} required />
      </div>

      {error && <p className="error-text" role="alert">{error}</p>}

      {conflicto && (
        <div className="conflicto-box">
          <p className="conflicto-box__titulo">⚠ Conflicto de sobrecarga — {formatearFechaCorta(conflicto.fecha)}</p>
          <p className="conflicto-box__texto">
            <strong>{conflicto.horasTotales}h</strong> asignadas ese día,{' '}
            <strong>{conflicto.horasExcedentes}h</strong> por encima de tu límite.
          </p>
          <p className="conflicto-box__texto">
            Gestiones involucradas: {conflicto.subtareasInvolucradas.map(s => s.nombre).join(', ')}.
          </p>
          <div className="conflicto-box__acciones">
            <button className="btn btn-outline btn-outline--danger" onClick={moverUnDiaDespues} disabled={cargando}>
              Mover un día después (reintentar)
            </button>
            <button className="btn btn-outline" onClick={reducirHorasEstimadas}>
              Reducir horas estimadas
            </button>
          </div>
        </div>
      )}

      <button className="btn btn-primary" style={{ marginTop: conflicto ? 4 : 20 }}
              onClick={() => confirmar(nuevaFecha)} disabled={cargando || !nuevaFecha}>
        {cargando ? 'Guardando…' : 'Confirmar reprogramación'}
      </button>
    </div>
  );
}
