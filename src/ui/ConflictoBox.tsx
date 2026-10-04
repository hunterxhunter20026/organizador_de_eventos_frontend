import type { ConflictoSobrecarga } from '../domain/types';

// Aviso de sobrecarga diaria (US-07/US-08). Usa los estilos .conflicto-box del
// diseño; el backend devuelve las opciones de resolución como texto.
export type Conflicto = { mensaje: string; opciones: string[] };

export function aConflicto(mensaje: string, detalle: ConflictoSobrecarga): Conflicto {
  return { mensaje, opciones: detalle.opciones };
}

export function ConflictoBox({ conflicto, onCerrar }: { conflicto: Conflicto; onCerrar: () => void }) {
  return (
    <div className="conflicto-box" role="alert">
      <p className="conflicto-box__titulo">Sobrecarga detectada</p>
      <p className="conflicto-box__texto">{conflicto.mensaje}</p>
      {conflicto.opciones.length > 0 && (
        <>
          <p className="conflicto-box__texto"><strong>Opciones:</strong></p>
          <ul style={{ margin: '0 0 6px 0', paddingLeft: 18, fontSize: 13 }}>
            {conflicto.opciones.map(op => <li key={op}>{op}</li>)}
          </ul>
        </>
      )}
      <div className="conflicto-box__acciones">
        <button className="btn btn-outline" onClick={onCerrar}>Entendido</button>
      </div>
    </div>
  );
}
