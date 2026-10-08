import { useEffect, useState } from 'react';
import { eventosApi } from '../../api/eventosApi';
import type { Evento } from '../../domain/types';
import { formatearFechaLarga } from '../../ui/format';
import { FormularioEvento } from './FormularioEvento';

// ARCHITECTURAL TRACE: Frontend feature — eventos. Traza: US-004
// Estados según la Guía de Diseño: isLoading, hasError, isEmpty, isSuccess.
export function MisEventos({ onAbrirEvento, abrirFormulario = false }: { onAbrirEvento: (evento: Evento) => void; abrirFormulario?: boolean }) {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(abrirFormulario);

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

  const isEmpty = !isLoading && !hasError && eventos.length === 0;
  const isSuccess = !isLoading && !hasError && eventos.length > 0;

  return (
    <div className="card">
      <h1 className="title">Mis eventos</h1>
      <p className="subtitle">Eventos registrados en el sistema.</p>

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
          <button
            className="btn btn-primary"
            style={{ width: 'auto' }}
            onClick={() => setMostrarFormulario(true)}
          >
            Crear evento
          </button>
        </div>
      )}

      {/* Éxito: listado */}
      {isSuccess &&
        eventos.map(evento => (
          <div
            key={evento.id}
            className="evento-row"
            role="button"
            tabIndex={0}
            onClick={() => onAbrirEvento(evento)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onAbrirEvento(evento);
              }
            }}
          >
            <div className="evento-row__header">
              <span className="evento-row__nombre">{evento.nombre}</span>
              <span className="evento-row__fecha">{formatearFechaLarga(evento.fechaEvento)}</span>
            </div>
            <div className="evento-row__fecha">{evento.estado ?? 'Sin estado'}</div>
          </div>
        ))}

      {mostrarFormulario ? (
        <FormularioEvento
          onCreado={evento => {
            setEventos(prev => [...prev, evento]);
            setMostrarFormulario(false);
          }}
          onCancelar={() => setMostrarFormulario(false)}
        />
      ) : (
        // Con la lista vacía el CTA ya está en el estado vacío; en error no tiene sentido crear
        isSuccess && (
  <button
    className="btn btn-primary"
    style={{ width: 'auto', marginTop: 8 }}
    onClick={() => setMostrarFormulario(true)}
  >
    Crear evento
  </button>
)
      )}
    </div>
  );
}