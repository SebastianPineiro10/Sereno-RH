import React, { useState } from 'react';
import Card from '../components/Card';
import { STORAGE_KEYS } from '../lib/storage';
import './login.css'; // <- estilos del layout dividido (nuevo)

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      onLogin(email, password);
    } else {
      setError('Por favor, ingresa el correo y la contraseña.');
    }
  };

  return (
    <div className="login-container">
      <h1 className="login-title">Bienvenido a Sereno RH</h1>
      <p className="login-subtitle">Ingresa tus credenciales para continuar</p>

      <form onSubmit={handleSubmit} className="glass-card login-form mt-8">
        <h3 className="card-title text-center">Iniciar Sesión</h3>

        {error && <p className="error-message">{error}</p>}

        <div className="form-group">
          <label htmlFor="login-email">Correo:</label>
          <input
            type="email"
            id="login-email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(null); }}
            className="glass-input"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="login-password">Contraseña:</label>
          <input
            type="password"
            id="login-password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError(null); }}
            className="glass-input"
            required
          />
        </div>

        <button type="submit" className="button primary w-full mt-4">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
               viewBox="0 0 24 24" fill="none" stroke="currentColor"
               strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
               className="lucide lucide-log-in" aria-hidden="true">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" x2="3" y1="12" y2="12"/>
          </svg>
          Ingresar
        </button>

        <div className="mt-4 text-sm text-center text-white/70">
          <p>Credenciales para probar:</p>
          <p><strong className="text-white">Admin:</strong> admin@serenorh.com / admin123</p>
          <p><strong className="text-white">Empleado:</strong> empleado@serenorh.com / empleado123</p>
          <p><strong className="text-white">Empleado:</strong> marta.lopez@serenorh.com / martha123</p>
        </div>
      </form>
    </div>
  );
};

export default Login;
