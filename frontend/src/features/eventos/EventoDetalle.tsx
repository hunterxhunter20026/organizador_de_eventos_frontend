import { useState } from 'react';
import { eventosApi } from '../../api/eventosApi';
import type { Evento } from '../../domain/types';
import { Badge, ProgressBar } from '../../ui/primitives';
import { formatearFechaCorta, formatearFechaLarga } from '../../ui/format';
import { ModalReprogramar } from '../reprogramacion/ModalReprogramar';

// ARCHITECTURAL TRACE: Frontend feature — eventos/subtareas. Traza: US-002, US-005 a US-020
// Diseño: Imagen 4 ("Boda de Ana & Luis")
export function EventoDetalle({ eventoInicial, onVolver }: { eventoInicial: Evento; onVolver: () => void }) {
  const [evento, setEvento] = useState<Evento>(eventoInicial);
  const [subtareaAReprogramar, setSubtareaAReprogramar] = useState<string | null>(null);
  const [nombre, setNombre] = useState('');
  const [plazo, setPlazo] = useState('');
  const [horas, setHoras] = useState(2);

  const hechas = evento.subtareas.filter(s => s.estado === 'HECHO').length;

  function badgeDe(estado: string, criticidadProveedorAlta: boolean) {
    if (estado === 'HECHO') return <Badge tipo="hecho">Hecho</Badge>;
    return criticidadProveedorAlta ? <Badge tipo="alta">Alta</Badge> : <Badge tipo="media">Media</Badge>;
  }

  async function marcarHecho(subtareaId: string) {
    const actualizado = await eventosApi.marcarProgreso(evento.id, subtareaId, 'HECHO');
    setEvento(actualizado);
  }

  async function reabrir(subtareaId: string) {
    const actualizado = await eventosApi.marcarProgreso(evento.id, subtareaId, 'PENDIENTE');
    setEvento(actualizado);
  }

  async function agregarSubtarea(e: React.FormEvent) {
    e.preventDefault();
    const actualizado = await eventosApi.agregarSubtarea(evento.id, nombre, '', plazo, horas, false);
    setEvento(actualizado);
    setNombre(''); setPlazo(''); setHoras(2);
  }

  if (subtareaAReprogramar) {
    return (
      <ModalReprogramar
        evento={evento}
        subtareaIdInicial={subtareaAReprogramar}
        onCerrar={() => setSubtareaAReprogramar(null)}
        onActualizado={setEvento}
      />
    );
  }

  return (
    <div className="card">
      <button className="link-back" onClick={onVolver}>← Mis eventos</button>
      <h2 className="title">{evento.nombre}</h2>
      <p className="subtitle">{formatearFechaLarga(evento.fecha)} · {evento.ubicacion}</p>

      <ProgressBar progreso={evento.progreso} hechas={hechas} total={evento.subtareas.length} />

      <div style={{ marginTop: 8 }}>
        {evento.subtareas.map(s => (
          <div key={s.id} className="subtarea-row">
            <div className="subtarea-row__info">
              <div className="subtarea-row__nombre">{s.nombre}</div>
              <div className="subtarea-row__meta">
                {s.categoria ? `${s.categoria} · ` : ''}
                {s.plazo ? `vence ${formatearFechaCorta(s.plazo)} · ` : ''}
                {s.horasEstimadas}h
              </div>
            </div>
            <div className="subtarea-row__acciones">
              {badgeDe(s.estado, s.criticidadProveedorAlta)}
              {s.estado === 'HECHO' ? (
                <button className="btn btn-outline" onClick={() => reabrir(s.id)}>Reabrir</button>
              ) : (
                <>
                  <button className="btn btn-outline" onClick={() => marcarHecho(s.id)}>Marcar hecho</button>
                  <button className="btn btn-outline" onClick={() => setSubtareaAReprogramar(s.id)}>Posponer</button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      <form className="nueva-subtarea-grid" onSubmit={agregarSubtarea}>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="nueva-subtarea-nombre">Nueva subtarea</label>
          <input id="nueva-subtarea-nombre" placeholder="Ej. Confirmar decoración"
                 value={nombre} onChange={e => setNombre(e.target.value)} required />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="nueva-subtarea-plazo">Plazo</label>
          <input id="nueva-subtarea-plazo" type="date" value={plazo} onChange={e => setPlazo(e.target.value)} required />
        </div>
        <div className="field" style={{ margin: 0 }}>
          <label htmlFor="nueva-subtarea-horas">Horas</label>
          <input id="nueva-subtarea-horas" type="number" min={0.5} step={0.5}
                 value={horas} onChange={e => setHoras(Number(e.target.value))} required />
        </div>
        <button className="btn btn-primary" type="submit" style={{ width: 'auto' }}>Agregar</button>
      </form>
    </div>
  );
}
