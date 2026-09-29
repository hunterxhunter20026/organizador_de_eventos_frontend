import { useEffect, useState } from 'react';
import { eventosApi, usuariosApi } from '../../api/eventosApi';
import type { Evento, Usuario } from '../../domain/types';
import { formatearFechaLarga } from '../../ui/format';

// ARCHITECTURAL TRACE: Frontend feature — eventos. Traza: US-002
// Simplificado: ya no incluye subtareas/reprogramación (esos endpoints no
// existen en el backend todavía). Permite editar y eliminar el evento.
export function EventoDetalle({ eventoInicial, onVolver }: { eventoInicial: Evento; onVolver: () => void }) {
  const [evento, setEvento] = useState<Evento>(eventoInicial);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(eventoInicial.nombre);
  const [descripcion, setDescripcion] = useState(eventoInicial.descripcion ?? '');
  const [fechaEvento, setFechaEvento] = useState(eventoInicial.fechaEvento);
  const [estado, setEstado] = useState(eventoInicial.estado ?? 'Planificación');
  const [usuarioId, setUsuarioId] = useState(String(eventoInicial.usuarioId));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { usuariosApi.listar().then(setUsuarios).catch(() => setUsuarios([])); }, []);

  const organizador = usuarios.find(u => u.id === evento.usuarioId);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    try {
      const actualizado = await eventosApi.actualizar(evento.id, {
        usuarioId: Number(usuarioId),
        nombre,
        descripcion: descripcion || undefined,
        fechaEvento,
        estado
      });
      setEvento(actualizado);
      setEditando(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos actualizar el evento.');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!confirm('¿Eliminar este evento? Esta acción no se puede deshacer.')) return;
    await eventosApi.eliminar(evento.id);
    onVolver();
  }

  if (editando) {
    return (
      <div className="card">
        <button className="link-back" onClick={() => setEditando(false)}>← Cancelar</button>
        <h2 className="title">Editar evento</h2>
        <form onSubmit={guardar}>
          <div className="field">
            <label htmlFor="edit-nombre">Nombre</label>
            <input id="edit-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="edit-fecha">Fecha</label>
            <input id="edit-fecha" type="date" value={fechaEvento} onChange={e => setFechaEvento(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="edit-descripcion">Descripción</label>
            <input id="edit-descripcion" value={descripcion} onChange={e => setDescripcion(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="edit-usuario">Organizador</label>
            <select id="edit-usuario" value={usuarioId} onChange={e => setUsuarioId(e.target.value)} required>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
              ))}
            </select>
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
          {error && <p className="error-text" role="alert">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="card">
      <button className="link-back" onClick={onVolver}>← Mis eventos</button>
      <h2 className="title">{evento.nombre}</h2>
      <p className="subtitle">
        {formatearFechaLarga(evento.fechaEvento)} · {evento.estado ?? 'Sin estado'}
        {organizador ? ` · Organiza: ${organizador.nombre}` : ''}
      </p>
      {evento.descripcion && <p className="subtitle">{evento.descripcion}</p>}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="btn btn-outline" onClick={() => setEditando(true)}>Editar</button>
        <button className="btn btn-outline btn-outline--danger" onClick={eliminar}>Eliminar</button>
      </div>
    </div>
  );
}
