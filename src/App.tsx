import { useState } from 'react';
import { LoginForm } from './auth/LoginForm';
import { MisEventos } from './features/eventos/MisEventos';
import { EventoDetalle } from './features/eventos/EventoDetalle';
import { GestionUsuarios } from './features/usuarios/GestionUsuarios';
import { Hoy } from './features/hoy/Hoy';
import { Configuracion } from './features/configuracion/Configuracion';
import type { Evento } from './domain/types';
import { IconoHoy, IconoEventos, IconoUsuarios, IconoConfig, IconoSalir } from './ui/Iconos';

type Vista = 'eventos' | 'usuarios' | 'hoy' | 'config';

const ITEMS: { id: Vista; etiqueta: string; icono: React.ReactNode }[] = [
  { id: 'hoy', etiqueta: 'Hoy', icono: <IconoHoy /> },
  { id: 'eventos', etiqueta: 'Mis eventos', icono: <IconoEventos /> },
 // { id: 'usuarios', etiqueta: 'Usuarios', icono: <IconoUsuarios /> },
  { id: 'config', etiqueta: 'Configuración', icono: <IconoConfig /> }
];

// Composición raíz: barra lateral + contenido. Las cuatro secciones (Hoy, Mis
// eventos, Usuarios y Configuración) están conectadas al backend.
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
    localStorage.removeItem('usuarioNombre');
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
          <div className="sidebar__brand">
            <img className="sidebar__logo" src="/Hormigapp.png" alt="" />
            <span className="sidebar__nombre">
              Hormig<span className="sidebar__nombre-app">App</span>
            </span>
          </div>
          <nav className="sidebar__nav" aria-label="Navegación principal">
            {ITEMS.map(item => (
              <button
                key={item.id}
                className={`sidebar__item ${vista === item.id ? 'is-active' : ''}`}
                aria-current={vista === item.id ? 'page' : undefined}
                onClick={() => irA(item.id)}
              >
                {item.icono}
                <span>{item.etiqueta}</span>
              </button>
            ))}
          </nav>
          <div className="sidebar__footer">
            <button className="sidebar__item" onClick={cerrarSesion}>
              <IconoSalir />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </aside>
      <main className="layout__main">
        {eventoAbierto ? (
          <EventoDetalle eventoInicial={eventoAbierto} onVolver={() => setEventoAbierto(null)} />
        ) : vista === 'eventos' ? (
          <MisEventos onAbrirEvento={setEventoAbierto} abrirFormulario={crearAlEntrar} />
       // ) : vista === 'usuarios' ? (
        //  <GestionUsuarios />
        ) : vista === 'hoy' ? (
          <Hoy onAbrirEvento={setEventoAbierto} onCrearEvento={irACrearEvento} />
        ) : (
          <Configuracion />
        )}
      </main>
    </div>
  );
}