import { useEffect, useState } from 'react';
import { eventosApi } from '../../api/eventosApi';
import type { Evento } from '../../domain/types';
import { formatearFechaLarga } from '../../ui/format';
import { FormularioEvento } from './FormularioEvento';

// ARCHITECTURAL TRACE: Frontend feature — eventos. Traza: US-004
// Diseño: Imagen 5 ("Mis eventos")
// Ya no muestra progreso/subtareas (no existen en el backend actual);
// muestra estado y permite abrir el detalle para editar o eliminar.
export function MisEventos({ onAbrirEvento }: { onAbrirEvento: (evento: Evento) => void }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  function recargar() {
    setCargando(true);
    eventosApi.listar().then(setEventos).finally(() => setCargando(false));
  }

  useEffect(() => { recargar(); }, []);

  return (
    <div className="card">
      <h1 className="title">Mis eventos</h1>
      <p className="subtitle">Eventos registrados en el sistema.</p>

      {cargando && <p className="subtitle">Cargando…</p>}
      {!cargando && eventos.length === 0 && !mostrarFormulario && (
        <p className="subtitle">Todavía no hay eventos. Crea el primero para empezar.</p>
      )}

      {eventos.map(evento => (
        <div key={evento.id} className="evento-row" onClick={() => onAbrirEvento(evento)}>
          <div className="evento-row__header">
            <span className="evento-row__nombre">{evento.nombre}</span>
            <span className="evento-row__fecha">{formatearFechaLarga(evento.fechaEvento)}</span>
          </div>
          <div className="evento-row__fecha">{evento.estado ?? 'Sin estado'}</div>
        </div>
      ))}

      {mostrarFormulario ? (
        <FormularioEvento
          onCreado={evento => { setEventos(prev => [...prev, evento]); setMostrarFormulario(false); }}
          onCancelar={() => setMostrarFormulario(false)}
        />
      ) : (
        <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => setMostrarFormulario(true)}>
          + Nuevo evento
        </button>
      )}
    </div>
  );
}
