// ARCHITECTURAL TRACE: Frontend — primitivas de UI compartidas, sin lógica de negocio

export function Badge({ tipo, children }: { tipo: 'alta' | 'media' | 'hecho'; children: React.ReactNode }) {
  return <span className={`badge badge--${tipo}`}>{children}</span>;
}

export function ProgressBar({ progreso, hechas, total }: { progreso: number; hechas: number; total: number }) {
  const porcentaje = Math.round(progreso * 100);
  return (
    <div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: `${porcentaje}%` }} />
      </div>
      <div className="progress-meta">
        <span>{hechas} de {total} gestiones completadas</span>
        <span>{porcentaje}%</span>
      </div>
    </div>
  );
}

export function Toggle({ activo, onChange }: { activo: boolean; onChange: (nuevo: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      className={`toggle ${activo ? 'is-on' : ''}`}
      onClick={() => onChange(!activo)}
    >
      <span className="toggle__knob" />
    </button>
  );
}

export function Stepper({ valor, min, max, onChange }: { valor: number; min: number; max: number; onChange: (nuevo: number) => void }) {
  return (
    <div className="stepper">
      <button type="button" onClick={() => onChange(Math.max(min, valor - 1))} aria-label="Disminuir">−</button>
      <span className="stepper__value">{valor}</span>
      <button type="button" onClick={() => onChange(Math.min(max, valor + 1))} aria-label="Aumentar">+</button>
    </div>
  );
}
