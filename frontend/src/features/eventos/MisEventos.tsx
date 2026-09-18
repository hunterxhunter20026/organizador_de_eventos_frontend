import { useEffect, useState } from 'react';
import { eventosApi } from '../../api/eventosApi';
import type { Evento } from '../../domain/types';
import { ProgressBar } from '../../ui/primitives';
import { formatearFechaLarga } from '../../ui/format';
import { FormularioEvento } from './FormularioEvento';

// ARCHITECTURAL TRACE: Frontend feature — eventos. Traza: US-004
// Diseño: Imagen 5 ("Mis eventos")
export function MisEventos({ onAbrirEvento }: { onAbrirEvento: (evento: Evento) => void }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  useEffect(() => { eventosApi.listar().then(setEventos); }, []);

  function contarHechas(evento: Evento) {
    return evento.subtareas.filter(s => s.estado === 'HECHO').length;
  }

  return (
    <div className="card">
      <h1 className="title">Mis eventos</h1>
      <p className="subtitle">Visión general de tu carga de trabajo activa.</p>

      {eventos.length === 0 && !mostrarFormulario && (
        <p className="subtitle">Todavía no tienes eventos. Crea el primero para empezar a planificar.</p>
      )}

      {eventos.map(evento => (
        <div key={evento.id} className="evento-row" onClick={() => onAbrirEvento(evento)}>
          <div className="evento-row__header">
            <span className="evento-row__nombre">{evento.nombre}</span>
            <span className="evento-row__fecha">{formatearFechaLarga(evento.fecha)}</span>
          </div>
          <ProgressBar progreso={evento.progreso} hechas={contarHechas(evento)} total={evento.subtareas.length} />
        </div>
      ))}

      {mostrarFormulario ? (
        <FormularioEvento onCreado={evento => { setEventos(prev => [...prev, evento]); setMostrarFormulario(false); }} />
      ) : (
        <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => setMostrarFormulario(true)}>
          + Nuevo evento
        </button>
      )}
    </div>
  );
}
