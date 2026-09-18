import { useEffect, useState } from 'react';
import { vistaHoyApi } from '../../api/eventosApi';
import type { VistaHoyItem } from '../../domain/types';
import { clasificarParaVistaHoy, formatearFechaLarga, hoyIso } from '../../ui/format';

// ARCHITECTURAL TRACE: Frontend feature — vista-hoy. Traza: US-009, US-010, US-011
// Diseño: Imagen 3 ("Hoy — 18 sept. 2026")
export function VistaHoy() {
  const [items, setItems] = useState<VistaHoyItem[]>([]);

  useEffect(() => { vistaHoyApi.obtener().then(data => setItems(data.items)); }, []);

  return (
    <div className="card">
      <h2 className="title">Hoy — {formatearFechaLarga(hoyIso())}</h2>
      <p className="subtitle">Gestiones urgentes ordenadas por: vencidas &gt; vencen hoy &gt; alta criticidad &gt; resto.</p>

      {items.length === 0 && <p className="subtitle">No tienes gestiones urgentes por hoy.</p>}

      {items.map(item => {
        const clasificacion = clasificarParaVistaHoy(item.subtarea.plazo, item.subtarea.criticidadProveedorAlta);
        return (
          <div key={item.subtarea.id} className={`vista-hoy-item ${clasificacion.claseModificadora}`}>
            <span className="vista-hoy-item__nombre">{item.subtarea.nombre}</span>
            <span className="vista-hoy-item__meta">
              {clasificacion.etiqueta}
              {item.subtarea.categoria ? ` · ${item.subtarea.categoria}` : ''} · {item.subtarea.horasEstimadas}h estimadas
            </span>
          </div>
        );
      })}
    </div>
  );
}
