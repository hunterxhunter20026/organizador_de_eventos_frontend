import { useState } from 'react';
import { configuracionApi } from '../../api/eventosApi';
import { Stepper, Toggle } from '../../ui/primitives';

// ARCHITECTURAL TRACE: Frontend feature — configuración. Traza: US-008, US-022, US-023
// Diseño: Imagen 1 ("Configuración")
export function Configuracion() {
  // No existe un endpoint GET para leer la configuración actual del
  // organizador todavía (ver README, limitaciones conocidas) — se
  // inicializa con el valor por defecto del dominio (LimiteDiario.porDefecto = 6h)
  // y se sobreescribe en el backend recién cuando el usuario lo cambia aquí.
  const [limiteDiario, setLimiteDiario] = useState(6);
  const [resumenDiario, setResumenDiario] = useState(true);
  const [guardando, setGuardando] = useState(false);

  async function actualizarLimite(nuevo: number) {
    setLimiteDiario(nuevo);
    setGuardando(true);
    try {
      await configuracionApi.configurarLimiteDiario(nuevo);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="card">
      <h2 className="title">Configuración</h2>
      <p className="subtitle">Ajustes que rigen el comportamiento del planificador.</p>

      <div className="config-row">
        <div>
          <div className="config-row__label">Límite de horas por día</div>
          <div className="config-row__desc">
            Se usa para detectar sobrecarga al reprogramar (rango 1–16h).
            {guardando ? ' Guardando…' : ''}
          </div>
        </div>
        <Stepper valor={limiteDiario} min={1} max={16} onChange={actualizarLimite} />
      </div>

      <div className="config-row">
        <div>
          <div className="config-row__label">Resumen diario al iniciar sesión</div>
          <div className="config-row__desc">Recibe un total de gestiones urgentes al primer ingreso del día.</div>
        </div>
        <Toggle activo={resumenDiario} onChange={setResumenDiario} />
      </div>

      <div className="config-row">
        <div>
          <div className="config-row__label" style={{ color: 'var(--text-secondary)' }}>Sincronizar con calendario externo</div>
          <div className="config-row__desc">Fuera del alcance del MVP (Won't — US-023).</div>
        </div>
        <Toggle activo={false} onChange={() => {}} />
      </div>
    </div>
  );
}
