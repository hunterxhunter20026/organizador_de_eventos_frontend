import { useEffect, useState } from 'react';
import { usuariosApi } from '../../api/eventosApi';
import type { Usuario } from '../../domain/types';

// ARCHITECTURAL TRACE: Frontend feature — usuarios. Nueva pantalla, no
// presente en las imágenes de referencia originales del diseño; se
// mantiene la misma estética (card, field, btn) que el resto de la app.
// CRUD directo contra /api/usuarios (sin autenticación real todavía —
// UsuarioController no valida contraseñas ni emite tokens).
export function GestionUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [cargando, setCargando] = useState(true);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [limiteHorasDiarias, setLimiteHorasDiarias] = useState('6');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  function recargar() {
    setCargando(true);
    usuariosApi.listar().then(setUsuarios).finally(() => setCargando(false));
  }

  useEffect(() => { recargar(); }, []);

  function limpiarFormulario() {
    setNombre(''); setEmail(''); setPassword(''); setLimiteHorasDiarias('6');
    setEditandoId(null); setMostrarFormulario(false); setError(null);
  }

  function comenzarEdicion(u: Usuario) {
    setEditandoId(u.id);
    setNombre(u.nombre);
    setEmail(u.email);
    setPassword('');
    setLimiteHorasDiarias(u.limiteHorasDiarias != null ? String(u.limiteHorasDiarias) : '6');
    setMostrarFormulario(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const datos = {
      nombre,
      email,
      passwordHash: password,
      limiteHorasDiarias: limiteHorasDiarias ? Number(limiteHorasDiarias) : undefined
    };
    try {
      if (editandoId != null) {
        const actualizado = await usuariosApi.actualizar(editandoId, datos);
        setUsuarios(prev => prev.map(u => (u.id === actualizado.id ? actualizado : u)));
      } else {
        const creado = await usuariosApi.crear(datos);
        setUsuarios(prev => [...prev, creado]);
      }
      limpiarFormulario();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos guardar el usuario.');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este usuario? Sus eventos asociados también se eliminarán.')) return;
    await usuariosApi.eliminar(id);
    setUsuarios(prev => prev.filter(u => u.id !== id));
  }

  return (
    <div className="card">
      <h1 className="title">Usuarios</h1>
      <p className="subtitle">Organizadores registrados en el sistema.</p>

      {cargando && <p className="subtitle">Cargando…</p>}
      {!cargando && usuarios.length === 0 && !mostrarFormulario && (
        <p className="subtitle">Todavía no hay usuarios registrados.</p>
      )}

      {usuarios.map(u => (
        <div key={u.id} className="evento-row">
          <div className="evento-row__header">
            <span className="evento-row__nombre">{u.nombre}</span>
            <span className="evento-row__fecha">{u.email}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <span className="evento-row__fecha">
              Límite diario: {u.limiteHorasDiarias ?? '—'}h
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => comenzarEdicion(u)}>Editar</button>
              <button className="btn btn-outline btn-outline--danger" onClick={() => eliminar(u.id)}>Eliminar</button>
            </div>
          </div>
        </div>
      ))}

      {mostrarFormulario ? (
        <form onSubmit={guardar} style={{ marginTop: 8, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div className="field">
            <label htmlFor="usuario-nombre">Nombre</label>
            <input id="usuario-nombre" value={nombre} onChange={e => setNombre(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="usuario-email">Correo electrónico</label>
            <input id="usuario-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="usuario-password">Contraseña</label>
            <input id="usuario-password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                   required={editandoId == null} placeholder={editandoId != null ? 'Dejar igual si no la cambias' : ''} />
          </div>
          <div className="field">
            <label htmlFor="usuario-limite">Límite de horas diarias</label>
            <input id="usuario-limite" type="number" min={1} max={16} step={0.5}
                   value={limiteHorasDiarias} onChange={e => setLimiteHorasDiarias(e.target.value)} />
          </div>
          {error && <p className="error-text" role="alert">{error}</p>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : editandoId != null ? 'Guardar cambios' : 'Crear usuario'}
            </button>
            <button className="btn btn-outline" type="button" onClick={limpiarFormulario}>Cancelar</button>
          </div>
        </form>
      ) : (
        <button className="btn btn-outline" style={{ marginTop: 8 }} onClick={() => setMostrarFormulario(true)}>
          + Nuevo usuario
        </button>
      )}
    </div>
  );
}
