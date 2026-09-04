// src/pages/Login.jsx
import { useState } from 'react';
import { supabase } from '../services/supabase';
import { Lock, Mail, AlertCircle, Eye, EyeOff, ShieldCheck, Loader2 } from 'lucide-react';
import logo from "../public/Logo.png";
import '../styles/global.css';
import '../styles/login.css';

export default function Login({ setSession }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (authError) {
        setError('Credenciales inválidas. Verifique su correo y contraseña.');
        return;
      }

      if (data?.session) {
        setSession(data.session);
      }
    } catch (err) {
      console.error("Error al autenticar:", err.message);
      setError('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Identidad de Marca */}
        <div className="login-brand" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img 
            src={logo} 
            alt="Data Stockear" 
            style={{ maxWidth: '140px', height: 'auto', opacity: 0.95 }} 
          />
        </div>

        <div className="login-header">
          <h2>Acceso a .DATA</h2>
          <p>Autenticación de operador para Data Stockear</p>
        </div>

        <form onSubmit={handleLogin} className="login-form">
          {error && (
            <div className="error-message" role="alert">
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Campo Correo */}
          <div className="form-group">
            <label htmlFor="login-email">
              <Mail size={14} style={{ color: 'var(--color-accent)' }} /> 
              Correo Electrónico
            </label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
              placeholder="operador@datastockear.com"
              disabled={loading}
            />
          </div>

          {/* Campo Contraseña con Toggle de Visibilidad */}
          <div className="form-group">
            <label htmlFor="login-password">
              <Lock size={14} style={{ color: 'var(--color-accent)' }} /> 
              Contraseña
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                disabled={loading}
                style={{ paddingRight: '40px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'none',
                  border: 'none',
                  color: 'var(--color-text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: 0
                }}
                title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Botón de Autenticación */}
          <button 
            type="submit" 
            className="btn-primary btn-full" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="btn-spinner" style={{ animation: 'spin 0.7s linear infinite' }} />
                <span>Verificando credenciales...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Ingresar al Panel</span>
              </>
            )}
          </button>
        </form>

       
      </div>
    </div>
  );
}