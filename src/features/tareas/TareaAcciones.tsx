import { useState } from 'react';
import { tareasApi } from '../../api/tareasApi';
import { ApiError } from '../../domain/types';
import type { TareaLogistica } from '../../domain/types';
import { formatearFechaCorta } from '../../ui/format';
import { Modal } from '../../ui/Modal';
import type { Conflicto, ResolucionConflicto } from '../../ui/ConflictoBox';

// ARCHITECTURAL TRACE: Frontend feature — acciones sobre una gestión logística
// (US-06 ejecutar, US-07/US-08 reprogramar con detección de sobrecarga, US-09
// posponer con nota). Reemplaza los prompt()/confirm() nativos por los modales
// accesibles del diseño. Se reutiliza en "Hoy" y en el detalle del evento.
type Modo = null | 'posponer' | 'reprogramar' | 'eliminar';

function fechaValida(valor: string): boolean {
  return !!valor && !Number.isNaN(new Date(`${valor}T00:00:00`).getTime());
}

export function TareaAcciones({
  tarea,
  onCambio,
  onConflicto,
  conEliminar = false
}: {
  tarea: TareaLogistica;
  onCambio: () => void;
  onConflicto: (conflicto: Conflicto | null) => void;
  conEliminar?: boolean;
}) {
  const [modo, setModo] = useState<Modo>(null);
  const [nota, setNota] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState(tarea.fechaLimite.slice(0, 10));
  const [errorFecha, setErrorFecha] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [falloMensaje, setFalloMensaje] = useState<string | null>(null);

  function cerrar() { setModo(null); }

  // 409 con detalle de sobrecarga => aviso de conflicto; cualquier otro error => modal.
  function manejarError(err: unknown) {
    setModo(null);
    if (err instanceof ApiError && err.conflicto) {
      onConflicto({
        ...err.conflicto,
        mensaje: err.message,
        fechaPropuesta: nuevaFecha,
        horasActuales: tarea.horasEstimadas,
        tipo: 'gestionar',
        tareaId: tarea.id,
        resolver: async (resolucion: ResolucionConflicto) => {
          if (resolucion.tipo === 'fecha') {
            await tareasApi.reprogramar(tarea.id, resolucion.valor);
            onCambio();
            return `"${tarea.titulo}" quedó programada para ${formatearFechaCorta(resolucion.valor)}.`;
          }
          if (resolucion.tipo === 'horas') {
            await tareasApi.actualizar(tarea.id, {
              titulo: tarea.titulo,
              descripcion: tarea.descripcion ?? undefined,
              fechaLimite: nuevaFecha,
              horasEstimadas: resolucion.valor
            });
            onCambio();
            return `Se actualizaron las horas de "${tarea.titulo}" a ${resolucion.valor} h.`;
          }
          await tareasApi.marcarEstado(tarea.id, 'Pospuesta');
          onCambio();
          return `"${tarea.titulo}" quedó pospuesta.`;
        }
      });
    } else {
      setFalloMensaje(err instanceof Error ? err.message : 'Ha ocurrido un error. Inténtalo de nuevo.');
    }
  }

  async function ejecutar(accion: () => Promise<unknown>) {
    onConflicto(null);
    setProcesando(true);
    try {
      await accion();
      setModo(null);
      onCambio();
    } catch (err) {
      manejarError(err);
    } finally {
      setProcesando(false);
    }
  }

  function completar() {
    return ejecutar(() => tareasApi.marcarEstado(tarea.id, 'Completada'));
  }
  function posponer() {
    return ejecutar(() => tareasApi.marcarEstado(tarea.id, 'Pospuesta', nota.trim() || undefined));
  }
  function reprogramar() {
    if (!fechaValida(nuevaFecha)) { setErrorFecha('Selecciona una fecha válida para la gestión.'); return; }
    return ejecutar(() => tareasApi.reprogramar(tarea.id, nuevaFecha));
  }
  function eliminar() {
    return ejecutar(() => tareasApi.eliminar(tarea.id));
  }

  return (
    <>
      <div className="hoy-card__acciones">
        <button className="btn btn-primary" disabled={procesando} onClick={completar}>✔ Ejecutada</button>
        <button className="btn btn-outline" disabled={procesando} onClick={() => { setNota(''); setModo('posponer'); }}>
          Posponer
        </button>
        <button
          className="btn btn-outline"
          disabled={procesando}
          onClick={() => { setNuevaFecha(tarea.fechaLimite.slice(0, 10)); setErrorFecha(null); setModo('reprogramar'); }}
        >
          Reprogramar
        </button>
        {conEliminar && (
          <button className="btn btn-outline btn-outline--danger" disabled={procesando} onClick={() => setModo('eliminar')}>
            Eliminar
          </button>
        )}
      </div>

      {modo === 'posponer' && (
        <Modal
          titulo="Posponer gestión"
          onCerrar={cerrar}
          acciones={
            <>
              <button className="btn btn-outline" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" style={{ width: 'auto' }} disabled={procesando} onClick={posponer}>
                {procesando ? 'Guardando…' : 'Posponer'}
              </button>
            </>
          }
        >
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`nota-${tarea.id}`}>Nota (opcional)</label>
            <input
              id={`nota-${tarea.id}`}
              placeholder="Ej: esperando confirmación del salón"
              value={nota}
              onChange={e => setNota(e.target.value)}
            />
          </div>
        </Modal>
      )}

      {modo === 'reprogramar' && (
        <Modal
          titulo="Reprogramar gestión"
          onCerrar={cerrar}
          acciones={
            <>
              <button className="btn btn-outline" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" style={{ width: 'auto' }} disabled={procesando} onClick={reprogramar}>
                {procesando ? 'Guardando…' : 'Guardar nueva fecha'}
              </button>
            </>
          }
        >
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`fecha-${tarea.id}`}>Nueva fecha *</label>
            <input
              id={`fecha-${tarea.id}`}
              type="date"
              value={nuevaFecha}
              onChange={e => { setNuevaFecha(e.target.value); setErrorFecha(null); }}
              aria-invalid={!!errorFecha}
              aria-describedby={errorFecha ? `fecha-${tarea.id}-error` : undefined}
            />
            {errorFecha && <p id={`fecha-${tarea.id}-error`} className="error-text" role="alert">{errorFecha}</p>}
          </div>
        </Modal>
      )}

      {modo === 'eliminar' && (
        <Modal
          titulo="¿Eliminar gestión?"
          onCerrar={cerrar}
          acciones={
            <>
              <button className="btn btn-outline" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-outline btn-outline--danger" disabled={procesando} onClick={eliminar}>
                {procesando ? 'Eliminando…' : 'Eliminar gestión'}
              </button>
            </>
          }
        >
          Se eliminará "{tarea.titulo}". Esta acción no se puede deshacer.
        </Modal>
      )}

      {falloMensaje && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setFalloMensaje(null)}
          acciones={
            <button className="btn btn-outline btn-outline--danger" onClick={() => setFalloMensaje(null)}>Cerrar</button>
          }
        >
          {falloMensaje}
        </Modal>
      )}
    </>
  );
}
