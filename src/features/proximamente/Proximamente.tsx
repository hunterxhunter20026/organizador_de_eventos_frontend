// ARCHITECTURAL TRACE: Frontend — placeholder deliberado. "Hoy" y
// "Configuración" quedan visibles en la navegación pero SIN llamar al
// backend: /api/vista-hoy y /api/configuracion/limite-diario no existen
// todavía en organizador_de_eventos_backend. Se conectarán en el sprint
// en que se implementen esos endpoints (ver VistaHoy.tsx y
// Configuracion.tsx originales, que quedan sin usar mientras tanto).
export function Proximamente({ titulo }: { titulo: string }) {
  return (
    <div className="card">
      <h2 className="title">{titulo}</h2>
      <p className="subtitle">Esta sección todavía no está conectada al backend — llega en un próximo sprint.</p>
    </div>
  );
}
