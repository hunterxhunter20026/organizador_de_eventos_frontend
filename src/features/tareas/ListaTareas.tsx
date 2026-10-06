import { useCallback, useEffect, useState } from 'react';
import { tareasApi } from '../../api/tareasApi';
import { ESTADO } from '../../domain/tarea';
import type { Tarea } from '../../domain/tarea';
import type { Evento } from '../../domain/types';
import { formatearFechaLarga } from '../../ui/format';
import { Modal } from '../../ui/Modal';

type Errores = { titulo?: string; fecha?: string; horas?: string };

const fechaValida = (v: string) => !!v && !Number.isNaN(new Date(`${v}T00:00:00`).getTime());

function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function ListaTareas({ evento }: { evento: Evento }) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const [mostrarForm, setMostrarForm] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [fecha, setFecha] = useState('');
  const [horas, setHoras] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const [creada, setCreada] = useState(false);
  const [falloCrear, setFalloCrear] = useState(false);

  const [aEliminar, setAEliminar] = useState<Tarea | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [falloEliminar, setFalloEliminar] = useState(false);

  const cargar = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
    tareasApi
      .listarPorEvento(evento.id)
      .then(setTareas)
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [evento.id]);

  useEffect(() => { cargar(); }, [cargar]);

  const isEmpty = !isLoading && !hasError && tareas.length === 0;
  const isSuccess = !isLoading && !hasError && tareas.length > 0;

  const total = tareas.length;
  const hechas = tareas.filter(t => t.estado === ESTADO.ejecutada).length;
  const pct = total === 0 ? 0 : Math.round((hechas / total) * 100);
  const hoy = hoyISO();

  function estadoVisible(t: Tarea): { texto: string; clase: string } {
    if (t.estado === ESTADO.ejecutada) return { texto: '✔ Hecha', clase: 'badge--hecho' };
    if (t.fechaLimite.slice(0, 10) < hoy) return { texto: 'Vencida', clase: 'badge--alta' };
    return { texto: 'Pendiente', clase: 'badge--pendiente' };
  }

  // Barra de progreso según la guía: azul activo, verde vacío/completado, rojo error
  let variante = 'azul';
  let ancho = pct;
  let textoProgreso = `${hechas} de ${total} tareas, ${pct} %`;
  if (hasError) { variante = 'rojo'; ancho = 100; textoProgreso = 'No se han podido cargar las tareas'; }
  else if (total === 0) { variante = 'verde'; ancho = 100; textoProgreso = '✔ No tienes tareas creadas'; }
  else if (pct === 100) { variante = 'verde'; textoProgreso = `✔ Completado: ${hechas} de ${total} tareas, 100 %`; }

  function validar(): Errores {
    const e: Errores = {};
    if (!titulo.trim()) e.titulo = 'Escribe el nombre de la tarea para continuar.';
    if (!fechaValida(fecha)) e.fecha = 'Selecciona una fecha válida para la tarea.';
    if (!(Number(horas) > 0)) e.horas = 'Ingresa una duración mayor que 0 horas.';
    return e;
  }
  const quitar = (c: keyof Errores) => setErrores(p => ({ ...p, [c]: undefined }));

  async function crear(ev: React.FormEvent) {
    ev.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    setGuardando(true);
    try {
      await tareasApi.crear(evento.id, {
        usuarioId: evento.usuarioId,
        titulo: titulo.trim(),
        descripcion: descripcion.trim() || undefined,
        fechaLimite: fecha,
        horasEstimadas: Number(horas),
        estado: ESTADO.pendiente
      });
      setCreada(true); // el formulario conserva los datos hasta aceptar
    } catch {
      setFalloCrear(true);
    } finally {
      setGuardando(false);
    }
  }

  function aceptarCreada() {
    setCreada(false);
    setTitulo(''); setFecha(''); setHoras(''); setDescripcion(''); setErrores({});
    setMostrarForm(false);
    cargar();
  }

  async function eliminar() {
    if (!aEliminar) return;
    setEliminando(true);
    try {
      await tareasApi.eliminar(aEliminar.id);
      setAEliminar(null);
      cargar();
    } catch {
      setAEliminar(null);
      setFalloEliminar(true);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <section style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
      <h2 className="title" style={{ fontSize: 20 }}>Tareas</h2>

      <div
        className="progress-track"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={hasError ? undefined : pct}
        aria-label="Progreso del evento"
      >
        <div className={`progress-fill progress-fill--${variante}`} style={{ width: `${ancho}%` }} />
      </div>
      <p className={`progreso-texto progreso-texto--${variante}`}>{textoProgreso}</p>

      {isLoading && (
        <div role="status" aria-label="Cargando tareas">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      )}

      {hasError && (
        <div className="estado-centro" role="alert">
          <div className="estado-centro__icono" aria-hidden="true">!</div>
          <p className="estado-centro__texto">Ha ocurrido un error cargando la información, inténtalo de nuevo.</p>
          <button className="btn btn-outline" onClick={cargar}>Reintentar</button>
        </div>
      )}

      {isEmpty && !mostrarForm && (
        <div className="estado-centro">
          <div className="estado-centro__icono" aria-hidden="true">📖</div>
          <p className="estado-centro__pregunta">¿Deseas crear tu primera tarea?</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setMostrarForm(true)}>Crear tarea</button>
        </div>
      )}

      {isSuccess && tareas.map(t => {
        const v = estadoVisible(t);
        return (
          <div key={t.id} className="subtarea-row">
            <div className="subtarea-row__info">
              <div className="subtarea-row__nombre">{t.titulo}</div>
              <div className="subtarea-row__meta">
                Vence: {formatearFechaLarga(t.fechaLimite)} · {t.horasEstimadas} h estimadas
              </div>
              {t.notaEjecucion && <div className="subtarea-row__meta">Nota: {t.notaEjecucion}</div>}
            </div>
            <div className="subtarea-row__acciones">
              <span className={`badge ${v.clase}`}>{t.estado === ESTADO.pospuesta && v.texto === 'Pendiente' ? 'Pospuesta' : v.texto}</span>
              <button className="btn btn-outline btn-outline--danger" onClick={() => setAEliminar(t)}>Eliminar</button>
            </div>
          </div>
        );
      })}

      {isSuccess && !mostrarForm && (
        <button className="btn btn-primary" style={{ width: 'auto', marginTop: 16 }} onClick={() => setMostrarForm(true)}>
          Crear tarea
        </button>
      )}

      {mostrarForm && (
        <form onSubmit={crear} noValidate style={{ marginTop: 16 }}>
          <div className="field">
            <label htmlFor="tarea-titulo">Nombre de la tarea *</label>
            <input
              id="tarea-titulo"
              placeholder="Ej: Contratar el sonido"
              value={titulo}
              onChange={e => { setTitulo(e.target.value); quitar('titulo'); }}
              aria-invalid={!!errores.titulo}
              aria-describedby={errores.titulo ? 'tarea-titulo-error' : undefined}
            />
            {errores.titulo && <p id="tarea-titulo-error" className="error-text" role="alert">{errores.titulo}</p>}
          </div>
          <div className="field">
            <label htmlFor="tarea-fecha">Fecha límite *</label>
            <input
              id="tarea-fecha"
              type="date"
              value={fecha}
              onChange={e => { setFecha(e.target.value); quitar('fecha'); }}
              aria-invalid={!!errores.fecha}
              aria-describedby={errores.fecha ? 'tarea-fecha-error' : undefined}
            />
            {errores.fecha && <p id="tarea-fecha-error" className="error-text" role="alert">{errores.fecha}</p>}
          </div>
          <div className="field">
            <label htmlFor="tarea-horas">Horas estimadas *</label>
            <input
              id="tarea-horas"
              type="number"
              min="0"
              step="0.5"
              placeholder="Ej: 2"
              value={horas}
              onChange={e => { setHoras(e.target.value); quitar('horas'); }}
              aria-invalid={!!errores.horas}
              aria-describedby={errores.horas ? 'tarea-horas-error' : undefined}
            />
            {errores.horas && <p id="tarea-horas-error" className="error-text" role="alert">{errores.horas}</p>}
          </div>
          <div className="field">
            <label htmlFor="tarea-desc">Descripción (opcional)</label>
            <textarea id="tarea-desc" rows={2} value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ width: 'auto' }} type="submit" disabled={guardando}>
              {guardando ? 'Creando…' : 'Crear tarea'}
            </button>
            <button className="btn btn-outline" type="button" onClick={() => { setMostrarForm(false); setErrores({}); }}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {creada && (
        <Modal
          titulo="Tarea creada"
          onCerrar={aceptarCreada}
          acciones={<button className="btn btn-primary" style={{ width: 'auto' }} onClick={aceptarCreada}>Aceptar</button>}
        >
          La tarea se creó correctamente.
        </Modal>
      )}

      {falloCrear && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setFalloCrear(false)}
          acciones={<button className="btn btn-outline btn-outline--danger" onClick={() => setFalloCrear(false)}>Cerrar</button>}
        >
          Ha ocurrido un error al guardar. Inténtalo de nuevo; tus datos siguen en el formulario.
        </Modal>
      )}

      {aEliminar && (
        <Modal
          titulo="¿Eliminar tarea?"
          onCerrar={() => setAEliminar(null)}
          acciones={
            <>
              <button className="btn btn-outline" onClick={() => setAEliminar(null)}>Cancelar</button>
              <button className="btn btn-outline btn-outline--danger" onClick={eliminar} disabled={eliminando}>
                {eliminando ? 'Eliminando…' : 'Eliminar tarea'}
              </button>
            </>
          }
        >
          Se eliminará esta tarea y su información. Esta acción no se puede deshacer.
        </Modal>
      )}

      {falloEliminar && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setFalloEliminar(false)}
          acciones={<button className="btn btn-outline btn-outline--danger" onClick={() => setFalloEliminar(false)}>Cerrar</button>}
        >
          No se pudo eliminar la tarea. Inténtalo de nuevo.
        </Modal>
      )}
    </section>
  );
}