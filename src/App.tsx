import { useState } from 'react';
import { LoginForm } from './auth/LoginForm';
import { MisEventos } from './features/eventos/MisEventos';
import { EventoDetalle } from './features/eventos/EventoDetalle';
import { GestionUsuarios } from './features/usuarios/GestionUsuarios';
import { Proximamente } from './features/proximamente/Proximamente';
import type { Evento } from './domain/types';

type Vista = 'eventos' | 'usuarios' | 'hoy' | 'config';

// ARCHITECTURAL TRACE: Frontend — composición raíz y navegación
// La barra superior (app-nav) no aparece en las 6 imágenes de referencia
// (que muestran pantallas sueltas) — se añadió para poder moverse entre
// ellas dentro de una sola app; se mantiene deliberadamente discreta para
// no competir visualmente con las tarjetas del diseño original.
//
// ALCANCE DE ESTE SPRINT: solo "Mis eventos" y "Usuarios" están
// conectados a organizador_de_eventos_backend (Render + Supabase). "Hoy"
// y "Configuración" se dejan visibles pero sin conexión (Proximamente)
// porque esos endpoints no existen todavía en el backend.
export default function App() {
  const [autenticado, setAutenticado] = useState(!!localStorage.getItem('token'));
  const [vista, setVista] = useState<Vista>('eventos');
  const [eventoAbierto, setEventoAbierto] = useState<Evento | null>(null);

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
    setVista(nuevaVista);
  }

  return (
    <div className="app-shell">
      <nav className="app-nav">
        <div className="app-nav__tabs">
          <button className={`app-nav__tab ${vista === 'eventos' ? 'is-active' : ''}`} onClick={() => irA('eventos')}>Mis eventos</button>
          <button className={`app-nav__tab ${vista === 'usuarios' ? 'is-active' : ''}`} onClick={() => irA('usuarios')}>Usuarios</button>
          <button className={`app-nav__tab ${vista === 'hoy' ? 'is-active' : ''}`} onClick={() => irA('hoy')}>Hoy</button>
          <button className={`app-nav__tab ${vista === 'config' ? 'is-active' : ''}`} onClick={() => irA('config')}>Configuración</button>
        </div>
        <button className="app-nav__signout" onClick={cerrarSesion}>Cerrar sesión</button>
      </nav>

      {eventoAbierto ? (
        <EventoDetalle eventoInicial={eventoAbierto} onVolver={() => setEventoAbierto(null)} />
      ) : vista === 'eventos' ? (
        <MisEventos onAbrirEvento={setEventoAbierto} />
      ) : vista === 'usuarios' ? (
        <GestionUsuarios />
      ) : vista === 'hoy' ? (
        <Proximamente titulo="Hoy" />
      ) : (
        <Proximamente titulo="Configuración" />
      )}
    </div>
  );
}
