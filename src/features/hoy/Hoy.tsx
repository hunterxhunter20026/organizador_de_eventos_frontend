import { useEffect, useMemo, useState } from 'react';
import { eventosApi } from '../../api/eventosApi';
import type { Evento } from '../../domain/types';
import { formatearFechaLarga } from '../../ui/format';
import { Modal } from '../../ui/Modal';

// Vista "Hoy": eventos agrupados en Vencidos → Para hoy → Próximos (US-04, US-05).
type Tipo = 'vencido' | 'hoy' | 'proximo';

function aISO(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${dia}`;
}
function sumarDias(iso: string, n: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + n);
  return aISO(d);
}
const fechaDe = (e: Evento) => e.fechaEvento.slice(0, 10);
const ESTADOS_CERRADOS = ['Completado', 'Cancelado'];

export function Hoy({
  onAbrirEvento,
  onCrearEvento
}: {
  onAbrirEvento: (evento: Evento) => void;
  onCrearEvento: () => void;
}) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('Todos');
  const [diasTxt, setDiasTxt] = useState('7');
  const [verRegla, setVerRegla] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);
  const [procesandoId, setProcesandoId] = useState<number | null>(null);
  const [falloAccion, setFalloAccion] = useState(false);

  // Reprogramar
  const [reprogramando, setReprogramando] = useState<Evento | null>(null);
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [errorFecha, setErrorFecha] = useState<string | null>(null);

  function recargar() {
    setIsLoading(true);
    setHasError(false);
    eventosApi
      .listar()
      .then(setEventos)
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false));
  }
  useEffect(() => { recargar(); }, []);

  const dias = Math.min(60, Math.max(1, Number(diasTxt) || 7));

  const { vencidos, paraHoy, proximos } = useMemo(() => {
    const hoy = aISO(new Date());
    const limite = sumarDias(hoy, dias);
    const pendientes = eventos
      .filter(e => !ESTADOS_CERRADOS.includes(e.estado ?? ''))
      .filter(e => filtroEstado === 'Todos' || e.estado === filtroEstado)
      .sort((a, b) => fechaDe(a).localeCompare(fechaDe(b)));
    return {
      vencidos: pendientes.filter(e => fechaDe(e) < hoy),
      paraHoy: pendientes.filter(e => fechaDe(e) === hoy),
      proximos: pendientes.filter(e => fechaDe(e) > hoy && fechaDe(e) <= limite)
    };
  }, [eventos, filtroEstado, dias]);

  const isEmpty = !isLoading && !hasError && vencidos.length + paraHoy.length + proximos.length === 0;
  const isSuccess = !isLoading && !hasError && !isEmpty;

  function guardarCambios(ev: Evento, cambios: { estado?: string; fechaEvento?: string }) {
    return eventosApi.actualizar(ev.id, {
      usuarioId: ev.usuarioId,
      nombre: ev.nombre,
      descripcion: ev.descripcion ?? undefined,
      fechaEvento: cambios.fechaEvento ?? fechaDe(ev),
      estado: cambios.estado ?? ev.estado ?? 'Planificación'
    });
  }
  function reemplazar(actualizado: Evento) {
    setEventos(prev => prev.map(e => (e.id === actualizado.id ? actualizado : e)));
  }

  async function marcarHecha(ev: Evento) {
    setAviso(null);
    setProcesandoId(ev.id);
    try {
      reemplazar(await guardarCambios(ev, { estado: 'Completado' }));
      setAviso(`"${ev.nombre}" quedó como completado.`);
    } catch {
      setFalloAccion(true);
    } finally {
      setProcesandoId(null);
    }
  }

  function abrirReprogramar(ev: Evento) {
    setReprogramando(ev);
    setNuevaFecha(fechaDe(ev));
    setErrorFecha(null);
  }

  async function guardarNuevaFecha() {
    if (!reprogramando) return;
    if (!nuevaFecha || Number.isNaN(new Date(`${nuevaFecha}T00:00:00`).getTime())) {
      setErrorFecha('Selecciona una fecha válida para el evento.');
      return;
    }
    setAviso(null);
    setProcesandoId(reprogramando.id);
    try {
      reemplazar(await guardarCambios(reprogramando, { fechaEvento: nuevaFecha }));
      setAviso(`"${reprogramando.nombre}" se reprogramó para el ${formatearFechaLarga(nuevaFecha)}.`);
      setReprogramando(null);
    } catch {
      setReprogramando(null);
      setFalloAccion(true);
    } finally {
      setProcesandoId(null);
    }
  }

  function tarjeta(ev: Evento, tipo: Tipo) {
    const badge =
      tipo === 'vencido' ? <span className="badge badge--alta">Vencida</span>
      : tipo === 'hoy' ? <span className="badge badge--media">Para hoy</span>
      : <span className="badge badge--pendiente">Pendiente</span>;
    return (
      <article key={ev.id} className="hoy-card hoy-card--${tipo}">
        <div className="hoy-card__header">
          <button className="hoy-card__nombre" onClick={() => onAbrirEvento(ev)}>{ev.nombre}</button>
          {badge}
        </div>
        <p className="hoy-card__meta">
          {formatearFechaLarga(ev.fechaEvento)} · {ev.estado ?? 'Sin estado'}
        </p>
        <div className="hoy-card__acciones">
          <button className="btn btn-primary" disabled={procesandoId === ev.id} onClick={() => marcarHecha(ev)}>
            ✔ Hecha
          </button>
          <button className="btn btn-outline" disabled={procesandoId === ev.id} onClick={() => abrirReprogramar(ev)}>
            Reprogramar
          </button>
        </div>
      </article>
    );
  }

  function seccion(titulo: string, clase: string, lista: Evento[], tipo: Tipo) {
    if (lista.length === 0) return null;
    return (
      <section className="hoy-seccion">
        <h2 className={`hoy-seccion__titulo ${clase}`}>
          {titulo} <span className="contador">{lista.length}</span>
        </h2>
        {lista.map(ev => tarjeta(ev, tipo))}
      </section>
    );
  }

  return (
    <div className="card">
      <h1 className="title">Hoy</h1>
      <p className="subtitle">Lo que necesita tu atención, de lo más urgente a lo más lejano.</p>

      <div className="hoy-filtros">
        <div className="field">
          <label htmlFor="hoy-estado">Estado</label>
          <select id="hoy-estado" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
            <option value="Todos">Todos</option>
            <option value="Planificación">Planificación</option>
            <option value="En Progreso">En Progreso</option>
          </select>
        </div>
        <div className="field field--dias">
          <label htmlFor="hoy-dias">Días</label>
          <input id="hoy-dias" type="number" min={1} max={60} value={diasTxt} onChange={e => setDiasTxt(e.target.value)} />
        </div>
        <button className="link-ayuda" aria-expanded={verRegla} onClick={() => setVerRegla(v => !v)}>
          ¿Cómo se ordena?
        </button>
      </div>

      {verRegla && (
        <p className="hoy-regla">
            Los eventos se muestran en tres grupos: Vencidas (la fecha ya pasó), Para hoy y Próximas (dentro de los días que elijas).
            Dentro de cada grupo van primero los de fecha más cercana.
            Los eventos completados o cancelados no aparecen.
        </p>
      )}

      {aviso && <p className="hoy-aviso" role="status">{aviso}</p>}

      {isLoading && (
        <div role="status" aria-label="Cargando eventos">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      )}

      {hasError && (
        <div className="estado-centro" role="alert">
          <div className="estado-centro__icono" aria-hidden="true">!</div>
          <p className="estado-centro__texto">Ha ocurrido un error cargando la información, inténtalo de nuevo.</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={recargar}>Reintentar</button>
        </div>
      )}

      {isEmpty && (
        <div className="estado-centro">
          <div className="estado-centro__icono" aria-hidden="true">☕</div>
          <p className="estado-centro__pregunta">No hay eventos programados</p>
          <p className="estado-centro__texto">Nada pendiente en este rango de días.</p>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={onCrearEvento}>
  Crear evento
</button>
        </div>
      )}

      {isSuccess && (
        <>
          {seccion('Vencidas', 'es-vencido', vencidos, 'vencido')}
          {seccion('Para hoy', 'es-hoy', paraHoy, 'hoy')}
          {seccion(`Próximos (${dias} días)`, '', proximos, 'proximo')}
        </>
      )}

      {reprogramando && (
        <Modal
          titulo="Reprogramar evento"
          onCerrar={() => setReprogramando(null)}
          acciones={
            <>
              <button className="btn btn-outline" onClick={() => setReprogramando(null)}>Cancelar</button>
              <button className="btn btn-primary" style={{ width: 'auto' }} onClick={guardarNuevaFecha}>
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
              onChange={e => { setNuevaFecha(e.target.value); setErrorFecha(null); }}
              aria-invalid={!!errorFecha}
              aria-describedby={errorFecha ? 'nueva-fecha-error' : undefined}
            />
            {errorFecha && <p id="nueva-fecha-error" className="error-text" role="alert">{errorFecha}</p>}
          </div>
        </Modal>
      )}

      {falloAccion && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setFalloAccion(false)}
          acciones={
            <button className="btn btn-outline btn-outline--danger" onClick={() => setFalloAccion(false)}>Cerrar</button>
          }
        >
          Ha ocurrido un error al guardar. Inténtalo de nuevo.
        </Modal>
      )}
    </div>
  );
}