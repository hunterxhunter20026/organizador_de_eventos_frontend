import { useEffect, useState } from 'react';
import { eventosApi, usuariosApi } from '../../api/eventosApi';
import type { Evento, Usuario } from '../../domain/types';
import { Modal } from '../../ui/Modal';

// ARCHITECTURAL TRACE: Frontend feature — eventos. Traza: US-001
// Microcopy y validación inline según la Guía de Diseño.
type Errores = { nombre?: string; fecha?: string; usuario?: string };

function fechaValida(valor: string): boolean {
  if (!valor) return false;
  return !Number.isNaN(new Date(`${valor}T00:00:00`).getTime());
}

export function FormularioEvento({ onCreado, onCancelar }: { onCreado: (evento: Evento) => void; onCancelar: () => void }) {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuarioId, setUsuarioId] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fechaEvento, setFechaEvento] = useState('');
  const [estado, setEstado] = useState('Planificación');
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const [eventoCreado, setEventoCreado] = useState<Evento | null>(null); // modal de éxito
  const [falloGuardar, setFalloGuardar] = useState(false);               // modal de error

  useEffect(() => { usuariosApi.listar().then(setUsuarios).catch(() => setUsuarios([])); }, []);

  function validar(): Errores {
    const e: Errores = {};
    if (!nombre.trim()) e.nombre = 'Escribe el nombre del evento para continuar.';
    if (!fechaValida(fechaEvento)) e.fecha = 'Selecciona una fecha válida para el evento.';
    if (!usuarioId) e.usuario = 'Selecciona el organizador del evento.';
    return e;
  }

  async function manejarSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    try {
      const evento = await eventosApi.crear({
        usuarioId: Number(usuarioId),
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || undefined,
        fechaEvento,
        estado
      });
      setEventoCreado(evento); // el formulario sigue montado hasta que se pulse "Aceptar"
    } catch {
      setFalloGuardar(true);   // no se borra nada del formulario
    } finally {
      setGuardando(false);
    }
  }

  function quitarError(campo: keyof Errores) {
    setErrores(prev => ({ ...prev, [campo]: undefined }));
  }

  return (
    <>
      <form onSubmit={manejarSubmit} noValidate style={{ marginTop: 8, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
        <div className="field">
          <label htmlFor="nombre-evento">Nombre del evento *</label>
          <input
            id="nombre-evento"
            placeholder="Ej: Feria de emprendimiento"
            value={nombre}
            onChange={e => { setNombre(e.target.value); quitarError('nombre'); }}
            aria-invalid={!!errores.nombre}
            aria-describedby={errores.nombre ? 'nombre-evento-error' : undefined}
          />
          {errores.nombre && <p id="nombre-evento-error" className="error-text" role="alert">{errores.nombre}</p>}
        </div>

        <div className="field">
          <label htmlFor="fecha-evento">Fecha del evento *</label>
          <input
            id="fecha-evento"
            type="date"
            value={fechaEvento}
            onChange={e => { setFechaEvento(e.target.value); quitarError('fecha'); }}
            aria-invalid={!!errores.fecha}
            aria-describedby={errores.fecha ? 'fecha-evento-error' : undefined}
          />
          {errores.fecha && <p id="fecha-evento-error" className="error-text" role="alert">{errores.fecha}</p>}
        </div>

        <div className="field">
          <label htmlFor="descripcion-evento">Descripción (opcional)</label>
          <input
            id="descripcion-evento"
            placeholder="Ej: Muestra de proyectos de estudiantes"
            value={descripcion}
            onChange={e => setDescripcion(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="usuario-evento">Organizador *</label>
          <select
            id="usuario-evento"
            value={usuarioId}
            onChange={e => { setUsuarioId(e.target.value); quitarError('usuario'); }}
            aria-invalid={!!errores.usuario}
            aria-describedby={errores.usuario ? 'usuario-evento-error' : undefined}
          >
            <option value="">Selecciona un usuario…</option>
            {usuarios.map(u => (
              <option key={u.id} value={u.id}>{u.nombre} ({u.email})</option>
            ))}
          </select>
          {errores.usuario && <p id="usuario-evento-error" className="error-text" role="alert">{errores.usuario}</p>}
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

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" style={{ width: 'auto' }} type="submit" disabled={guardando}>
            {guardando ? 'Creando…' : 'Crear evento'}
          </button>
          <button className="btn btn-outline" type="button" onClick={onCancelar}>Cancelar</button>
        </div>
      </form>

      {eventoCreado && (
        <Modal
          titulo="Evento creado"
          onCerrar={() => onCreado(eventoCreado)}
          acciones={
            <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => onCreado(eventoCreado)}>
              Aceptar
            </button>
          }
        >
          El evento se creó correctamente.
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
    </>
  );
}