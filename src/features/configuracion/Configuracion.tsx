import { useEffect, useState } from 'react';
import { configuracionApi } from '../../api/configuracionApi';

// ARCHITECTURAL TRACE: Frontend feature — configuración de límite diario
// (US-12). El backend valida el rango 1-16 y aplica 6h por defecto; aquí solo
// se refleja ese contrato, con validación inline y estados de carga/error.
export function Configuracion() {
  const [limite, setLimite] = useState('6');
  const [isLoading, setIsLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);
  const [errorCampo, setErrorCampo] = useState<string | null>(null);
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  function cargar() {
    setIsLoading(true);
    setErrorCarga(null);
    configuracionApi
      .obtener()
      .then(res => setLimite(String(res.limiteHorasDiarias)))
      .catch(err => setErrorCarga(err instanceof Error ? err.message : 'No pudimos cargar tu configuración.'))
      .finally(() => setIsLoading(false));
  }
  useEffect(() => { cargar(); }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setErrorCampo(null);
    setErrorGuardar(null);
    setExito(false);
    const valor = Number(limite);
    if (!limite.trim() || Number.isNaN(valor) || valor < 1 || valor > 16) {
      setErrorCampo('El límite diario debe estar entre 1 y 16 horas.');
      return;
    }
    setGuardando(true);
    try {
      const actualizado = await configuracionApi.actualizar(valor);
      setLimite(String(actualizado.limiteHorasDiarias));
      setExito(true);
    } catch (err) {
      setErrorGuardar(err instanceof Error ? err.message : 'No pudimos guardar el límite diario.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="card">
      <h1 className="title">Configuración</h1>
      <p className="subtitle">
        Límite de horas de gestión que puedes dedicar por día. El sistema lo usa para detectar sobrecarga.
      </p>

      {isLoading && (
        <div role="status" aria-label="Cargando configuración">
          <div className="skeleton-row" />
        </div>
      )}

      {errorCarga && (
        <div className="estado-centro" role="alert">
          <div className="estado-centro__icono" aria-hidden="true">!</div>
          <p className="estado-centro__texto">{errorCarga}</p>
          <button className="btn btn-outline" onClick={cargar}>Reintentar</button>
        </div>
      )}

      {!isLoading && !errorCarga && (
        <form onSubmit={guardar} noValidate>
          <div className="field">
            <label htmlFor="limite-diario">Límite diario (horas) *</label>
            <input
              id="limite-diario"
              type="number"
              min={1}
              max={16}
              step={0.5}
              value={limite}
              onChange={e => { setLimite(e.target.value); setExito(false); setErrorCampo(null); }}
              aria-invalid={!!errorCampo}
              aria-describedby={errorCampo ? 'limite-diario-error' : undefined}
            />
            {errorCampo && <p id="limite-diario-error" className="error-text" role="alert">{errorCampo}</p>}
          </div>
          {errorGuardar && <p className="error-text" role="alert">{errorGuardar}</p>}
          {exito && <p className="hoy-aviso" role="status">Límite actualizado correctamente.</p>}
          <button className="btn btn-primary" style={{ width: 'auto' }} type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : 'Guardar'}
          </button>
        </form>
      )}
    </div>
  );
}
