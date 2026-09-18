import { useState } from 'react';
import { eventosApi } from '../../api/eventosApi';
import type { Evento } from '../../domain/types';

// ARCHITECTURAL TRACE: Frontend feature — eventos. Traza: US-001
// No presente en las 6 imágenes de referencia (que no incluyen la pantalla
// de creación) — estilizado para que combine con el resto del sistema.
export function FormularioEvento({ onCreado }: { onCreado: (evento: Evento) => void }) {
  const [nombre, setNombre] = useState('');
  const [fecha, setFecha] = useState('');
  const [ubicacion, setUbicacion] = useState('');

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    const evento = await eventosApi.crear(nombre, fecha, ubicacion);
    onCreado(evento);
    setNombre(''); setFecha(''); setUbicacion('');
  }

  return (
    <form onSubmit={manejarSubmit} style={{ marginTop: 8, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
      <div className="field">
        <label htmlFor="nombre-evento">Nombre del evento</label>
        <input id="nombre-evento" value={nombre} onChange={e => setNombre(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="fecha-evento">Fecha</label>
        <input id="fecha-evento" type="date" value={fecha} onChange={e => setFecha(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="ubicacion-evento">Ubicación</label>
        <input id="ubicacion-evento" value={ubicacion} onChange={e => setUbicacion(e.target.value)} required />
      </div>
      <button className="btn btn-primary" type="submit">Crear evento</button>
    </form>
  );
}
