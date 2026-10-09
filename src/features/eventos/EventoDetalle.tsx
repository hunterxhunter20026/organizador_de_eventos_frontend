import { useEffect, useState } from 'react';
import { eventosApi } from '../../api/eventosApi';
import { tareasApi } from '../../api/tareasApi';
import { ApiError } from '../../domain/types';
import type { Evento, Progreso, TareaLogistica, TipoEvento } from '../../domain/types';
import { formatearFechaLarga, formatearFechaCorta } from '../../ui/format';
import { Badge, ProgressBar } from '../../ui/primitives';
import { Modal } from '../../ui/Modal';
import { ConflictoBox } from '../../ui/ConflictoBox';
import type { Conflicto, ResolucionConflicto } from '../../ui/ConflictoBox';
import { TareaAcciones } from '../tareas/TareaAcciones';
import { TIPOS, fechaValida } from './FormularioEvento';

// ARCHITECTURAL TRACE: Frontend feature — detalle de evento (US-01, US-02,
// US-03, US-10) + plan de gestiones logísticas (US-06, US-07, US-08, US-09).
// Editar/eliminar con microcopy y modales de la Guía de Diseño. El usuarioId
// nunca se edita aquí: EventoService lo fija a partir del usuario autenticado.
type ErroresEvento = { nombre?: string; fecha?: string; plazo?: string };
type ErroresTarea = { titulo?: string; fecha?: string; horas?: string };

export function EventoDetalle({ eventoInicial, onVolver }: { eventoInicial: Evento; onVolver: () => void }) {
  const [evento, setEvento] = useState<Evento>(eventoInicial);

  // --- Edición del evento ---
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(eventoInicial.nombre);
  const [tipo, setTipo] = useState<TipoEvento>(eventoInicial.tipo ?? 'social');
  const [clienteContacto, setClienteContacto] = useState(eventoInicial.clienteContacto ?? '');
  const [fechaEvento, setFechaEvento] = useState(eventoInicial.fechaEvento.slice(0, 10));
  const [lugar, setLugar] = useState(eventoInicial.lugar ?? '');
  const [plazoLimite, setPlazoLimite] = useState(eventoInicial.plazoLimite?.slice(0, 10) ?? '');
  const [estado, setEstado] = useState(eventoInicial.estado ?? 'Planificación');
  const [errores, setErrores] = useState<ErroresEvento>({});
  const [guardando, setGuardando] = useState(false);

  // Modales del evento
  const [actualizado, setActualizado] = useState(false);
  const [falloGuardar, setFalloGuardar] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [falloEliminar, setFalloEliminar] = useState<string | null>(null);

  // --- Progreso y gestiones logísticas ---
  const [progreso, setProgreso] = useState<Progreso | null>(null);
  const [tareas, setTareas] = useState<TareaLogistica[]>([]);
  const [cargandoTareas, setCargandoTareas] = useState(true);
  const [errorTareas, setErrorTareas] = useState(false);
  const [conflicto, setConflicto] = useState<Conflicto | null>(null);
  const [exitoGestion, setExitoGestion] = useState<string | null>(null);

  // Formulario "nueva gestión"
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [nuevasHoras, setNuevasHoras] = useState('1');
  const [erroresTarea, setErroresTarea] = useState<ErroresTarea>({});
  const [creandoTarea, setCreandoTarea] = useState(false);
  const [falloTarea, setFalloTarea] = useState<string | null>(null);

  function recargarTareasYProgreso() {
    setCargandoTareas(true);
    setErrorTareas(false);
    Promise.all([tareasApi.listarPorEvento(evento.id), eventosApi.progreso(evento.id)])
      .then(([listaTareas, prog]) => { setTareas(listaTareas); setProgreso(prog); })
      .catch(() => setErrorTareas(true))
      .finally(() => setCargandoTareas(false));
  }
  useEffect(() => { recargarTareasYProgreso(); }, [evento.id]);

  // ---------- Evento ----------
  function validar(): ErroresEvento {
    const e: ErroresEvento = {};
    if (!nombre.trim()) e.nombre = 'Escribe el nombre del evento para continuar.';
    if (!fechaValida(fechaEvento)) e.fecha = 'Selecciona una fecha válida para el evento.';
    if (plazoLimite && !fechaValida(plazoLimite)) e.plazo = 'Selecciona una fecha válida para el plazo.';
    return e;
  }

  function quitarError(campo: keyof ErroresEvento) {
    setErrores(prev => ({ ...prev, [campo]: undefined }));
  }

  function empezarEdicion() {
    setNombre(evento.nombre);
    setTipo(evento.tipo ?? 'social');
    setClienteContacto(evento.clienteContacto ?? '');
    setFechaEvento(evento.fechaEvento.slice(0, 10));
    setLugar(evento.lugar ?? '');
    setPlazoLimite(evento.plazoLimite?.slice(0, 10) ?? '');
    setEstado(evento.estado ?? 'Planificación');
    setErrores({});
    setEditando(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    try {
      // EventoService guarda el objeto tal cual llega (sin merge parcial): se
      // reenvía la descripción existente para que no quede en null.
      const resultado = await eventosApi.actualizar(evento.id, {
        nombre: nombre.trim(),
        tipo,
        clienteContacto: clienteContacto.trim() || undefined,
        descripcion: evento.descripcion ?? undefined,
        fechaEvento,
        lugar: lugar.trim() || undefined,
        plazoLimite: plazoLimite || undefined,
        estado
      });
      setEvento(resultado);
      setActualizado(true); // modal de éxito; se sale de la edición al aceptar
    } catch (err) {
      setFalloGuardar(err instanceof Error ? err.message : 'Ha ocurrido un error al guardar.'); // el formulario conserva lo escrito
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    setEliminando(true);
    try {
      await eventosApi.eliminar(evento.id);
      setConfirmando(false);
      onVolver();
    } catch (err) {
      setConfirmando(false);
      setFalloEliminar(err instanceof Error ? err.message : 'No se pudo eliminar el evento.');
    } finally {
      setEliminando(false);
    }
  }

  // ---------- Gestiones ----------
  function validarTarea(): ErroresTarea {
    const e: ErroresTarea = {};
    if (!nuevoTitulo.trim()) e.titulo = 'Escribe el nombre de la gestión para continuar.';
    if (!fechaValida(nuevaFecha)) e.fecha = 'Selecciona un plazo válido.';
    if (!nuevasHoras || Number(nuevasHoras) <= 0) e.horas = 'Las horas deben ser mayores a 0.';
    return e;
  }

  function quitarErrorTarea(campo: keyof ErroresTarea) {
    setErroresTarea(prev => ({ ...prev, [campo]: undefined }));
  }

  async function crearTarea(e: React.FormEvent) {
    e.preventDefault();
    setConflicto(null);
    setExitoGestion(null);
    const nuevos = validarTarea();
    setErroresTarea(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setCreandoTarea(true);
    try {
      await tareasApi.crear(evento.id, { titulo: nuevoTitulo.trim(), fechaLimite: nuevaFecha, horasEstimadas: Number(nuevasHoras) });
      setNuevoTitulo(''); setNuevaFecha(''); setNuevasHoras('1');
      recargarTareasYProgreso();
    } catch (err) {
      if (err instanceof ApiError && err.conflicto) {
        setConflicto({
          ...err.conflicto,
          mensaje: err.message,
          fechaPropuesta: nuevaFecha,
          horasActuales: Number(nuevasHoras),
          tipo: 'crear',
          resolver: async (resolucion: ResolucionConflicto) => {
            const fechaLimite = resolucion.tipo === 'fecha' ? resolucion.valor : nuevaFecha;
            const horasEstimadas = resolucion.tipo === 'horas' ? resolucion.valor : Number(nuevasHoras);
            await tareasApi.crear(evento.id, {
              titulo: nuevoTitulo.trim(),
              fechaLimite,
              horasEstimadas
            });
            setNuevoTitulo('');
            setNuevaFecha('');
            setNuevasHoras('1');
            recargarTareasYProgreso();
            return `La gestión "${nuevoTitulo.trim()}" se agregó para ${formatearFechaCorta(fechaLimite)}.`;
          }
        });
      } else {
        setFalloTarea(err instanceof Error ? err.message : 'No pudimos crear la gestión.');
      }
    } finally {
      setCreandoTarea(false);
    }
  }

  const modales = (
    <>
      {actualizado && (
        <Modal
          titulo="Evento actualizado"
          onCerrar={() => { setActualizado(false); setEditando(false); }}
          acciones={
            <button
              className="btn btn-primary"
              style={{ width: 'auto' }}
              onClick={() => { setActualizado(false); setEditando(false); }}
            >
              Aceptar
            </button>
          }
        >
          Los cambios del evento se guardaron correctamente.
        </Modal>
      )}

      {falloGuardar && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setFalloGuardar(null)}
          acciones={
            <button className="btn btn-outline btn-outline--danger" onClick={() => setFalloGuardar(null)}>Cerrar</button>
          }
        >
          {falloGuardar} Tus datos siguen en el formulario.
        </Modal>
      )}

      {confirmando && (
        <Modal
          titulo="¿Eliminar evento?"
          onCerrar={() => setConfirmando(false)}
          acciones={
            <>
              <button className="btn btn-outline" onClick={() => setConfirmando(false)}>Cancelar</button>
              <button className="btn btn-outline btn-outline--danger" onClick={eliminar} disabled={eliminando}>
                {eliminando ? 'Eliminando…' : 'Eliminar evento'}
              </button>
            </>
          }
        >
          Se eliminará el evento y todas sus tareas. Esta acción no se puede deshacer.
        </Modal>
      )}

      {falloEliminar && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setFalloEliminar(null)}
          acciones={
            <button className="btn btn-outline btn-outline--danger" onClick={() => setFalloEliminar(null)}>Cerrar</button>
          }
        >
          {falloEliminar}
        </Modal>
      )}

      {falloTarea && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setFalloTarea(null)}
          acciones={
            <button className="btn btn-outline btn-outline--danger" onClick={() => setFalloTarea(null)}>Cerrar</button>
          }
        >
          {falloTarea}
        </Modal>
      )}
    </>
  );

  if (editando) {
    return (
      <div className="card">
        <h2 className="title">Editar evento</h2>
        <p className="subtitle">Los campos con * son obligatorios.</p>
        <form onSubmit={guardar} noValidate>
          <div className="field">
            <label htmlFor="edit-nombre">Nombre del evento *</label>
            <input
              id="edit-nombre"
              placeholder="Ej: Feria de emprendimiento"
              value={nombre}
              onChange={e => { setNombre(e.target.value); quitarError('nombre'); }}
              aria-invalid={!!errores.nombre}
              aria-describedby={errores.nombre ? 'edit-nombre-error' : undefined}
            />
            {errores.nombre && <p id="edit-nombre-error" className="error-text" role="alert">{errores.nombre}</p>}
          </div>

          <div className="field">
            <label htmlFor="edit-tipo">Tipo</label>
            <select id="edit-tipo" value={tipo} onChange={e => setTipo(e.target.value as TipoEvento)}>
              {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
            </select>
          </div>

          <div className="field">
            <label htmlFor="edit-cliente">Cliente / contacto (opcional)</label>
            <input id="edit-cliente" value={clienteContacto} onChange={e => setClienteContacto(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="edit-fecha">Fecha del evento *</label>
            <input
              id="edit-fecha"
              type="date"
              value={fechaEvento}
              onChange={e => { setFechaEvento(e.target.value); quitarError('fecha'); }}
              aria-invalid={!!errores.fecha}
              aria-describedby={errores.fecha ? 'edit-fecha-error' : undefined}
            />
            {errores.fecha && <p id="edit-fecha-error" className="error-text" role="alert">{errores.fecha}</p>}
          </div>

          <div className="field">
            <label htmlFor="edit-lugar">Lugar (opcional)</label>
            <input id="edit-lugar" value={lugar} onChange={e => setLugar(e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="edit-plazo">Plazo límite de logística (opcional)</label>
            <input
              id="edit-plazo"
              type="date"
              value={plazoLimite}
              onChange={e => { setPlazoLimite(e.target.value); quitarError('plazo'); }}
              aria-invalid={!!errores.plazo}
              aria-describedby={errores.plazo ? 'edit-plazo-error' : undefined}
            />
            {errores.plazo && <p id="edit-plazo-error" className="error-text" role="alert">{errores.plazo}</p>}
          </div>

          <div className="field">
            <label htmlFor="edit-estado">Estado</label>
            <select id="edit-estado" value={estado} onChange={e => setEstado(e.target.value)}>
              <option value="Planificación">Planificación</option>
              <option value="En Progreso">En Progreso</option>
              <option value="Completado">Completado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ width: 'auto' }} type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button className="btn btn-outline" type="button" onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        </form>
        {modales}
      </div>
    );
  }

  return (
    <div className="card">
      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={onVolver}>
        Volver a eventos
      </button>
      <h2 className="title">{evento.nombre}</h2>
      <p className="subtitle">
        {formatearFechaLarga(evento.fechaEvento)} · {evento.estado ?? 'Sin estado'}
        {evento.lugar ? ` · ${evento.lugar}` : ''}
        {evento.clienteContacto ? ` · ${evento.clienteContacto}` : ''}
      </p>
      {evento.descripcion && <p className="subtitle">{evento.descripcion}</p>}

      <div style={{ display: 'flex', gap: 8, marginTop: 16, marginBottom: 20 }}>
        <button className="btn btn-outline" onClick={empezarEdicion}>Editar</button>
        <button className="btn btn-outline btn-outline--danger" onClick={() => setConfirmando(true)}>Eliminar</button>
      </div>

      {progreso && (
        <div style={{ marginBottom: 20 }}>
          <ProgressBar progreso={progreso.porcentaje / 100} hechas={progreso.completadas} total={progreso.total} />
        </div>
      )}

      <h3 style={{ fontSize: 16, margin: '0 0 12px 0' }}>Gestiones logísticas</h3>
      {exitoGestion && <p className="hoy-aviso" role="status">{exitoGestion}</p>}

      {cargandoTareas && (
        <div role="status" aria-label="Cargando gestiones">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      )}

      {errorTareas && (
        <div className="estado-centro" role="alert">
          <div className="estado-centro__icono" aria-hidden="true">!</div>
          <p className="estado-centro__texto">Ha ocurrido un error cargando la información, inténtalo de nuevo.</p>
          <button className="btn btn-outline" onClick={recargarTareasYProgreso}>Reintentar</button>
        </div>
      )}

      {!cargandoTareas && !errorTareas && tareas.length === 0 && (
        <p className="subtitle">Todavía no hay gestiones para este evento.</p>
      )}

      {!cargandoTareas && !errorTareas && tareas.map(tarea => (
        <article key={tarea.id} className="hoy-card">
          <div className="hoy-card__header">
            <span className="hoy-card__nombre">{tarea.titulo}</span>
            {tarea.estado === 'Completada' ? <Badge tipo="hecho">Completada</Badge>
              : tarea.estado === 'Pospuesta' ? <Badge tipo="media">Pospuesta</Badge>
              : <Badge tipo="pendiente">Pendiente</Badge>}
          </div>
          <p className="hoy-card__meta">
            {formatearFechaCorta(tarea.fechaLimite)} · {tarea.horasEstimadas}h
            {tarea.notaEjecucion ? ` · "${tarea.notaEjecucion}"` : ''}
          </p>
          {conflicto?.tipo === 'gestionar' && conflicto.tareaId === tarea.id && (
            <ConflictoBox
              conflicto={conflicto}
              onCerrar={() => setConflicto(null)}
              onResuelto={mensaje => { setConflicto(null); setExitoGestion(mensaje); }}
            />
          )}
          {tarea.estado === 'Pendiente' && (
            <TareaAcciones
              tarea={tarea}
              conEliminar
              onCambio={recargarTareasYProgreso}
              onConflicto={valor => { setExitoGestion(null); setConflicto(valor); }}
            />
          )}
        </article>
      ))}

      {conflicto?.tipo === 'crear' && (
        <ConflictoBox
          conflicto={conflicto}
          onCerrar={() => setConflicto(null)}
          onResuelto={mensaje => { setConflicto(null); setExitoGestion(mensaje); }}
        />
      )}

      <form onSubmit={crearTarea} noValidate style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
        <div className="nueva-subtarea-grid" style={{ marginTop: 0 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="tarea-titulo">Nueva gestión *</label>
            <input
              id="tarea-titulo"
              placeholder="Ej: Reservar salón"
              value={nuevoTitulo}
              onChange={e => { setNuevoTitulo(e.target.value); quitarErrorTarea('titulo'); }}
              aria-invalid={!!erroresTarea.titulo}
              aria-describedby={erroresTarea.titulo ? 'tarea-titulo-error' : undefined}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="tarea-fecha">Plazo *</label>
            <input
              id="tarea-fecha"
              type="date"
              value={nuevaFecha}
              onChange={e => { setNuevaFecha(e.target.value); quitarErrorTarea('fecha'); }}
              aria-invalid={!!erroresTarea.fecha}
              aria-describedby={erroresTarea.fecha ? 'tarea-fecha-error' : undefined}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="tarea-horas">Horas *</label>
            <input
              id="tarea-horas"
              type="number"
              min={0.5}
              step={0.5}
              value={nuevasHoras}
              onChange={e => { setNuevasHoras(e.target.value); quitarErrorTarea('horas'); }}
              aria-invalid={!!erroresTarea.horas}
              aria-describedby={erroresTarea.horas ? 'tarea-horas-error' : undefined}
            />
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} type="submit" disabled={creandoTarea}>
            {creandoTarea ? 'Agregando…' : '+ Agregar'}
          </button>
        </div>
        {erroresTarea.titulo && <p id="tarea-titulo-error" className="error-text" role="alert" style={{ marginTop: 8 }}>{erroresTarea.titulo}</p>}
        {erroresTarea.fecha && <p id="tarea-fecha-error" className="error-text" role="alert" style={{ marginTop: 8 }}>{erroresTarea.fecha}</p>}
        {erroresTarea.horas && <p id="tarea-horas-error" className="error-text" role="alert" style={{ marginTop: 8 }}>{erroresTarea.horas}</p>}
      </form>
      {modales}
    </div>
  );
}
