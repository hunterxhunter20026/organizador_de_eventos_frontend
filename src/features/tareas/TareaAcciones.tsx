import { useState } from 'react';
import { tareasApi } from '../../api/tareasApi';
import { ApiError } from '../../domain/types';
import type { TareaLogistica } from '../../domain/types';
import { formatearFechaCorta } from '../../ui/format';
import { Modal } from '../../ui/Modal';
import type { Conflicto, ResolucionConflicto } from '../../ui/ConflictoBox';
import { ICONOS_GESTION } from './iconosGestion';

// ARCHITECTURAL TRACE: Frontend feature — acciones sobre una gestión logística
// (US-06 ejecutar, US-07/US-08 reprogramar con detección de sobrecarga, US-09
// posponer con nota). Reemplaza los prompt()/confirm() nativos por los modales
// accesibles del diseño. Se reutiliza en "Hoy" y en el detalle del evento.
type Modo = null | 'editar' | 'posponer' | 'eliminar';

function fechaValida(valor: string): boolean {
  return !!valor && !Number.isNaN(new Date(`${valor}T00:00:00`).getTime());
}

export function TareaAcciones({
  tarea,
  onCambio,
  onConflicto,
  conEliminar = false,
  conEditar = false
}: {
  tarea: TareaLogistica;
  onCambio: () => void;
  onConflicto: (conflicto: Conflicto | null) => void;
  conEliminar?: boolean;
  conEditar?: boolean;
}) {
  const [modo, setModo] = useState<Modo>(null);
  const [nota, setNota] = useState('');
  const [nuevoTitulo, setNuevoTitulo] = useState(tarea.titulo);
  const [nuevaFecha, setNuevaFecha] = useState(tarea.fechaLimite.slice(0, 10));
  const [nuevasHoras, setNuevasHoras] = useState(String(tarea.horasEstimadas));
  const [nuevoEstado, setNuevoEstado] = useState(tarea.estado);
  const [nuevoIcono, setNuevoIcono] = useState(tarea.icono || '📌');
  const [nuevaNotaEstado, setNuevaNotaEstado] = useState(tarea.notaEjecucion ?? '');
  const [errorTitulo, setErrorTitulo] = useState<string | null>(null);
  const [errorFecha, setErrorFecha] = useState<string | null>(null);
  const [errorHoras, setErrorHoras] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [falloMensaje, setFalloMensaje] = useState<string | null>(null);

  function cerrar() { setModo(null); }
  function validarCambios(requiereTitulo: boolean) {
    const horas = Number(nuevasHoras);
    setErrorTitulo(requiereTitulo && !nuevoTitulo.trim() ? 'Escribe el nombre de la gestión.' : null);
    setErrorFecha(fechaValida(nuevaFecha) ? null : 'Selecciona una fecha válida para la gestión.');
    setErrorHoras(Number.isFinite(horas) && horas > 0 ? null : 'Las horas deben ser mayores a 0.');
    return (!requiereTitulo || !!nuevoTitulo.trim()) && fechaValida(nuevaFecha) && Number.isFinite(horas) && horas > 0;
  }

  // 409 con detalle de sobrecarga => aviso de conflicto; cualquier otro error => modal.
  function manejarError(err: unknown) {
    setModo(null);
    if (err instanceof ApiError && err.conflicto) {
      onConflicto({
        ...err.conflicto,
        mensaje: err.message,
        fechaPropuesta: nuevaFecha,
        horasActuales: Number(nuevasHoras),
        tipo: 'gestionar',
        tareaId: tarea.id,
        puedePosponer: tarea.estado !== 'Pospuesta',
        resolver: async (resolucion: ResolucionConflicto) => {
          if (resolucion.tipo === 'fecha') {
            await guardarCambios(resolucion.valor, Number(nuevasHoras));
            onCambio();
            return `"${tarea.titulo}" quedó programada para ${formatearFechaCorta(resolucion.valor)}.`;
          }
          if (resolucion.tipo === 'horas') {
            await guardarCambios(nuevaFecha, resolucion.valor);
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
  async function guardarCambios(fechaLimite: string, horasEstimadas: number) {
    await tareasApi.actualizar(tarea.id, {
      titulo: nuevoTitulo.trim(),
      descripcion: tarea.descripcion ?? undefined,
      icono: nuevoIcono,
      fechaLimite,
      horasEstimadas
    });
    if (nuevoEstado !== tarea.estado || (nuevoEstado === 'Pospuesta' && nuevaNotaEstado !== (tarea.notaEjecucion ?? ''))) {
      await tareasApi.marcarEstado(
        tarea.id,
        nuevoEstado,
        nuevoEstado === 'Pospuesta' ? nuevaNotaEstado.trim() || undefined : undefined
      );
    }
  }
  function editar() {
    if (!validarCambios(true)) return;
    return ejecutar(() => guardarCambios(nuevaFecha, Number(nuevasHoras)));
  }
  function eliminar() {
    return ejecutar(() => tareasApi.eliminar(tarea.id));
  }
  function cambiarEstado(estado: 'Pendiente' | 'Completada') {
    return ejecutar(() => tareasApi.marcarEstado(tarea.id, estado));
  }

  return (
    <>
      {(tarea.estado === 'Pendiente' || tarea.estado === 'Pospuesta' || conEditar) && (
        <div className="hoy-card__acciones">
          {tarea.estado === 'Pendiente' && (
            <>
              <button className="btn btn-primary" disabled={procesando} onClick={completar}>
                Hecho <span aria-hidden="true">✔</span>
              </button>
              <button className="btn btn-warning" disabled={procesando} onClick={() => { setNota(''); setModo('posponer'); }}>
                Posponer
              </button>
            </>
          )}
          {tarea.estado === 'Pospuesta' && (
            <button className="btn btn-primary" disabled={procesando} onClick={() => cambiarEstado('Completada')}>
              Hecho <span aria-hidden="true">✔</span>
            </button>
          )}
          {(conEditar || tarea.estado === 'Pendiente' || tarea.estado === 'Pospuesta') && (
            <button
              className="btn btn-outline"
              disabled={procesando}
              onClick={() => {
                setNuevoTitulo(tarea.titulo);
                setNuevaFecha(tarea.fechaLimite.slice(0, 10));
                setNuevasHoras(String(tarea.horasEstimadas));
                setNuevoEstado(tarea.estado);
                setNuevoIcono(tarea.icono || '📌');
                setNuevaNotaEstado(tarea.notaEjecucion ?? '');
                setErrorTitulo(null); setErrorFecha(null); setErrorHoras(null);
                setModo('editar');
              }}
            >
              Editar
            </button>
          )}
          {conEliminar && (
            <button className="btn btn-outline btn-outline--danger" disabled={procesando} onClick={() => setModo('eliminar')}>
              Eliminar
            </button>
          )}
        </div>
      )}

      {modo === 'editar' && (
        <Modal
          titulo="Editar gestión"
          onCerrar={cerrar}
          acciones={
            <>
              <button className="btn btn-outline" onClick={cerrar}>Cancelar</button>
              <button className="btn btn-primary" style={{ width: 'auto' }} disabled={procesando} onClick={editar}>
                {procesando ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </>
          }
        >
          <div className="field">
            <label htmlFor={`titulo-${tarea.id}`}>Nombre de la gestión *</label>
            <input
              id={`titulo-${tarea.id}`}
              value={nuevoTitulo}
              onChange={e => { setNuevoTitulo(e.target.value); setErrorTitulo(null); }}
              aria-invalid={!!errorTitulo}
            />
            {errorTitulo && <p className="error-text" role="alert">{errorTitulo}</p>}
          </div>
          <div className="field">
            <label htmlFor={`icono-${tarea.id}`}>Icono</label>
            <select
              id={`icono-${tarea.id}`}
              value={nuevoIcono}
              onChange={e => setNuevoIcono(e.target.value)}
            >
              {ICONOS_GESTION.map(opcion => (
                <option key={opcion.icono} value={opcion.icono}>{opcion.icono}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor={`fecha-${tarea.id}`}>Fecha límite *</label>
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
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor={`horas-${tarea.id}`}>Horas asignadas *</label>
            <input
              id={`horas-${tarea.id}`}
              type="number"
              min="0.5"
              step="0.5"
              value={nuevasHoras}
              onChange={e => { setNuevasHoras(e.target.value); setErrorHoras(null); }}
              aria-invalid={!!errorHoras}
            />
            {errorHoras && <p className="error-text" role="alert">{errorHoras}</p>}
          </div>
          <div className="field" style={{ marginTop: 18, marginBottom: 0 }}>
            <label htmlFor={`estado-${tarea.id}`}>Estado</label>
            <select
              id={`estado-${tarea.id}`}
              value={nuevoEstado}
              onChange={e => setNuevoEstado(e.target.value as TareaLogistica['estado'])}
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Pospuesta">Pospuesta</option>
              <option value="Completada">Completada</option>
            </select>
          </div>
          {nuevoEstado === 'Pospuesta' && (
            <div className="field" style={{ marginTop: 18, marginBottom: 0 }}>
              <label htmlFor={`nota-pospuesta-${tarea.id}`}>Nota opcional</label>
              <textarea
                id={`nota-pospuesta-${tarea.id}`}
                rows={2}
                value={nuevaNotaEstado}
                onChange={e => setNuevaNotaEstado(e.target.value)}
                placeholder="Indica por qué quedó pospuesta"
              />
            </div>
          )}
        </Modal>
      )}

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
