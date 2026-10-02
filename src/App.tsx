import { useState } from 'react';
import { LoginForm } from './auth/LoginForm';
import { MisEventos } from './features/eventos/MisEventos';
import { EventoDetalle } from './features/eventos/EventoDetalle';
import { GestionUsuarios } from './features/usuarios/GestionUsuarios';
import { Hoy } from './features/hoy/Hoy';
import { Proximamente } from './features/proximamente/Proximamente';
import type { Evento } from './domain/types';

type Vista = 'eventos' | 'usuarios' | 'hoy' | 'config';

const ITEMS: { id: Vista; etiqueta: string }[] = [
  { id: 'hoy', etiqueta: 'Hoy' },
  { id: 'eventos', etiqueta: 'Mis eventos' },
  { id: 'usuarios', etiqueta: 'Usuarios' },
  { id: 'config', etiqueta: 'Configuración' }
];

// Composición raíz: barra lateral + contenido. "Hoy", "Mis eventos" y "Usuarios"
// están conectados al backend; "Configuración" sigue como "Próximamente".
export default function App() {
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem('token'));
  const [vista, setVista] = useState<Vista>('eventos');
  const [eventoAbierto, setEventoAbierto] = useState<Evento | null>(null);
  const [crearAlEntrar, setCrearAlEntrar] = useState(false);
  if (!autenticado) {
    return <LoginForm onAutenticado={() => setAutenticado(true)} />;
  }

  function cerrarSesion() {
    localStorage.removeItem('token');
    setAutenticado(false);
    setEventoAbierto(null);
  }

  function irA(nuevaVista: Vista) {
  setEventoAbierto(null);
  setCrearAlEntrar(false);
  setVista(nuevaVista);
  }
  function irACrearEvento() {
    setEventoAbierto(null);
    setCrearAlEntrar(true);
    setVista('eventos');
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar__brand">Organizador</div>
        <nav className="sidebar__nav" aria-label="Navegación principal">
          {ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar__item ${vista === item.id ? 'is-active' : ''}`}
              aria-current={vista === item.id ? 'page' : undefined}
              onClick={() => irA(item.id)}
            >
              {item.etiqueta}
            </button>
          ))}
        </nav>
        <div className="sidebar__footer">
          <button className="sidebar__item" onClick={cerrarSesion}>Cerrar sesión</button>
        </div>
      </aside>

      <main className="layout__main">
        {eventoAbierto ? (
          <EventoDetalle eventoInicial={eventoAbierto} onVolver={() => setEventoAbierto(null)} />
        ) : vista === 'eventos' ? (
          <MisEventos onAbrirEvento={setEventoAbierto} abrirFormulario={crearAlEntrar} />
        ) : vista === 'usuarios' ? (
          <GestionUsuarios />
        ) : vista === 'hoy' ? (
          <Hoy onAbrirEvento={setEventoAbierto} onCrearEvento={irACrearEvento} />
        ) : (
          <Proximamente titulo="Configuración" />
        )}
      </main>
    </div>
  );
}