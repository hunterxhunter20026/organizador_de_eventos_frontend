import { ListaTareas } from '../tareas/ListaTareas';
import { useEffect, useState } from 'react';
import { eventosApi, usuariosApi } from '../../api/eventosApi';
import type { Evento, Usuario } from '../../domain/types';
import { formatearFechaLarga } from '../../ui/format';
import { Modal } from '../../ui/Modal';

// ARCHITECTURAL TRACE: Frontend feature — eventos. Traza: US-002, US-003
// Editar y eliminar con microcopy y modales de la Guía de Diseño.
type Errores = { nombre?: string; fecha?: string; usuario?: string };

function fechaValida(valor: string): boolean {
  if (!valor) return false;
  return !Number.isNaN(new Date(`${valor}T00:00:00`).getTime());
}

export function EventoDetalle({ eventoInicial, onVolver }: { eventoInicial: Evento; onVolver: () => void }) {
  const [evento, setEvento] = useState<Evento>(eventoInicial);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [editando, setEditando] = useState(false);
  const [nombre, setNombre] = useState(eventoInicial.nombre);
  const [descripcion, setDescripcion] = useState(eventoInicial.descripcion ?? '');
  const [fechaEvento, setFechaEvento] = useState(eventoInicial.fechaEvento.slice(0, 10));
  const [estado, setEstado] = useState(eventoInicial.estado ?? 'Planificación');
  const [usuarioId, setUsuarioId] = useState(String(eventoInicial.usuarioId));
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);

  // Modales
  const [actualizado, setActualizado] = useState(false);
  const [falloGuardar, setFalloGuardar] = useState(false);
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [falloEliminar, setFalloEliminar] = useState(false);

  useEffect(() => { usuariosApi.listar().then(setUsuarios).catch(() => setUsuarios([])); }, []);

  const organizador = usuarios.find(u => u.id === evento.usuarioId);

  function validar(): Errores {
    const e: Errores = {};
    if (!nombre.trim()) e.nombre = 'Escribe el nombre del evento para continuar.';
    if (!fechaValida(fechaEvento)) e.fecha = 'Selecciona una fecha válida para el evento.';
    if (!usuarioId) e.usuario = 'Selecciona el organizador del evento.';
    return e;
  }

  function quitarError(campo: keyof Errores) {
    setErrores(prev => ({ ...prev, [campo]: undefined }));
  }

  function empezarEdicion() {
    setNombre(evento.nombre);
    setDescripcion(evento.descripcion ?? '');
    setFechaEvento(evento.fechaEvento.slice(0, 10));
    setEstado(evento.estado ?? 'Planificación');
    setUsuarioId(String(evento.usuarioId));
    setErrores({});
    setEditando(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    try {
      const resultado = await eventosApi.actualizar(evento.id, {
        usuarioId: Number(usuarioId),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        fechaEvento,
        estado
      });
      setEvento(resultado);
      setActualizado(true); // modal de éxito; se sale de la edición al aceptar
    } catch {
      setFalloGuardar(true); // el formulario conserva lo escrito
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    setEliminando(true);
    try {
      await eventosApi.eliminar(evento.id);
      setConfirmando(false);
      onVolver();
    } catch {
      setConfirmando(false);
      setFalloEliminar(true);
    } finally {
      setEliminando(false);
    }
  }

  const modales = (
    <>
      {actualizado && (
        <Modal
          titulo="Evento actualizado"
          onCerrar={() => { setActualizado(false); setEditando(false); }}
          acciones={
            <button
              className="btn btn-primary"
              style={{ width: 'auto' }}
              onClick={() => { setActualizado(false); setEditando(false); }}
            >
              Aceptar
            </button>
          }
        >
          Los cambios del evento se guardaron correctamente.
        </Modal>
      )}

      {falloGuardar && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setFalloGuardar(false)}
          acciones={
            <button className="btn btn-outline btn-outline--danger" onClick={() => setFalloGuardar(false)}>
              Cerrar
            </button>
          }
        >
          Ha ocurrido un error al guardar. Inténtalo de nuevo; tus datos siguen en el formulario.
        </Modal>
      )}

      {confirmando && (
        <Modal
          titulo="¿Eliminar evento?"
          onCerrar={() => setConfirmando(false)}
          acciones={
            <>
              <button className="btn btn-outline" onClick={() => setConfirmando(false)}>Cancelar</button>
              <button className="btn btn-outline btn-outline--danger" onClick={eliminar} disabled={eliminando}>
                {eliminando ? 'Eliminando…' : 'Eliminar evento'}
              </button>
            </>
          }
        >
          Se eliminará el evento y todas sus tareas. Esta acción no se puede deshacer.
        </Modal>
      )}

      {falloEliminar && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setFalloEliminar(false)}
          acciones={
            <button className="btn btn-outline btn-outline--danger" onClick={() => setFalloEliminar(false)}>
              Cerrar
            </button>
          }
        >
          No se pudo eliminar el evento. Inténtalo de nuevo.
        </Modal>
      )}
    </>
  );

  if (editando) {
    return (
      <div className="card">
        <h2 className="title">Editar evento</h2>
        <p className="subtitle">Los campos con * son obligatorios.</p>
        <form onSubmit={guardar} noValidate>
          <div className="field">
            <label htmlFor="edit-nombre">Nombre del evento *</label>
            <input
              id="edit-nombre"
              placeholder="Ej: Feria de emprendimiento"
              value={nombre}
              onChange={e => { setNombre(e.target.value); quitarError('nombre'); }}
              aria-invalid={!!errores.nombre}
              aria-describedby={errores.nombre ? 'edit-nombre-error' : undefined}
            />
            {errores.nombre && <p id="edit-nombre-error" className="error-text" role="alert">{errores.nombre}</p>}
          </div>

          <div className="field">
            <label htmlFor="edit-fecha">Fecha del evento *</label>
            <input
              id="edit-fecha"
              type="date"
              value={fechaEvento}
              onChange={e => { setFechaEvento(e.target.value); quitarError('fecha'); }}
              aria-invalid={!!errores.fecha}
              aria-describedby={errores.fecha ? 'edit-fecha-error' : undefined}
            />
            {errores.fecha && <p id="edit-fecha-error" className="error-text" role="alert">{errores.fecha}</p>}
          </div>

          <div className="field">
            <label htmlFor="edit-descripcion">Descripción (opcional)</label>
            <input
              id="edit-descripcion"
              placeholder="Ej: Muestra de proyectos de estudiantes"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="edit-usuario">Organizador *</label>
            <select
              id="edit-usuario"
              value={usuarioId}
              onChange={e => { setUsuarioId(e.target.value); quitarError('usuario'); }}
              aria-invalid={!!errores.usuario}
              aria-describedby={errores.usuario ? 'edit-usuario-error' : undefined}
            >
              <option value="">Selecciona un usuario…</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
              ))}
            </select>
            {errores.usuario && <p id="edit-usuario-error" className="error-text" role="alert">{errores.usuario}</p>}
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

          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" style={{ width: 'auto' }} type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button className="btn btn-outline" type="button" onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </div>
        </form>
        {modales}
      </div>
    );
  }

  return (
    <div className="card">
      <button className="btn btn-outline" style={{ marginBottom: 16 }} onClick={onVolver}>
        Volver a eventos
      </button>
      <h2 className="title">{evento.nombre}</h2>
      <p className="subtitle">
        {formatearFechaLarga(evento.fechaEvento)} · {evento.estado ?? 'Sin estado'}
        {organizador ? ` · Organiza: ${organizador.nombre}` : ''}
      </p>
      {evento.descripcion && <p className="subtitle">{evento.descripcion}</p>}

      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="btn btn-outline" onClick={empezarEdicion}>Editar</button>
        <button className="btn btn-outline btn-outline--danger" onClick={() => setConfirmando(true)}>
          Eliminar
        </button>
      </div>
      <ListaTareas evento={evento} />
      {modales}
    </div>
  );
}