import { useState } from 'react';
import { authApi } from '../api/authApi';
import { usuariosApi } from '../api/eventosApi';

// ARCHITECTURAL TRACE: Frontend feature — auth (US-11). Traza: US-021
// Login real contra POST /api/auth/login (el backend emite el token firmado y
// AuthFilter lo exige en casi toda la API) + registro conectado a
// POST /api/usuarios, la única ruta de escritura pública además del login.
// Microcopy y validaciones según la Guía de Diseño (errores inline en rojo bajo el campo).

type Modo = 'login' | 'registro';
type ErroresRegistro = { nombre?: string; email?: string; password?: string };

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const estiloEnlace: React.CSSProperties = {
  background: 'none',
  border: 'none',
  padding: 0,
  font: 'inherit',
  color: 'inherit',
  textDecoration: 'underline',
  cursor: 'pointer'
};

export function LoginForm({ onAutenticado }: { onAutenticado: () => void }) {
  const [modo, setModo] = useState<Modo>('login');
  const [aviso, setAviso] = useState<string | null>(null);

  // Login
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  // Registro
  const [nombreReg, setNombreReg] = useState('');
  const [emailReg, setEmailReg] = useState('');
  const [passwordReg, setPasswordReg] = useState('');
  const [erroresReg, setErroresReg] = useState<ErroresRegistro>({});
  const [errorGuardar, setErrorGuardar] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function manejarLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setAviso(null);
    if (!email.trim() || !password) {
      setError('Escribe tu correo y tu contraseña para continuar.');
      return;
    }
    setCargando(true);
    try {
      const { token, usuario } = await authApi.login(email.trim(), password);
      localStorage.setItem('token', token);
      localStorage.setItem('usuarioNombre', usuario.nombre);
      onAutenticado();
    } catch (err) {
      // El backend nunca revela si el correo existe o la contraseña es incorrecta
      // (US-11, Escenario 2): se muestra tal cual su mensaje genérico.
      setError(err instanceof Error ? err.message : 'No pudimos iniciar tu sesión.');
    } finally {
      setCargando(false);
    }
  }

  function validarRegistro(): ErroresRegistro {
    const errores: ErroresRegistro = {};
    if (!nombreReg.trim()) errores.nombre = 'Escribe tu nombre para continuar.';
    if (!emailReg.trim()) errores.email = 'Escribe tu correo electrónico para continuar.';
    else if (!EMAIL_VALIDO.test(emailReg.trim())) errores.email = 'Escribe un correo válido, por ejemplo nombre@correo.com.';
    if (!passwordReg) errores.password = 'Escribe una contraseña para continuar.';
    return errores;
  }

  async function manejarRegistro(e: React.FormEvent) {
    e.preventDefault();
    setErrorGuardar(null);

    const errores = validarRegistro();
    setErroresReg(errores);
    if (Object.keys(errores).length > 0) return;

    setGuardando(true);
    try {
      const correo = emailReg.trim();

      // ¿Ya existe un usuario con ese correo? (si no existe, el back responde error y seguimos)
      let duplicado = false;
      try {
        await usuariosApi.buscarPorEmail(correo);
        duplicado = true;
      } catch {
        duplicado = false;
      }
      if (duplicado) {
        setErroresReg({ email: 'Ya existe un usuario con este correo. Prueba con otro.' });
        return;
      }

      await usuariosApi.crear({
        nombre: nombreReg.trim(),
        email: correo,
        passwordHash: passwordReg
      });

      // Éxito: volver al login con el correo ya escrito y un aviso de confirmación
      setEmail(correo);
      setPassword('');
      setNombreReg('');
      setEmailReg('');
      setPasswordReg('');
      setErroresReg({});
      setAviso('Tu cuenta se creó correctamente. Ya puedes iniciar sesión.');
      setModo('login');
    } catch (err) {
      // Se conservan los datos del formulario; si el backend explica el rechazo (p. ej. correo repetido) se muestra.
      setErrorGuardar(err instanceof Error && err.message ? err.message : 'No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.');
    } finally {
      setGuardando(false);
    }
  }

  function irA(nuevoModo: Modo) {
    setModo(nuevoModo);
    setError(null);
    setErrorGuardar(null);
    setErroresReg({});
    if (nuevoModo === 'registro') setAviso(null);
  }

    const marca = (
    <header className="login-marca">
      <h1 className="login-marca__nombre">Hormig<span>App</span></h1>
      <p className="login-marca__lema">Manteniendo todo en orden y sin prisa</p>
    </header>
  );

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-card__form">
          {marca}

          {modo === 'login' ? (
            <>
              {aviso && <p className="login-aviso" role="status">{aviso}</p>}

              <form onSubmit={manejarLogin} noValidate>
                <div className="field">
                  <label htmlFor="email">Correo electrónico</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div className="field">
                  <label htmlFor="password">Contraseña</label>
                  <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                {error && <p className="error-text" role="alert">{error}</p>}
                <button className="btn btn-primary" type="submit" disabled={cargando}>
                  {cargando ? 'Entrando...' : 'Iniciar sesión'}
                </button>
              </form>

              <p className="helper-text">
                ¿No tienes cuenta?{' '}
                <button type="button" style={estiloEnlace} onClick={() => irA('registro')}>
                  Créala aquí
                </button>
              </p>
            </>
          ) : (
            <>
              <h2 className="login-subtitulo">Crear cuenta</h2>

              <form onSubmit={manejarRegistro} noValidate>
                <div className="field">
                  <label htmlFor="nombre-reg">Nombre *</label>
                  <input
                    id="nombre-reg"
                    type="text"
                    placeholder="Ej: María Pérez"
                    value={nombreReg}
                    onChange={e => setNombreReg(e.target.value)}
                    aria-invalid={!!erroresReg.nombre}
                    aria-describedby={erroresReg.nombre ? 'nombre-reg-error' : undefined}
                  />
                  {erroresReg.nombre && <p id="nombre-reg-error" className="error-text" role="alert">{erroresReg.nombre}</p>}
                </div>

                <div className="field">
                  <label htmlFor="email-reg">Correo electrónico *</label>
                  <input
                    id="email-reg"
                    type="email"
                    placeholder="Ej: nombre@correo.com"
                    value={emailReg}
                    onChange={e => setEmailReg(e.target.value)}
                    aria-invalid={!!erroresReg.email}
                    aria-describedby={erroresReg.email ? 'email-reg-error' : undefined}
                  />
                  {erroresReg.email && <p id="email-reg-error" className="error-text" role="alert">{erroresReg.email}</p>}
                </div>

                <div className="field">
                  <label htmlFor="password-reg">Contraseña *</label>
                  <input
                    id="password-reg"
                    type="password"
                    value={passwordReg}
                    onChange={e => setPasswordReg(e.target.value)}
                    aria-invalid={!!erroresReg.password}
                    aria-describedby={erroresReg.password ? 'password-reg-error' : undefined}
                  />
                  {erroresReg.password && <p id="password-reg-error" className="error-text" role="alert">{erroresReg.password}</p>}
                </div>

                {errorGuardar && <p className="error-text" role="alert">{errorGuardar}</p>}

                <button className="btn btn-primary" type="submit" disabled={guardando}>
                  {guardando ? 'Creando cuenta...' : 'Crear cuenta'}
                </button>
              </form>

              <p className="helper-text">
                ¿Ya tienes cuenta?{' '}
                <button type="button" style={estiloEnlace} onClick={() => irA('login')}>
                  Inicia sesión
                </button>
              </p>
            </>
          )}
        </div>

        <div className="login-card__imagen">
          <img src="/hormigas-login.png" alt="" />
        </div>
      </div>
    </div>
  );
}