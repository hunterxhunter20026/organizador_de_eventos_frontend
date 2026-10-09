import { useState } from 'react';
import type { ConflictoSobrecarga } from '../domain/types';
import { Modal } from './Modal';

export type ResolucionConflicto =
  | { tipo: 'fecha'; valor: string }
  | { tipo: 'horas'; valor: number }
  | { tipo: 'posponer' };

export type Conflicto = ConflictoSobrecarga & {
  mensaje: string;
  fechaPropuesta: string;
  horasActuales: number;
  tipo: 'crear' | 'gestionar';
  tareaId?: number;
  resolver: (resolucion: ResolucionConflicto) => Promise<string>;
};

type Alternativa = 'fecha' | 'horas' | 'posponer';

export function ConflictoBox({
  conflicto,
  onCerrar,
  onResuelto
}: {
  conflicto: Conflicto;
  onCerrar: () => void;
  onResuelto: (mensaje: string) => void;
}) {
  const [alternativa, setAlternativa] = useState<Alternativa | null>(null);
  const [fecha, setFecha] = useState(conflicto.fechaPropuesta);
  const [horas, setHoras] = useState(String(conflicto.horasActuales));
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  async function aplicarResolucion() {
    setError(null);
    let resolucion: ResolucionConflicto;
    if (alternativa === 'fecha') {
      if (!fecha || Number.isNaN(new Date(`${fecha}T00:00:00`).getTime())) {
        setError('Selecciona una fecha válida para la gestión.');
        return;
      }
      resolucion = { tipo: 'fecha', valor: fecha };
    } else if (alternativa === 'horas') {
      const valor = Number(horas);
      if (!horas.trim() || !Number.isFinite(valor) || valor <= 0 || valor >= conflicto.horasActuales) {
        setError('Indica menos horas que las estimadas actualmente.');
        return;
      }
      resolucion = { tipo: 'horas', valor };
    } else if (alternativa === 'posponer') {
      resolucion = { tipo: 'posponer' };
    } else {
      return;
    }

    setProcesando(true);
    try {
      onResuelto(await conflicto.resolver(resolucion));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos aplicar el cambio. Revisa los datos e inténtalo de nuevo.');
    } finally {
      setProcesando(false);
    }
  }

  return (
    <Modal
      titulo="Este día quedaría sobrecargado"
      urgente
      onCerrar={() => { if (!procesando) onCerrar(); }}
      acciones={<button className="btn btn-outline" disabled={procesando} onClick={onCerrar}>Cancelar</button>}
    >
      <div className="conflicto-box">
        <p className="conflicto-box__texto">{conflicto.mensaje}.</p>
        <p className="conflicto-box__texto">
          Puedes cambiar la fecha o ajustar el tiempo estimado antes de guardar.
        </p>
        <div className="conflicto-box__alternativas" aria-label="Opciones para resolver">
          <button className="btn btn-outline" disabled={procesando} onClick={() => { setAlternativa('fecha'); setError(null); }}>
            {conflicto.tipo === 'crear' ? 'Elegir otra fecha' : 'Mover a otro día'}
          </button>
          <button className="btn btn-outline" disabled={procesando} onClick={() => { setAlternativa('horas'); setError(null); }}>
            Reducir horas estimadas
          </button>
          {conflicto.tipo === 'gestionar' && conflicto.opciones.includes('Posponer la gestión') && (
            <button className="btn btn-outline" disabled={procesando} onClick={() => { setAlternativa('posponer'); setError(null); }}>
              Posponer gestión
            </button>
          )}
        </div>

        {alternativa === 'fecha' && (
          <div className="conflicto-box__resolucion">
            <div className="field">
              <label htmlFor="conflicto-fecha">Nueva fecha *</label>
              <input id="conflicto-fecha" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <button className="btn btn-primary" disabled={procesando} onClick={aplicarResolucion}>
              {procesando ? 'Guardando…' : conflicto.tipo === 'crear' ? 'Crear con esta fecha' : 'Guardar nueva fecha'}
            </button>
          </div>
        )}
        {alternativa === 'horas' && (
          <div className="conflicto-box__resolucion">
            <div className="field">
              <label htmlFor="conflicto-horas">Horas estimadas *</label>
              <input
                id="conflicto-horas"
                type="number"
                min="0.5"
                step="0.5"
                max={conflicto.horasActuales}
                value={horas}
                onChange={e => setHoras(e.target.value)}
              />
            </div>
            <button className="btn btn-primary" disabled={procesando} onClick={aplicarResolucion}>
              {procesando ? 'Guardando…' : conflicto.tipo === 'crear' ? 'Crear con estas horas' : 'Guardar horas'}
            </button>
          </div>
        )}
        {alternativa === 'posponer' && (
          <div className="conflicto-box__resolucion">
            <p className="conflicto-box__texto">La gestión quedará marcada como pospuesta y dejará de contar en la carga de ese día.</p>
            <button className="btn btn-primary" disabled={procesando} onClick={aplicarResolucion}>
              {procesando ? 'Guardando…' : 'Confirmar y posponer'}
            </button>
          </div>
        )}
        {error && <p className="error-text" role="alert">{error}</p>}
      </div>
    </Modal>
  );
}
