import { useEffect, useState } from 'react';
import { eventosApi } from '../../api/eventosApi';
import type { Evento } from '../../domain/types';
import { formatearFechaLarga } from '../../ui/format';
import { IconoBasura, IconoEngranaje } from '../../ui/Iconos';
import { Modal } from '../../ui/Modal';
import { FormularioEvento, TIPOS } from './FormularioEvento';

// ARCHITECTURAL TRACE: Frontend feature — eventos. Traza: US-004
// Estados según la Guía de Diseño: isLoading, hasError, isEmpty, isSuccess.
export function MisEventos({ onAbrirEvento, abrirFormulario = false }: { onAbrirEvento: (evento: Evento) => void; abrirFormulario?: boolean }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(abrirFormulario);
  const [eventoAEliminar, setEventoAEliminar] = useState<Evento | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState<string | null>(null);

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

  async function eliminarEvento() {
    if (!eventoAEliminar) return;
    setEliminando(true);
    try {
      await eventosApi.eliminar(eventoAEliminar.id);
      setEventos(prev => prev.filter(evento => evento.id !== eventoAEliminar.id));
      setEventoAEliminar(null);
    } catch (err) {
      setEventoAEliminar(null);
      setErrorEliminar(err instanceof Error ? err.message : 'No se pudo eliminar el evento.');
    } finally {
      setEliminando(false);
    }
  }

  const isEmpty = !isLoading && !hasError && eventos.length === 0;
  const isSuccess = !isLoading && !hasError && eventos.length > 0;

  return (
    <div className="card">
      <div className="eventos-header">
        <div>
          <h1 className="title">Mis eventos</h1>
          <p className="subtitle">Eventos registrados en el sistema.</p>
        </div>
        {!mostrarFormulario && !hasError && (
          <button
            className="btn btn-primary eventos-header__crear"
            onClick={() => setMostrarFormulario(true)}
          >
            Crear evento
          </button>
        )}
      </div>

      {/* Carga: skeletons, sin saltos de layout */}
      {isLoading && (
        <div role="status" aria-label="Cargando eventos">
          <div className="skeleton-row" />
          <div className="skeleton-row" />
          <div className="skeleton-row" />
        </div>
      )}

      {/* Error crítico de carga */}
      {hasError && (
        <div className="estado-centro" role="alert">
          <div className="estado-centro__icono" aria-hidden="true">!</div>
          <p className="estado-centro__texto">
            Ha ocurrido un error cargando la información, inténtalo de nuevo.
          </p>
          <button className="btn btn-outline" onClick={recargar}>Reintentar</button>
        </div>
      )}

      {/* Vacío: puente hacia la creación */}
      {isEmpty && !mostrarFormulario && (
        <div className="estado-centro">
          <div className="estado-centro__icono" aria-hidden="true">📖</div>
          <p className="estado-centro__texto">No tienes eventos creados.</p>
          <p className="estado-centro__pregunta">¿Deseas crear tu primer evento?</p>
        </div>
      )}

      {/* Éxito: listado */}
      {isSuccess &&
        eventos.map(evento => (
          <article
            key={evento.id}
            className="evento-row"
          >
            <button className="evento-row__abrir" onClick={() => onAbrirEvento(evento)}>
              <span className="evento-row__nombre">{evento.nombre}</span>
              <span className="evento-row__datos">
                <span><strong>Estado:</strong> {evento.estado || 'Sin estado'}</span>
                <span><strong>Fecha del evento:</strong> {formatearFechaLarga(evento.fechaEvento)}</span>
                <span><strong>Tipo de evento:</strong> {TIPOS.find(tipo => tipo.valor === evento.tipo)?.etiqueta ?? 'Sin especificar'}</span>
                <span><strong>Cliente:</strong> {evento.clienteContacto || 'Sin especificar'}</span>
                <span><strong>Lugar:</strong> {evento.lugar || 'Sin especificar'}</span>
                <span><strong>Plazo límite:</strong> {evento.plazoLimite ? formatearFechaLarga(evento.plazoLimite) : 'Sin especificar'}</span>
              </span>
            </button>
            <div className="evento-row__acciones" aria-label={`Acciones para ${evento.nombre}`}>
              <button
                className="evento-row__accion evento-row__accion--eliminar"
                aria-label={`Eliminar ${evento.nombre}`}
                title="Eliminar evento"
                onClick={() => setEventoAEliminar(evento)}
              >
                <IconoBasura />
              </button>
              <button
                className="evento-row__accion"
                aria-label={`Editar ${evento.nombre}`}
                title="Editar evento"
                onClick={() => onAbrirEvento(evento)}
              >
                <IconoEngranaje />
              </button>
            </div>
          </article>
        ))}

      {mostrarFormulario ? (
        <FormularioEvento
          onCreado={evento => {
            setEventos(prev => [...prev, evento]);
            setMostrarFormulario(false);
          }}
          onCancelar={() => setMostrarFormulario(false)}
        />
      ) : null}

      {eventoAEliminar && (
        <Modal
          titulo="¿Eliminar evento?"
          onCerrar={() => setEventoAEliminar(null)}
          acciones={
            <>
              <button className="btn btn-outline" onClick={() => setEventoAEliminar(null)}>Cancelar</button>
              <button className="btn btn-outline btn-outline--danger" onClick={eliminarEvento} disabled={eliminando}>
                {eliminando ? 'Eliminando…' : 'Eliminar evento'}
              </button>
            </>
          }
        >
          Se eliminará el evento y todas sus tareas. Esta acción no se puede deshacer.
        </Modal>
      )}

      {errorEliminar && (
        <Modal
          titulo="Error"
          urgente
          onCerrar={() => setErrorEliminar(null)}
          acciones={
            <button className="btn btn-outline btn-outline--danger" onClick={() => setErrorEliminar(null)}>Cerrar</button>
          }
        >
          {errorEliminar}
        </Modal>
      )}
    </div>
  );
}