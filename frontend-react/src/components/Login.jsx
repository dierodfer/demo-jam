import { useState } from 'react';
import { login } from '../lib/api.js';
import Logo from './Logo.jsx';

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const user = await login(username, password);
      onLogin(user);
    } catch (err) {
      setError(err.status === 401 ? 'Usuario o contraseña no válidos' : 'No se pudo conectar con el servidor');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-page">
      <Logo className="login-logo" />
      <h1 className="login-title">Acceso al<br />Portal del Empleado</h1>
      <form className="login-form" onSubmit={submit}>
        <input
          placeholder="Usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" disabled={busy}>Entrar</button>
        <p className="login-error">{error}</p>
      </form>
      <div className="login-version">PEN version 2.9.5</div>
      <div className="login-copy">Nunegal Consulting ©</div>
    </div>
  );
}
