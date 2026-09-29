import { useEffect, useState } from 'react';
import { eventosApi, usuariosApi } from '../../api/eventosApi';
import type { Evento, Usuario } from '../../domain/types';

// ARCHITECTURAL TRACE: Frontend feature — eventos. Traza: US-001
// Ajustado a los campos reales de EventoModel (usuarioId, nombre,
// descripcion, fechaEvento, estado). Ya no incluye "ubicación": esa
// columna no existe en el backend actual.
export function FormularioEvento({ onCreado, onCancelar }: { onCreado: (evento: Evento) => void; onCancelar: () => void }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaEvento, setFechaEvento] = useState('');
  const [estado, setEstado] = useState('Planificación');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => { usuariosApi.listar().then(setUsuarios).catch(() => setUsuarios([])); }, []);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!usuarioId) { setError('Selecciona el organizador del evento.'); return; }
    setGuardando(true);
    try {
      const evento = await eventosApi.crear({
        usuarioId: Number(usuarioId),
        nombre,
        descripcion: descripcion || undefined,
        fechaEvento,
        estado
      });
      onCreado(evento);
      setNombre(''); setDescripcion(''); setFechaEvento(''); setEstado('Planificación'); setUsuarioId('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos crear el evento.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={manejarSubmit} style={{ marginTop: 8, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
      <div className="field">
        <label htmlFor="nombre-evento">Nombre del evento</label>
        <input id="nombre-evento" value={nombre} onChange={e => setNombre(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="fecha-evento">Fecha</label>
        <input id="fecha-evento" type="date" value={fechaEvento} onChange={e => setFechaEvento(e.target.value)} required />
      </div>
      <div className="field">
        <label htmlFor="descripcion-evento">Descripción (opcional)</label>
        <input id="descripcion-evento" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="usuario-evento">Organizador</label>
        <select id="usuario-evento" value={usuarioId} onChange={e => setUsuarioId(e.target.value)} required>
          <option value="">Selecciona un usuario…</option>
          {usuarios.map(u => (
            <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
          ))}
        </select>
        {usuarios.length === 0 && (
          <p className="helper-text">No hay usuarios todavía — crea uno primero en la pestaña "Usuarios".</p>
        )}
      </div>
      <div className="field">
        <label htmlFor="estado-evento">Estado</label>
        <select id="estado-evento" value={estado} onChange={e => setEstado(e.target.value)}>
          <option value="Planificación">Planificación</option>
          <option value="En Progreso">En Progreso</option>
          <option value="Completado">Completado</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>
      {error && <p className="error-text" role="alert">{error}</p>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button className="btn btn-primary" type="submit" disabled={guardando}>
          {guardando ? 'Creando…' : 'Crear evento'}
        </button>
        <button className="btn btn-outline" type="button" onClick={onCancelar}>Cancelar</button>
      </div>
    </form>
  );
}
