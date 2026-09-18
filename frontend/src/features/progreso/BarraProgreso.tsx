// ARCHITECTURAL TRACE: Frontend feature — progreso. Traza: US-019, US-020
export function BarraProgreso({ progreso }: { progreso: number }) {
  const porcentaje = Math.round(progreso * 100);
  return (
    <div style={{ background: '#eee', borderRadius: 4, overflow: 'hidden', height: 10 }}>
      <div style={{ width: `${porcentaje}%`, background: '#4caf50', height: '100%' }} />
      <span>{porcentaje}%</span>
    </div>
  );
}
