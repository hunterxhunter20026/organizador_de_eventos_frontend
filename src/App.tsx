import { useEffect, useState } from 'react';
import { LoginForm } from './auth/LoginForm';
import { MisEventos } from './features/eventos/MisEventos';
import { EventoDetalle } from './features/eventos/EventoDetalle';
import { GestionUsuarios } from './features/usuarios/GestionUsuarios';
import { Hoy } from './features/hoy/Hoy';
import { Configuracion } from './features/configuracion/Configuracion';
import type { Evento } from './domain/types';
import { IconoHoy, IconoEventos, IconoUsuarios, IconoConfig, IconoSalir } from './ui/Iconos';
import { EVENTO_SESION_INVALIDA, leerToken, limpiarSesion } from './auth/sesion';
import { authApi } from './api/authApi';

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
  const [autenticado, setAutenticado] = useState(false);
  const [verificandoSesion, setVerificandoSesion] = useState(!!leerToken());
  const [vista, setVista] = useState<Vista>('eventos');
  const [eventoAbierto, setEventoAbierto] = useState<Evento | null>(null);
  const [crearAlEntrar, setCrearAlEntrar] = useState(false);

  useEffect(() => {
    let cancelado = false;

    async function confirmarSesion(){
      if (!leerToken()) {
        setAutenticado(false);
        setVerificandoSesion(false);
        return;
      }
      try {
        await authApi.sesion();
        if (!cancelado) setAutenticado(true);
      } catch {
        if (!cancelado) {
          limpiarSesion();
          setAutenticado(false);
        }
      } finally {
        if (!cancelado) setVerificandoSesion(!false);
      }
    }

    void confirmarSesion();

    function alInvalidarSesion() {
      setAutenticado(false);
      setEventoAbierto(null);
    }

    window.addEventListener(EVENTO_SESION_INVALIDA, alInvalidarSesion);
    return () => {
      cancelado = true; 
      window.removeEventListener(EVENTO_SESION_INVALIDA, alInvalidarSesion);
    };
  }, []);

  if (verificandoSesion) {
    return (
      <div className='login-page'>
        <p className='helper-text' role='status'>Comprobando su inicio de sesion, por favor espere un momento</p>
      </div>
    )
  }


  if (!autenticado) {
    return <LoginForm onAutenticado={() => setAutenticado(true)} />;
  }

  function cerrarSesion() {
    limpiarSesion();
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
  function abrirEvento(evento: Evento) {
    setEventoAbierto(evento);
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
          <EventoDetalle
            eventoInicial={eventoAbierto}
            onVolver={() => setEventoAbierto(null)}
          />
        ) : vista === 'eventos' ? (
          <MisEventos onAbrirEvento={abrirEvento} abrirFormulario={crearAlEntrar} />
       // ) : vista === 'usuarios' ? (
        //  <GestionUsuarios />
        ) : vista === 'hoy' ? (
          <Hoy onAbrirEvento={evento => abrirEvento(evento)} onCrearEvento={irACrearEvento} />
        ) : (
          <Configuracion />
        )}
      </main>
    </div>
  );
}