import { useEffect, useState } from 'react';
import { hoyApi } from '../../api/hoyApi';
import { eventosApi } from '../../api/eventosApi';
import type { EstadoTarea, Evento, HoyResponse, TareaLogistica } from '../../domain/types';
import { formatearFechaCorta } from '../../ui/format';
import { Badge } from '../../ui/primitives';
import { ConflictoBox } from '../../ui/ConflictoBox';
import type { Conflicto } from '../../ui/ConflictoBox';
import { TareaAcciones } from '../tareas/TareaAcciones';

// ARCHITECTURAL TRACE: Frontend feature — vista "Hoy" (US-04, US-05, US-06,
// US-07, US-08, US-09). Las gestiones vienen agrupadas y ordenadas por el
// backend (Vencidas → Para hoy → Próximas, regla en `datos.regla`); aquí solo
// se presentan con el diseño de tarjetas y los estados de carga/error/vacío.
type Tipo = 'vencido' | 'hoy' | 'proximo';

export function Hoy({
  onAbrirEvento,
  onCrearEvento
}: {
  onAbrirEvento: (evento: Evento) => void;
  onCrearEvento: () => void;
}) {
  const [datos, setDatos] = useState<HoyResponse | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [eventoFiltro, setEventoFiltro] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<EstadoTarea>('Pendiente');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [verRegla, setVerRegla] = useState(false);
  const [conflicto, setConflicto] = useState<(Conflicto & { tareaId: number }) | null>(null);

  useEffect(() => { eventosApi.listar().then(setEventos).catch(() => setEventos([])); }, []);

  function cargar() {
    setIsLoading(true);
    setErrorMsg(null);
    hoyApi
      .obtener({ eventoId: eventoFiltro ? Number(eventoFiltro) : undefined, estado: estadoFiltro })
      .then(setDatos)
      .catch(err => setErrorMsg(err instanceof Error ? err.message : 'No pudimos cargar la vista Hoy.'))
      .finally(() => setIsLoading(false));
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { cargar(); }, [eventoFiltro, estadoFiltro]);

  const vencidas = datos?.vencidas ?? [];
  const paraHoy = datos?.paraHoy ?? [];
  const proximas = datos?.proximas ?? [];
  const hasError = !!errorMsg;
  const isEmpty = !isLoading && !hasError && vencidas.length + paraHoy.length + proximas.length === 0;
  const isSuccess = !isLoading && !hasError && !isEmpty;

  function eventoDe(tarea: TareaLogistica): Evento | undefined {
    return eventos.find(e => e.id === tarea.eventoId);
  }

  function tarjeta(tarea: TareaLogistica, tipo: Tipo) {
    const badge =
      tarea.estado === 'Completada' ? <Badge tipo="hecho">Completada</Badge>
      : tarea.estado === 'Pospuesta' ? <Badge tipo="media">Pospuesta</Badge>
      : tipo === 'vencido' ? <Badge tipo="alta">Vencida</Badge>
      : tipo === 'hoy' ? <Badge tipo="media">Para hoy</Badge>
      : <Badge tipo="pendiente">Pendiente</Badge>;
    const evento = eventoDe(tarea);
    return (
      <article key={tarea.id} className={`hoy-card hoy-card--${tipo}`}>
        <div className="hoy-card__header">
          {evento ? (
            <button className="hoy-card__nombre" title="Abrir evento" onClick={() => onAbrirEvento(evento)}>{tarea.titulo}</button>
          ) : (
            <span className="hoy-card__nombre">{tarea.titulo}</span>
          )}
          {badge}
        </div>
        <p className="hoy-card__meta">
          {evento?.nombre ?? `Evento #${tarea.eventoId}`} · {formatearFechaCorta(tarea.fechaLimite)} · {tarea.horasEstimadas}h
          {tarea.notaEjecucion ? ` · "${tarea.notaEjecucion}"` : ''}
        </p>

        {conflicto?.tareaId === tarea.id && (
          <ConflictoBox conflicto={conflicto} onCerrar={() => setConflicto(null)} />
        )}

        {estadoFiltro === 'Pendiente' && (
          <TareaAcciones
            tarea={tarea}
            onCambio={cargar}
            onConflicto={c => setConflicto(c ? { ...c, tareaId: tarea.id } : null)}
          />
        )}
      </article>
    );
  }

  function seccion(titulo: string, clase: string, lista: TareaLogistica[], tipo: Tipo) {
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
          <select id="hoy-evento" value={eventoFiltro} onChange={e => setEventoFiltro(e.target.value)}>
            <option value="">Todos</option>
            {eventos.map(ev => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="hoy-estado">Estado</label>
          <select id="hoy-estado" value={estadoFiltro} onChange={e => setEstadoFiltro(e.target.value as EstadoTarea)}>
            <option value="Pendiente">Pendiente</option>
            <option value="Completada">Completada</option>
            <option value="Pospuesta">Pospuesta</option>
          </select>
        </div>
        <button className="link-ayuda" aria-expanded={verRegla} onClick={() => setVerRegla(v => !v)}>
          ¿Cómo se ordena?
        </button>
      </div>

      {verRegla && datos && <p className="hoy-regla">{datos.regla}</p>}

      {isLoading && (
        <div role="status" aria-label="Cargando gestiones">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      )}

      {hasError && (
        <div className="estado-centro" role="alert">
          <div className="estado-centro__icono" aria-hidden="true">!</div>
          <p className="estado-centro__texto">{errorMsg ?? 'Ha ocurrido un error cargando la información, inténtalo de nuevo.'}</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={cargar}>Reintentar</button>
        </div>
      )}

      {isEmpty && (
        <div className="estado-centro">
          <div className="estado-centro__icono" aria-hidden="true">☕</div>
          <p className="estado-centro__pregunta">No hay gestiones para mostrar</p>
          <p className="estado-centro__texto">Nada con este filtro por ahora.</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={onCrearEvento}>Crear evento</button>
        </div>
      )}

      {isSuccess && (
        <>
          {seccion('Vencidas', 'es-vencido', vencidas, 'vencido')}
          {seccion('Para hoy', 'es-hoy', paraHoy, 'hoy')}
          {seccion('Próximas', '', proximas, 'proximo')}
        </>
      )}
    </div>
  );
}
