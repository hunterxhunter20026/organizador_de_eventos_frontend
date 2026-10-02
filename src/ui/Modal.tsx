import { useEffect, useRef } from 'react';

// Modal accesible: atrapa el foco, lo mueve al título al abrir,
// lo devuelve al control de origen al cerrar y cierra con Escape.
export function Modal({
  titulo,
  children,
  acciones,
  onCerrar,
  urgente = false
}: {
  titulo: string;
  children: React.ReactNode;
  acciones: React.ReactNode;
  onCerrar: () => void;
  urgente?: boolean; // true para errores (role="alert"), false para confirmaciones (role="status")
}) {
  const dialogoRef = useRef<HTMLDivElement>(null);
  const tituloRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const origen = document.activeElement as HTMLElement | null;
    tituloRef.current?.focus();
    return () => origen?.focus();
  }, []);

  function manejarTeclas(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onCerrar();
      return;
    }
    if (e.key !== 'Tab') return;
    const focoables = dialogoRef.current?.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (!focoables || focoables.length === 0) return;
    const primero = focoables[0];
    const ultimo = focoables[focoables.length - 1];
    if (e.shiftKey && (document.activeElement === primero || document.activeElement === tituloRef.current)) {
      e.preventDefault();
      ultimo.focus();
    } else if (!e.shiftKey && document.activeElement === ultimo) {
      e.preventDefault();
      primero.focus();
    }
  }

  return (
    <div className="modal-overlay" onKeyDown={manejarTeclas}>
      <div
        ref={dialogoRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
      >
        <h2 id="modal-titulo" ref={tituloRef} tabIndex={-1} className="modal__titulo">{titulo}</h2>
        <div className="modal__cuerpo" role={urgente ? 'alert' : 'status'}>{children}</div>
        <div className="modal__acciones">{acciones}</div>
      </div>
    </div>
  );
}