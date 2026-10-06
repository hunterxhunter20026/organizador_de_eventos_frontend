import { useCallback, useEffect, useState } from 'react';
import { eventosApi } from '../../api/eventosApi';
import { hoyApi, tareasApi } from '../../api/tareasApi';
import { ESTADO } from '../../domain/tarea';
import type { HoyRespuesta, Tarea } from '../../domain/tarea';
import type { Evento } from '../../domain/types';
import { formatearFechaLarga } from '../../ui/format';
import { Modal } from '../../ui/Modal';

type Tipo = 'vencida' | 'hoy' | 'proxima';

const REGLA_POR_DEFECTO =
  'Las tareas se muestran en tres grupos: Vencidas, Para hoy y Próximas. Dentro de cada grupo van primero las de fecha más cercana y, si coinciden, la de menor esfuerzo estimado.';

const fechaValida = (v: string) => !!v && !Number.isNaN(new Date(`${v}T00:00:00`).getTime());

export function Hoy({
  onAbrirEvento,
  onCrearEvento
}: {
  onAbrirEvento: (evento: Evento) => void;
  onCrearEvento: () => void;
}) {
  const [data, setData] = useState<HoyRespuesta | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [filtroEvento, setFiltroEvento] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [verRegla, setVerRegla] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [falloAccion, setFalloAccion] = useState(false);

  // Reprogramar
  const [reprogramando, setReprogramando] = useState<Tarea | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [errorFecha, setErrorFecha] = useState<string | null>(null);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  // Posponer
  const [posponiendo, setPosponiendo] = useState<Tarea | null>(null);
  const [nota, setNota] = useState('');
  const [errorNota, setErrorNota] = useState<string | null>(null);

  const cargar = useCallback((conSkeleton = true) => {
    if (conSkeleton) setIsLoading(true);
    setHasError(false);
    hoyApi
      .obtener({
        eventoId: filtroEvento ? Number(filtroEvento) : undefined,
        estado: filtroEstado === 'Todos' ? undefined : filtroEstado
      })
      .then(setData)
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }, [filtroEvento, filtroEstado]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { eventosApi.listar().then(setEventos).catch(() => setEventos([])); }, []);

  const vencidas = data?.vencidas ?? [];
  const paraHoy = data?.paraHoy ?? [];
  const proximas = data?.proximas ?? [];
  const isEmpty = !isLoading && !hasError && vencidas.length + paraHoy.length + proximas.length === 0;
  const isSuccess = !isLoading && !hasError && !isEmpty;

  const eventoDe = (t: Tarea) => eventos.find(e => e.id === t.eventoId);

  async function marcarHecha(t: Tarea) {
    setAviso(null);
    setProcesandoId(t.id);
    try {
      await tareasApi.marcarEstado(t.id, ESTADO.ejecutada);
      setAviso(`"${t.titulo}" quedó como hecha.`);
      cargar(false);
    } catch {
      setFalloAccion(true);
    } finally {
      setProcesandoId(null);
    }
  }

  function abrirPosponer(t: Tarea) {
    setPosponiendo(t);
    setNota('');
    setErrorNota(null);
  }

  async function confirmarPosponer() {
    if (!posponiendo) return;
    if (!nota.trim()) {
      setErrorNota('Escribe el motivo para posponer la tarea.');
      return;
    }
    setAviso(null);
    setProcesandoId(posponiendo.id);
    try {
      await tareasApi.marcarEstado(posponiendo.id, ESTADO.pospuesta, nota.trim());
      setAviso(`"${posponiendo.titulo}" quedó pospuesta.`);
      setPosponiendo(null);
      cargar(false);
    } catch {
      setPosponiendo(null);
      setFalloAccion(true);
    } finally {
      setProcesandoId(null);
    }
  }

  function abrirReprogramar(t: Tarea) {
    setReprogramando(t);
    setNuevaFecha(t.fechaLimite.slice(0, 10));
    setErrorFecha(null);
    setErrorServidor(null);
  }

  async function guardarNuevaFecha() {
    if (!reprogramando) return;
    if (!fechaValida(nuevaFecha)) {
      setErrorFecha('Selecciona una fecha válida para la tarea.');
      return;
    }
    setErrorServidor(null);
    setProcesandoId(reprogramando.id);
    try {
      await tareasApi.reprogramar(reprogramando.id, nuevaFecha);
      setAviso(`"${reprogramando.titulo}" se reprogramó para el ${formatearFechaLarga(nuevaFecha)}.`);
      setReprogramando(null);
      cargar(false);
    } catch (err) {
      // Si el back rechaza por sobrecarga diaria, se muestra su mensaje y se deja elegir otra fecha
      setErrorServidor(err instanceof Error ? err.message : 'No se pudo reprogramar.');
    } finally {
      setProcesandoId(null);
    }
  }

  function tarjeta(t: Tarea, tipo: Tipo) {
    const badge =
      tipo === 'vencida' ? <span className="badge badge--alta">Vencida</span>
      : tipo === 'hoy' ? <span className="badge badge--media">Para hoy</span>
      : <span className="badge badge--pendiente">Pendiente</span>;
    const evento = eventoDe(t);
    return (
      <article key={t.id} className={`hoy-card hoy-card--${tipo}`}>
        <div className="hoy-card__header">
          <span className="hoy-card__titulo">{t.titulo}</span>
          {badge}
        </div>
        {evento ? (
          <button className="hoy-card__evento" onClick={() => onAbrirEvento(evento)}>
            Evento: {evento.nombre}
          </button>
        ) : (
          <p className="hoy-card__meta" style={{ margin: 0 }}>Evento {t.eventoId}</p>
        )}
        <p className="hoy-card__meta">
          Vence: {formatearFechaLarga(t.fechaLimite)} · {t.horasEstimadas} h estimadas
          {t.estado ? ` · ${t.estado}` : ''}
        </p>
        <div className="hoy-card__acciones">
          <button className="btn btn-primary" disabled={procesandoId === t.id} onClick={() => marcarHecha(t)}>✔ Hecha</button>
          <button className="btn btn-outline" disabled={procesandoId === t.id} onClick={() => abrirPosponer(t)}>Posponer</button>
          <button className="btn btn-outline" disabled={procesandoId === t.id} onClick={() => abrirReprogramar(t)}>Reprogramar</button>
        </div>
      </article>
    );
  }

  function seccion(titulo: string, clase: string, lista: Tarea[], tipo: Tipo) {
    if (lista.length === 0) return null;
    return (
      <section className="hoy-seccion">
        <h2 className={`hoy-seccion__titulo ${clase}`}>
          {titulo} <span className="contador">{lista.length}</span>
        </h2>
        {lista.map(t => tarjeta(t, tipo))}
      </section>
    );
  }

  return (
    <div className="card">
      <h1 className="title">Hoy</h1>
      <p className="subtitle">Lo que necesita tu atención, de lo más urgente a lo más lejano.</p>

      <div className="hoy-filtros">
        <div className="field">
          <label htmlFor="hoy-evento">Evento</label>
          <select id="hoy-evento" value={filtroEvento} onChange={e => setFiltroEvento(e.target.value)}>
            <option value="">Todos</option>
            {eventos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="hoy-estado">Estado</label>
          <select id="hoy-estado" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value={ESTADO.pendiente}>Pendiente</option>
            <option value={ESTADO.pospuesta}>Pospuesta</option>
          </select>
        </div>
        <button className="link-ayuda" aria-expanded={verRegla} onClick={() => setVerRegla(v => !v)}>
          ¿Cómo se ordena?
        </button>
      </div>

      {verRegla && <p className="hoy-regla">{data?.regla || REGLA_POR_DEFECTO}</p>}
      {aviso && <p className="hoy-aviso" role="status">{aviso}</p>}

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
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => cargar()}>Reintentar</button>
        </div>
      )}

      {isEmpty && (
        <div className="estado-centro">
          <div className="estado-centro__icono" aria-hidden="true">☕</div>
          <p className="estado-centro__pregunta">No hay tareas programadas</p>
          <p className="estado-centro__texto">Crea un evento y agrégale tareas para verlas aquí.</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={onCrearEvento}>Crear evento</button>
        </div>
      )}

      {isSuccess && (
        <>
          {seccion('Vencidas', 'es-vencido', vencidas, 'vencida')}
          {seccion('Para hoy', 'es-hoy', paraHoy, 'hoy')}
          {seccion('Próximas', '', proximas, 'proxima')}
        </>
      )}

      {reprogramando && (
        <Modal
          titulo="Reprogramar tarea"
          onCerrar={() => setReprogramando(null)}
          acciones={
            <>
              <button className="btn btn-outline" onClick={() => setReprogramando(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ width: 'auto' }} disabled={procesandoId === reprogramando.id} onClick={guardarNuevaFecha}>
                Guardar nueva fecha
              </button>
            </>
          }
        >
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="nueva-fecha">Nueva fecha *</label>
            <input
              id="nueva-fecha"
              type="date"
              value={nuevaFecha}
              onChange={e => { setNuevaFecha(e.target.value); setErrorFecha(null); setErrorServidor(null); }}
              aria-invalid={!!errorFecha}
              aria-describedby={errorFecha ? 'nueva-fecha-error' : undefined}
            />
            {errorFecha && <p id="nueva-fecha-error" className="error-text" role="alert">{errorFecha}</p>}
            {errorServidor && <p className="error-text" role="alert">{errorServidor}</p>}
          </div>
        </Modal>
      )}

      {posponiendo && (
        <Modal
          titulo="Posponer tarea"
          onCerrar={() => setPosponiendo(null)}
          acciones={
            <>
              <button className="btn btn-outline" onClick={() => setPosponiendo(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ width: 'auto' }} disabled={procesandoId === posponiendo.id} onClick={confirmarPosponer}>
                Posponer tarea
              </button>
            </>
          }
        >
          <div className="field" style={{ marginBottom: 0 }}>
            <label htmlFor="nota-posponer">Motivo *</label>
            <textarea
              id="nota-posponer"
              rows={3}
              placeholder="Ej: El proveedor confirmó la entrega para la próxima semana"
              value={nota}
              onChange={e => { setNota(e.target.value); setErrorNota(null); }}
              aria-invalid={!!errorNota}
              aria-describedby={errorNota ? 'nota-posponer-error' : undefined}
            />
            {errorNota && <p id="nota-posponer-error" className="error-text" role="alert">{errorNota}</p>}
          </div>
        </Modal>
      )}

      {falloAccion && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setFalloAccion(false)}
          acciones={<button className="btn btn-outline btn-outline--danger" onClick={() => setFalloAccion(false)}>Cerrar</button>}
        >
          Ha ocurrido un error al guardar. Inténtalo de nuevo.
        </Modal>
      )}
    </div>
  );
}