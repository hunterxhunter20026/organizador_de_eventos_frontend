import { useState } from 'react';
import { eventosApi } from '../../api/eventosApi';
import type { Evento, TipoEvento } from '../../domain/types';
import { Modal } from '../../ui/Modal';

// ARCHITECTURAL TRACE: Frontend feature — eventos. Traza: US-001
// Campos del backlog (nombre, tipo, cliente/contacto, fecha, lugar, plazo
// límite) con microcopy, validación inline y modales de la Guía de Diseño.
// No hay selector de "Organizador": EventoService asigna el usuarioId a
// partir del usuario autenticado, nunca de un valor elegido en el form.
type Errores = { nombre?: string; fecha?: string; plazo?: string };

export const TIPOS: { valor: TipoEvento; etiqueta: string }[] = [
  { valor: 'boda', etiqueta: 'Boda' },
  { valor: 'social', etiqueta: 'Social' },
  { valor: 'corporativo', etiqueta: 'Corporativo' },
  { valor: 'cumpleanos', etiqueta: 'Cumpleaños' },
  { valor: 'otro', etiqueta: 'Otro' }
];

export function fechaValida(valor: string): boolean {
  if (!valor) return false;
  return !Number.isNaN(new Date(`${valor}T00:00:00`).getTime());
}

export function FormularioEvento({ onCreado, onCancelar }: { onCreado: (evento: Evento) => void; onCancelar: () => void }) {
  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<TipoEvento>('social');
  const [clienteContacto, setClienteContacto] = useState('');
  const [fechaEvento, setFechaEvento] = useState('');
  const [lugar, setLugar] = useState('');
  const [plazoLimite, setPlazoLimite] = useState('');
  const [estado, setEstado] = useState('Planificación');
  const [errores, setErrores] = useState<Errores>({});
  const [guardando, setGuardando] = useState(false);
  const [eventoCreado, setEventoCreado] = useState<Evento | null>(null); // modal de éxito
  const [falloMensaje, setFalloMensaje] = useState<string | null>(null); // modal de error

  function validar(): Errores {
    const e: Errores = {};
    if (!nombre.trim()) e.nombre = 'Escribe el nombre del evento para continuar.';
    if (!fechaValida(fechaEvento)) e.fecha = 'Selecciona una fecha válida para el evento.';
    if (plazoLimite && !fechaValida(plazoLimite)) e.plazo = 'Selecciona una fecha válida para el plazo.';
    return e;
  }

  function quitarError(campo: keyof Errores) {
    setErrores(prev => ({ ...prev, [campo]: undefined }));
  }

  async function manejarSubmit(ev: React.FormEvent) {
    ev.preventDefault();
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;

    setGuardando(true);
    try {
      const evento = await eventosApi.crear({
        nombre: nombre.trim(),
        tipo,
        clienteContacto: clienteContacto.trim() || undefined,
        fechaEvento,
        lugar: lugar.trim() || undefined,
        plazoLimite: plazoLimite || undefined,
        estado
      });
      setEventoCreado(evento); // el formulario sigue montado hasta que se pulse "Aceptar"
    } catch (err) {
      setFalloMensaje(err instanceof Error ? err.message : 'Ha ocurrido un error al guardar.'); // no se borra nada del formulario
    } finally {
      setGuardando(false);
    }
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
          <label htmlFor="tipo-evento">Tipo</label>
          <select id="tipo-evento" value={tipo} onChange={e => setTipo(e.target.value as TipoEvento)}>
            {TIPOS.map(t => <option key={t.valor} value={t.valor}>{t.etiqueta}</option>)}
          </select>
        </div>

        <div className="field">
          <label htmlFor="cliente-evento">Cliente / contacto (opcional)</label>
          <input
            id="cliente-evento"
            placeholder="Ej: María Pérez"
            value={clienteContacto}
            onChange={e => setClienteContacto(e.target.value)}
          />
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
          <label htmlFor="lugar-evento">Lugar (opcional)</label>
          <input
            id="lugar-evento"
            placeholder="Ej: Salón principal"
            value={lugar}
            onChange={e => setLugar(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="plazo-evento">Plazo límite para tener la logística lista (opcional)</label>
          <input
            id="plazo-evento"
            type="date"
            value={plazoLimite}
            onChange={e => { setPlazoLimite(e.target.value); quitarError('plazo'); }}
            aria-invalid={!!errores.plazo}
            aria-describedby={errores.plazo ? 'plazo-evento-error' : undefined}
          />
          {errores.plazo && <p id="plazo-evento-error" className="error-text" role="alert">{errores.plazo}</p>}
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

      {falloMensaje && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setFalloMensaje(null)}
          acciones={
            <button className="btn btn-outline btn-outline--danger" onClick={() => setFalloMensaje(null)}>
              Cerrar
            </button>
          }
        >
          {falloMensaje} Tus datos siguen en el formulario.
        </Modal>
      )}
    </>
  );
}
