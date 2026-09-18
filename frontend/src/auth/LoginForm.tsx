import { useState } from 'react';
import { authApi } from '../api/eventosApi';

// ARCHITECTURAL TRACE: Frontend feature — auth. Traza: US-021
// Diseño: Imagen 6 (pantalla "Bienvenida de vuelta")
export function LoginForm({ onAutenticado }: { onAutenticado: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function manejarSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const { token } = await authApi.login(email, password);
      localStorage.setItem('token', token);
      onAutenticado();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos iniciar tu sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="app-shell" style={{ justifyContent: 'center' }}>
      <div className="card card--narrow" style={{ textAlign: 'center' }}>
        <h1 className="title">Bienvenida de vuelta</h1>
        <p className="subtitle">Organiza tus eventos sin fricción.</p>

        <form onSubmit={manejarSubmit} style={{ textAlign: 'left' }}>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          {error && <p className="error-text" role="alert">{error}</p>}
          <button className="btn btn-primary" type="submit" disabled={cargando}>
            {cargando ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
